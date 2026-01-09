import styles from "./attachments.module.css";
import { supabase } from "@/app/lib/supabase";

/* ================= TYPES ================= */

type Attachment = {
  id: string;
  file_name: string;
  file_type: string;
  file_size: number;
  storage_path: string;
  uploaded_by: string | null;
  created_at: string;
};

/* ================= PAGE ================= */

export default async function AttachmentsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // ✅ params korrekt auflösen (WICHTIG)
  const { id: ticketId } = await params;

  /* ================= LOAD ATTACHMENTS ================= */

  const { data: attachments, error } = await supabase
    .from("ticket_attachments")
    .select("*")
    .eq("ticket_id", ticketId)
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <main className={styles.page}>
        <p className={styles.empty}>Fehler beim Laden der Anhänge</p>
      </main>
    );
  }

  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!baseUrl) {
    return (
      <main className={styles.page}>
        <p className={styles.empty}>
          NEXT_PUBLIC_SUPABASE_URL fehlt
        </p>
      </main>
    );
  }

  /* ================= RENDER ================= */

  return (
    <main className={styles.page}>
      <h1 className={styles.title}>Anhänge</h1>

      {attachments && attachments.length > 0 ? (
        <ul className={styles.list}>
          {attachments.map((file) => {
            const fileUrl = `${baseUrl}/storage/v1/object/public/ticket-attachments/${file.storage_path}`;

            return (
              <li key={file.id} className={styles.item}>
                <div className={styles.meta}>
                  <span className={styles.name}>{file.file_name}</span>

                  <span className={styles.info}>
                    {file.uploaded_by ?? "Unbekannt"} ·{" "}
                    {new Date(file.created_at).toLocaleString("de-DE")}
                  </span>
                </div>

                <a
                  href={fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.open}
                >
                  Öffnen
                </a>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className={styles.empty}>Keine Anhänge vorhanden.</p>
      )}
    </main>
  );
}