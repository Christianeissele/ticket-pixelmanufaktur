import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/app/lib/supabase-admin";

/**
 * Postmark Inbound Webhook
 * - Erstellt Tickets aus E-Mails
 * - Fügt Messages hinzu
 * - Unterstützt Mails mit / ohne Text / nur Anhang
 * - Speichert Anhänge in Supabase Storage + ticket_attachments
 */

export async function POST(req: Request) {
  try {
    const mail = await req.json();

    /* ================= Basics ================= */

    const fromEmail: string | undefined =
      mail.From ?? mail.FromFull?.Email;

    if (!fromEmail) {
      // ❌ Postmark-Fehler vermeiden → trotzdem 200 zurückgeben
      return NextResponse.json(
        { error: "From-Adresse fehlt" },
        { status: 200 }
      );
    }

    const subject = mail.Subject ?? "Kein Betreff";

    // ✅ WICHTIG: Fallback für Anhänge
    const content =
      mail.TextBody?.trim() ||
      mail.HtmlBody?.trim() ||
      mail.StrippedTextReply?.trim() ||
      "(Kein Textinhalt – Nachricht enthält nur Anhänge)";

    /* ================= Ticket-ID prüfen ================= */

    const ticketMatch = subject.match(/\[Ticket#([a-zA-Z0-9-]+)\]/);
    const ticketId = ticketMatch?.[1];

    /* ====================================================
       ========== Antwort auf bestehendes Ticket ==========
       ==================================================== */

    if (ticketId) {
      const { error } = await supabaseAdmin
        .from("messages")
        .insert({
          ticket_id: ticketId,
          sender_type: "customer",
          content
        });

      if (error) {
        console.error(error);
        return NextResponse.json(
          { error: "Message konnte nicht gespeichert werden" },
          { status: 500 }
        );
      }

      /* ===== Anhänge bei Antwort ===== */
      await handleAttachments({
        attachments: mail.Attachments,
        ticketId,
        uploadedBy: fromEmail
      });

      return NextResponse.json({
        ok: true,
        mode: "reply",
        ticket_id: ticketId
      });
    }

    /* ====================================================
       ================= Customer suchen ==================
       ==================================================== */

    const { data: customer } = await supabaseAdmin
      .from("customers")
      .select("id")
      .eq("email", fromEmail)
      .maybeSingle();

    const customerId = customer?.id ?? null;

    /* ====================================================
       ================= Ticket erstellen =================
       ==================================================== */

    const { data: ticket, error: ticketError } = await supabaseAdmin
      .from("tickets")
      .insert({
        title: subject,
        customer_id: customerId,
        status: "offen"
      })
      .select()
      .single();

    if (ticketError || !ticket) {
      console.error(ticketError);
      return NextResponse.json(
        { error: "Ticket konnte nicht erstellt werden" },
        { status: 500 }
      );
    }

    /* ====================================================
       ================= Erste Message ====================
       ==================================================== */

    const { error: messageError } = await supabaseAdmin
      .from("messages")
      .insert({
        ticket_id: ticket.id,
        sender_type: "customer",
        content
      });

    if (messageError) {
      console.error(messageError);
      return NextResponse.json(
        { error: "Nachricht konnte nicht gespeichert werden" },
        { status: 500 }
      );
    }

    /* ================= Anhänge ================= */

    await handleAttachments({
      attachments: mail.Attachments,
      ticketId: ticket.id,
      uploadedBy: fromEmail
    });

    /* ================= Erfolg ================= */

    return NextResponse.json({
      ok: true,
      mode: "new_ticket",
      ticket_id: ticket.id,
      customer_id: customerId
    });

  } catch (err) {
    console.error("Inbound-Email Fehler:", err);

    // ❗ Postmark will KEIN 4xx bei gültigen Mails
    return NextResponse.json(
      { error: "Serverfehler" },
      { status: 200 }
    );
  }
}

/* ======================================================
   ================= ATTACHMENT HELPER ==================
   ====================================================== */

async function handleAttachments({
  attachments,
  ticketId,
  uploadedBy
}: {
  attachments?: any[];
  ticketId: string;
  uploadedBy: string;
}) {
  if (!attachments || attachments.length === 0) return;

  for (const file of attachments) {
    try {
      const buffer = Buffer.from(file.Content, "base64");

      const storagePath = `${ticketId}/${Date.now()}-${file.Name}`;

      // 🔹 Upload in Supabase Storage
      const { error: uploadError } = await supabaseAdmin
        .storage
        .from("ticket-attachments")
        .upload(storagePath, buffer, {
          contentType: file.ContentType,
          upsert: false
        });

      if (uploadError) {
        console.error("Storage Upload Error:", uploadError);
        continue;
      }

      // 🔹 Metadaten speichern
      await supabaseAdmin
        .from("ticket_attachments")
        .insert({
          ticket_id: ticketId,
          file_name: file.Name,
          file_type: file.ContentType,
          file_size: file.ContentLength,
          storage_bucket: "ticket-attachments",
          storage_path: storagePath,
          uploaded_by: uploadedBy
        });

    } catch (err) {
      console.error("Attachment Fehler:", err);
    }
  }
}