"use client";

import Link from "next/link";
import Image from "next/image";
import { useParams, usePathname } from "next/navigation";
import styles from "./navbar.module.css";

export default function Navbar() {
  const params = useParams<{ id?: string }>();
  const pathname = usePathname();
  const ticketId = params?.id;

  // 👉 Nur wenn wir wirklich in einem Ticket-Tab sind
  const isTicketTab =
    ticketId && pathname.startsWith(`/ticket/${ticketId}`);

  function closeTicketTab() {
    window.close(); // ✔️ funktioniert, da Tab per Klick geöffnet wurde
  }

  return (
    <nav className={styles.navbar}>
      <div className={styles.inner}>

        {/* 🔵 LINKS: LOGO + NAV */}
        <div className={styles.left}>
          {/* LOGO */}
          <Link href="/" className={styles.logo}>
            <Image
              src="/logo_pixelmanufaktur.eu.png"
              alt="Pixelmanufaktur Logo"
              width={300}
              height={260}
              priority
            />
          </Link>

          {/* LINKS */}
          <div className={styles.links}>
            <Link href="/" className={styles.link}>
              Tickets
            </Link>

            {ticketId && (
              <Link
                href={`/ticket/${ticketId}`}
                className={styles.link}
              >
                Home
              </Link>
            )}
          </div>
        </div>

        {/* 🔴 RECHTS: Ticket schließen */}
        {isTicketTab && (
          <button
            className={styles.closeButton}
            onClick={closeTicketTab}
          >
            Ticket schließen
          </button>
        )}
      </div>
    </nav>
  );
}