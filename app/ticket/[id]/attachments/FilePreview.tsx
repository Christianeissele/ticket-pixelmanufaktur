"use client";

import styles from "./FilePreview.module.css";

type FilePreviewProps = {
  url: string;
  fileType: string;
  fileName: string;
};

export default function FilePreview({
  url,
  fileType,
  fileName,
}: FilePreviewProps) {
  // 🖼 Bilder direkt anzeigen
  if (fileType.startsWith("image/")) {
    return <img src={url} alt={fileName} className={styles.image} />;
  }

  // 📄 PDFs inline anzeigen
  if (fileType === "application/pdf") {
    return (
      <iframe
        src={url}
        title={fileName}
        className={styles.pdf}
      />
    );
  }

  // ⬇️ Fallback (Office, ZIP, etc.)
  return (
    <div className={styles.fallback}>
      <p>Keine Vorschau verfügbar</p>
      <a href={url} target="_blank" rel="noopener noreferrer">
        Datei herunterladen
      </a>
    </div>
  );
}