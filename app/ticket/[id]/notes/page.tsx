"use client";

import { use, useEffect, useState } from "react";
import { supabase } from "@/app/lib/supabase";
import styles from "./notes.module.css";

type Note = {
  id: string;
  ticket_id: string;
  content: string;
  created_by: string | null;
  created_at: string;
};

export default function NotesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: ticketId } = use(params);

  const [notes, setNotes] = useState<Note[]>([]);
  const [text, setText] = useState("");

  async function loadNotes() {
    const { data } = await supabase
      .from("ticket_notes")
      .select("*")
      .eq("ticket_id", ticketId)
      .order("created_at", { ascending: false });

    setNotes(data ?? []);
  }

  useEffect(() => {
    loadNotes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticketId]);

  async function addNote() {
    if (!text.trim()) return;

    await supabase.from("ticket_notes").insert({
      ticket_id: ticketId,
      content: text,
      created_by: "support@eurefirma.de",
    });

    setText("");
    await loadNotes();
  }

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <div className={styles.topBar}>
          <div className={styles.title}>Interne Notizen</div>
        </div>

        <div className={styles.card}>
          {notes.length > 0 ? (
            <div className={styles.list}>
              {notes.map((n) => (
                <div key={n.id} className={styles.item}>
                  <div className={styles.meta}>
                    {new Date(n.created_at).toLocaleString("de-DE")}
                    {n.created_by ? ` · ${n.created_by}` : ""}
                  </div>
                  <div className={styles.content}>{n.content}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className={styles.empty}>Noch keine Notizen vorhanden.</div>
          )}
        </div>

        <div className={styles.editorCard}>
          <div className={styles.editorTitle}>Neue Notiz</div>
          <textarea
            className={styles.textarea}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Interne Notiz schreiben …"
          />
          <div className={styles.actions}>
            <button className={styles.primary} onClick={addNote}>
              Notiz speichern
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}