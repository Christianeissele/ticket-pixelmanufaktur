"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { supabase } from "@/app/lib/supabase";
import styles from "./ticket.module.css";
import type { TicketCategory } from "@/app/lib/classification";
import { TICKET_CATEGORIES } from "@/app/lib/classification";
/* ================= TYPES ================= */

type Ticket = {
  id: string;
  title: string;
  status: "offen" | "in_bearbeitung" | "geschlossen" | null;
  priority: "niedrig" | "normal" | "hoch" | "kritisch" | null;
  assignee: string | null;
  category: TicketCategory | null;   // ✅ FEHLTE
  created_at: string;
  customers: {
    name: string | null;
    email: string | null;
  } | null;
};

type Message = {
  id: string;
  sender_type: "customer" | "support";
  content: string;
  created_at: string;
};

type TimeEntry = {
  id: string;
  ticket_id: string;
  duration_seconds: number;
  created_at: string;
  user_name: string;
};

/* ================= PAGE ================= */

export default function TicketPage() {
  const params = useParams();
  const ticketId = (params?.id as string) || "";

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [lastMessage, setLastMessage] = useState<Message | null>(null);
  const [loading, setLoading] = useState(true);
  
  /* ===== ZEIT ===== */
  const [showTimePanel, setShowTimePanel] = useState(false);
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [seconds, setSeconds] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const [startedAt, setStartedAt] = useState<number | null>(null); // ✅ NEU (für Persistenz)

  /* ================= LOAD DATA ================= */
useEffect(() => {
  supabase.auth.getSession().then(({ data }) => {
    if (!data.session) {
      window.location.href = "/login";
    }
  });
}, []);
  useEffect(() => {
    if (!ticketId) return;

    const loadData = async () => {
      setLoading(true);

      const { data: ticketData, error: ticketError } = await supabase
  .from("tickets")
  .select(`
    id,
    title,
    status,
    priority,
    assignee,
    category,
    created_at,
    customers!left (
      name,
      email
    )
  `)
  .eq("id", ticketId)
  .single();
    
      if (ticketError || !ticketData) {
        console.error("Ticket laden fehlgeschlagen:", ticketError);
        setTicket(null);
        setLastMessage(null);
        setLoading(false);
        return;
      }

      const normalizedTicket: Ticket = {
  ...ticketData,
  customers: Array.isArray(ticketData.customers)
    ? ticketData.customers[0] ?? null
    : ticketData.customers ?? null,
};

setTicket(normalizedTicket);



      const { data: messages, error: msgError } = await supabase
        .from("messages")
        .select("*")
        .eq("ticket_id", ticketId)
        .order("created_at", { ascending: false })
        .limit(1);

      if (msgError) console.error("Messages laden fehlgeschlagen:", msgError);

      setLastMessage((messages?.[0] as Message) ?? null);

      /* ===== ZEITEN LADEN ===== */
      const { data: times } = await supabase
        .from("ticket_time_entries")
        .select("*")
        .eq("ticket_id", ticketId)
        .order("created_at", { ascending: false });

      setTimeEntries((times as TimeEntry[]) ?? []);

      setLoading(false);
    };

    loadData();
  }, [ticketId]);

  /* ================= TIMER RESTORE (✅ NEU) =================
     Lädt laufenden Timer aus localStorage, wenn du zurückkommst
  */
useEffect(() => {
  if (!ticketId) return;

  fetch(`/api/ticket/${ticketId}/mark-read`, {
    method: "POST",
  });
}, [ticketId]);
  useEffect(() => {
    if (!ticketId) return;

    const stored = localStorage.getItem(`ticket-timer-${ticketId}`);
    if (!stored) return;

    try {
      const parsed = JSON.parse(stored) as { startedAt?: number };
      if (!parsed.startedAt) return;

      const elapsed = Math.floor((Date.now() - parsed.startedAt) / 1000);

      setStartedAt(parsed.startedAt);
      setSeconds(elapsed);
      setTimerRunning(true);
    } catch {
      // falls kaputt -> aufräumen
      localStorage.removeItem(`ticket-timer-${ticketId}`);
    }
    setShowTimePanel(true);
  }, [ticketId]);

  /* ================= TIMER (✅ angepasst) ================= */

  useEffect(() => {
    if (!timerRunning || !startedAt) return;

    const interval = setInterval(() => {
      setSeconds(Math.floor((Date.now() - startedAt) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [timerRunning, startedAt]);

  function startTimer() {
    if (!ticketId) return;

    const now = Date.now();
    setStartedAt(now);
    setTimerRunning(true);
    setSeconds(0);

    localStorage.setItem(
      `ticket-timer-${ticketId}`,
      JSON.stringify({ startedAt: now })
    );
  }

  function stopTimer() {
    setTimerRunning(false);
    // ✅ WICHTIG: NICHT löschen -> sonst kannst du nach Stop nicht mehr speichern
    // localStorage bleibt absichtlich stehen, bis gespeichert oder neu gestartet wird
  }
  function discardTime() {
  setTimerRunning(false);
  setSeconds(0);
  setStartedAt(null);

  localStorage.removeItem(`ticket-timer-${ticketId}`);
}

  async function saveTime() {
    if (!ticketId || seconds === 0) return;

    const { data, error } = await supabase
      .from("ticket_time_entries")
      .insert({
        ticket_id: ticketId,
        duration_seconds: seconds,
        user_name: "christian",
      })
      .select()
      .single();

    if (error) {
      alert("Zeit konnte nicht gespeichert werden");
      return;
    }

    setTimeEntries((prev) => [data as TimeEntry, ...prev]);

    // ✅ Reset + Persistenz löschen (weil abgeschlossen)
    setSeconds(0);
    setTimerRunning(false);
    setStartedAt(null);
    localStorage.removeItem(`ticket-timer-${ticketId}`);
  }

  /* ================= UPDATE HELPER ================= */

    async function updateTicketField(
        field: "status" | "priority" | "assignee" | "category",
        value: string
    ) {
    if (!ticketId || !ticket) return;

    const previous = ticket[field];

    // 🔹 Optimistic UI
    setTicket((prev) => (prev ? { ...prev, [field]: value } : prev));

    // ✅ WICHTIG: URL MUSS die echte ticketId haben (UUID)
    const res = await fetch(`/api/ticket/${ticketId}/update`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ field, value }),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      console.error("Update fehlgeschlagen:", errText);

      // 🔴 Rollback
      setTicket((prev) => (prev ? { ...prev, [field]: previous } : prev));

      alert("Änderung konnte nicht gespeichert werden");
    }
  }
  /* ================= RENDER ================= */

  if (!ticketId) {
    return <main className={styles.page}>Ticket-ID fehlt…</main>;
  }

  if (loading) {
    return <main className={styles.page}>Lade Ticket…</main>;
  }

  if (!ticket) {
    return <main className={styles.page}>Ticket nicht gefunden</main>;
  }

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <header className={styles.header}>
  <div>
    <h1 className={styles.title}>{ticket.title}</h1>

    <div className={styles.meta}>
  Kunde:{" "}
  {ticket.customers
    ? `${ticket.customers.name ?? "Unbekannt"} (${ticket.customers.email ?? "–"})`
    : "Unbekannt"} ·{" "}
  Erstellt: {new Date(ticket.created_at).toLocaleString("de-DE")}
</div>
  </div>

  <div className={styles.headerActions}>
    <span className={`ticket-status status-${ticket.status ?? "offen"}`}>
      {(ticket.status ?? "offen").replace("_", " ").toUpperCase()}
    </span>
  </div>
</header>

        {/* ===== ACTION BAR ===== */}
        <section className={styles.actionBar}>
          <div className={styles.actionGroup}>
            <Link href={`/ticket/${ticket.id}/reply`}>
              <button className={styles.primary}>Antworten</button>
            </Link>

            <Link href={`/ticket/${ticket.id}/notes`}>
              <button className={styles.ghost}>Interne Notizen</button>
            </Link>

            <Link href={`/ticket/${ticket.id}/documentation`}>
              <button className={styles.secondary}>Dokumentation</button>
            </Link>
          </div>

          <div className={styles.actionGroup}>
            {/* STATUS */}
            <select
              className={styles.select}
              value={ticket.status ?? "offen"}
              onChange={(e) => updateTicketField("status", e.target.value)}
            >
              <option value="offen">Offen</option>
              <option value="in_bearbeitung">In Bearbeitung</option>
              <option value="geschlossen">Geschlossen</option>
            </select>

            {/* ASSIGNEE */}
            <select
              className={styles.select}
              value={ticket.assignee ?? ""}
              onChange={(e) => updateTicketField("assignee", e.target.value)}
            >
              <option value="">Zuweisen an …</option>
              <option value="christian">Christian</option>
              <option value="milan">Milan</option>
              <option value="support">Support-Team</option>
            </select>
            <select
            className={styles.categorySelect}
  value={ticket.category ?? ""}
  onChange={(e) =>
    updateTicketField("category", e.target.value as TicketCategory)
  }
>
  <option value="">Kategorie wählen…</option>

  {TICKET_CATEGORIES.map((cat) => (
    <option key={cat.value} value={cat.value}>
      {cat.label}
    </option>
  ))}
</select>
            {/* ZEIT BUTTON */}
            <button
              className={styles.secondary}
              onClick={() => setShowTimePanel((v) => !v)}
            >
              ⏱ Zeit
            </button>

            {/* PRIORITÄT */}
            <select
              className={styles.select}
              value={ticket.priority ?? "normal"}
              onChange={(e) => updateTicketField("priority", e.target.value)}
            >
              <option value="niedrig">Niedrig</option>
              <option value="normal">Normal</option>
              <option value="hoch">Hoch</option>
              <option value="kritisch">Kritisch</option>
            </select>
          </div>

          <div className={styles.actionGroup}>
            <Link href={`/ticket/${ticket.id}/history`}>
              <button className={styles.ghost}>Verlauf</button>
            </Link>

            <Link href={`/ticket/${ticket.id}/attachments`}>
              <button className={styles.ghost}>Anhänge</button>
            </Link>
          </div>
        </section>

        {/* ===== LETZTE NACHRICHT ===== */}
        <section className={styles.lastMessage}>
          <h2>Letzte Nachricht</h2>

          {lastMessage ? (
            <div
              className={
                lastMessage.sender_type === "support"
                  ? styles.messageSupport
                  : styles.messageCustomer
              }
            >
              <div className={styles.messageMeta}>
                {lastMessage.sender_type === "support" ? "Support" : "Kunde"} ·{" "}
                {new Date(lastMessage.created_at).toLocaleString("de-DE")}
              </div>

              <div className={styles.messageText}>{lastMessage.content}</div>
            </div>
          ) : (
            <p className={styles.empty}>Noch keine Nachrichten vorhanden.</p>
          )}
        </section>

        {/* ===== ZEIT ===== */}
        {showTimePanel && (
          <section className={styles.timeSection}>
            <h2>⏱ Zeit</h2>

            {timeEntries.length > 0 ? (
              <ul className={styles.timeList}>
                {timeEntries.map((t) => (
                  <li key={t.id}>
                    ⏱ {Math.floor(t.duration_seconds / 60)}:
                    {(t.duration_seconds % 60).toString().padStart(2, "0")} –{" "}
                    {t.user_name} ·{" "}
                    {new Date(t.created_at).toLocaleString("de-DE")}
                  </li>
                ))}
              </ul>
            ) : (
              <p>Noch keine Zeiten erfasst.</p>
            )}

            <div className={styles.timerControls}>
              <div className={styles.timerDisplay}>
                ⏱ {Math.floor(seconds / 60)}:
                {(seconds % 60).toString().padStart(2, "0")}
              </div>

              {/* START */}
              {!timerRunning && (
                <button onClick={startTimer}>▶ Start</button>
              )}

              {/* STOP */}
              {timerRunning && (
                <button onClick={stopTimer}>✔ Stop</button>
              )}

              {/* SPEICHERN + VERWERFEN */}
{seconds > 0 && !timerRunning && (
  <>
    <button onClick={saveTime}>💾 Speichern</button>
    <button onClick={discardTime}>🗑️ Verwerfen</button>
  </>
)}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}