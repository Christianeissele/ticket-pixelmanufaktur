import "dotenv/config";
import { ImapFlow } from "imapflow";
import { simpleParser } from "mailparser";

/**
 * STRATO IMAP → E-Mails lesen
 * (Basis für Ticket-Erstellung)
 */

async function run() {
  if (!process.env.IMAP_USER || !process.env.IMAP_PASSWORD) {
    throw new Error("IMAP_USER oder IMAP_PASSWORD fehlt in der .env Datei");
  }

  const client = new ImapFlow({
    host: "imap.strato.de",
    port: 993,
    secure: true,
    auth: {
      user: process.env.IMAP_USER,
      pass: process.env.IMAP_PASSWORD,
    },
  });

  console.log("📡 Verbinde mit IMAP …");
  await client.connect();
  console.log("✅ IMAP Login erfolgreich");

  const lock = await client.getMailboxLock("INBOX");

  try {
    const exists = Number((client.mailbox as any)?.exists ?? 0);
    console.log(`📬 Nachrichten in INBOX: ${exists}`);

    if (exists === 0) {
      console.log("Keine E-Mails vorhanden.");
      return;
    }

    // Letzte 5 E-Mails
    const fromSeq = Math.max(1, exists - 4);
    const range = `${fromSeq}:*`;

    for await (const msg of client.fetch(range, { source: true })) {
      if (!msg.source) continue;

      const parsed = await simpleParser(msg.source);

      console.log("=".repeat(50));
      console.log("FROM:", parsed.from?.text ?? "—");

      const toList =
        ((parsed.to as any)?.value as Array<{ address?: string }>) ?? [];

      console.log(
        "TO:",
        toList.map(v => v.address).filter(Boolean).join(", ")
      );

      console.log("SUBJECT:", parsed.subject ?? "—");
      console.log("DATE:", parsed.date?.toISOString() ?? "—");
      console.log("TEXT:");
      console.log(parsed.text?.trim() ?? "—");

      if (parsed.attachments?.length) {
        console.log(`📎 Attachments: ${parsed.attachments.length}`);
        parsed.attachments.forEach(att => {
          console.log(
            ` - ${att.filename} (${att.contentType}, ${att.size} bytes)`
          );
        });
      }
    }
  } finally {
    lock.release();
    await client.logout();
    console.log("🔒 IMAP Verbindung geschlossen");
  }
}

run().catch(err => {
  console.error("❌ Fehler:", err);
  process.exit(1);
});