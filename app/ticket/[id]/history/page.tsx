import styles from "./history.module.css";
import { supabase } from "../../../lib/supabase";

type Message = {
  id: string;
  sender_type: "customer" | "support" | "internal";
  content: string;
  created_at: string;
};

export default async function HistoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // ✅ FIX: params ist ein Promise → awaiten
  const { id } = await params;

  const { data: messages } = await supabase
    .from("messages")
    .select("*")
    .eq("ticket_id", id)
    .order("created_at", { ascending: false }); // ✅ neueste zuerst

  return (
    <main className={styles.page}>
      <h1 className={styles.title}>Verlauf</h1>

      {messages && messages.length > 0 ? (
        <ul className={styles.list}>
          {messages.map((m) => (
            <li key={m.id} className={styles.item}>
              <div className={styles.meta}>
                <span className={styles.sender}>
                  {m.sender_type === "support"
                    ? "Support"
                    : m.sender_type === "customer"
                    ? "Kunde"
                    : "Intern"}
                </span>
                <span className={styles.date}>
                  {new Date(m.created_at).toLocaleString("de-DE")}
                </span>
              </div>

              <div className={styles.content}>{m.content}</div>
            </li>
          ))}
        </ul>
      ) : (
        <p className={styles.empty}>Noch keine Nachrichten vorhanden.</p>
      )}
    </main>
  );
}