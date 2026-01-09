import { supabaseAdmin } from "../app/lib/supabase-admin";

type EmailInput = {
  from: string;
  subject: string;
  text: string;
  messageId?: string;
};

export async function createTicketFromEmail(email: EmailInput) {
  // 1. Customer suchen
  const { data: customer } = await supabaseAdmin
    .from("customers")
    .select("*")
    .eq("email", email.from)
    .single();

  if (!customer) {
    console.log("❌ Kein Customer gefunden für:", email.from);
    return;
  }

  // 2. Ticket anlegen
  const { data: ticket, error } = await supabaseAdmin
    .from("tickets")
    .insert({
      customer_id: customer.id,
      title: email.subject || "E-Mail Anfrage",
      status: "open",
      source: "email",
    })
    .select()
    .single();

  if (error || !ticket) {
    throw error;
  }

  // 3. Erste Nachricht speichern
  await supabaseAdmin.from("messages").insert({
    ticket_id: ticket.id,
    sender_type: "customer",
    content: email.text,
    external_message_id: email.messageId ?? null,
  });

  console.log("✅ Ticket erstellt:", ticket.id);
}