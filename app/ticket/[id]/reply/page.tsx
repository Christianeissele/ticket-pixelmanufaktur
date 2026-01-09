"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/app/lib/supabase";
import styles from "./reply.module.css";

/* ================= TYPES ================= */

type TicketWithCustomer = {
  id: string;
  title: string;
  customers: {
    name: string | null;
    email: string | null;
  } | null;
};

/* ================= PAGE ================= */

export default function ReplyPage() {
  const params = useParams<{ id: string }>();
  const ticketId = params?.id;

  const [ticket, setTicket] = useState<TicketWithCustomer | null>(null);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  /* ================= LOAD TICKET + CUSTOMER ================= */

  useEffect(() => {
    if (!ticketId) return;

    const loadTicket = async () => {
      setLoading(true);

      const { data, error } = await supabase
        .from("tickets")
        .select(`
          id,
          title,
          customers (
            name,
            email
          )
        `)
        .eq("id", ticketId)
        .single<TicketWithCustomer>();

      if (error) {
        console.error("Ticket laden fehlgeschlagen:", error);
        setTicket(null);
      } else {
        setTicket(data);
      }

      setLoading(false);
    };

    loadTicket();
  }, [ticketId]);

  /* ================= SEND MESSAGE + EMAIL ================= */

  async function send() {
  if (!text.trim() || !ticket?.customers?.email) return;

  const res = await fetch("/api/send-email", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      to: ticket.customers.email,
      subject: `Re: ${ticket.title} [Ticket#${ticket.id}]`,
      html: `<p>${text.replace(/\n/g, "<br />")}</p>`,
    }),
  });

  const data = await res.json();
  console.log("SEND EMAIL RESPONSE:", res.status, data);

  if (!res.ok) {
    alert("Fehler beim Senden:\n" + (data.error ?? "Unbekannt"));
    return;
  }

  await supabase.from("messages").insert({
    ticket_id: ticket.id,
    sender_type: "support",
    content: text,
  });

  setText("");
  alert("E-Mail gesendet ✔️");
}

  /* ================= RENDER ================= */

  if (loading) {
    return <main className={styles.page}>Lade…</main>;
  }

  if (!ticket) {
    return <main className={styles.page}>Ticket nicht gefunden</main>;
  }

  const customerLabel = ticket.customers
    ? `${ticket.customers.name ?? "Unbekannter Kunde"} <${
        ticket.customers.email ?? "keine E-Mail"
      }>`
    : "Kein Kunde verknüpft";

  const subject = `Re: ${ticket.title} [Ticket#${ticket.id}]`;

  return (
    <main className={styles.page}>
      <div className={styles.mailCard}>
        <h1 className={styles.title}>Antwort schreiben</h1>

        {/* ===== MAIL HEADER ===== */}
        <div className={styles.mailHeader}>
          <div className={styles.mailRow}>
            <span className={styles.label}>An</span>
            <span className={styles.value}>{customerLabel}</span>
          </div>

          <div className={styles.mailRow}>
            <span className={styles.label}>Betreff</span>
            <span className={styles.value}>{subject}</span>
          </div>
        </div>

        {/* ===== MESSAGE ===== */}
        <textarea
          className={styles.textarea}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Antwort an den Kunden schreiben …"
        />

        {/* ===== ACTIONS ===== */}
        <div className={styles.actions}>
          <button
            className={styles.send}
            onClick={send}
            disabled={sending}
          >
            {sending ? "Sende…" : "Senden"}
          </button>
        </div>
      </div>
    </main>
  );
}