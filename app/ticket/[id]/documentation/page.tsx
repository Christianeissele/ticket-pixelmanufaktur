"use client";

import { use, useEffect, useState } from "react";
import { supabase } from "@/app/lib/supabase";
import styles from "./documentation.module.css";

type Doc = {
  id: string;
  ticket_id: string;
  title: string | null;
  content: string;
  created_by: string | null;
  created_at: string;
};

export default function DocumentationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: ticketId } = use(params);

  const [docs, setDocs] = useState<Doc[]>([]);
  const [text, setText] = useState("");

  async function loadDocs() {
    const { data } = await supabase
      .from("ticket_documentations")
      .select("*")
      .eq("ticket_id", ticketId)
      .order("created_at", { ascending: false });

    setDocs(data ?? []);
  }

  useEffect(() => {
    loadDocs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticketId]);

  async function addDoc() {
    if (!text.trim()) return;

    await supabase.from("ticket_documentations").insert({
      ticket_id: ticketId,
      title: null,
      content: text,
      created_by: "support@eurefirma.de",
    });

    setText("");
    await loadDocs();
  }

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <div className={styles.topBar}>
          <div className={styles.title}>Dokumentation</div>
        </div>

        <div className={styles.card}>
          {docs.length > 0 ? (
            <div className={styles.list}>
              {docs.map((d) => (
                <div key={d.id} className={styles.item}>
                  <div className={styles.meta}>
                    {new Date(d.created_at).toLocaleString("de-DE")}
                    {d.created_by ? ` · ${d.created_by}` : ""}
                  </div>
                  <div className={styles.content}>{d.content}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className={styles.empty}>
              Noch keine Dokumentation vorhanden.
            </div>
          )}
        </div>

        <div className={styles.editorCard}>
          <div className={styles.editorTitle}>Neue Dokumentation</div>
          <textarea
            className={styles.textarea}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Dokumentation schreiben …"
          />
          <div className={styles.actions}>
            <button className={styles.primary} onClick={addDoc}>
              Speichern
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}