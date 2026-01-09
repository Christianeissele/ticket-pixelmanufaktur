import type { TicketCategory } from "@/app/lib/classification";

type Props = {
  id: string;
  title: string;
  status: "offen" | "in_bearbeitung" | "geschlossen";
  category: TicketCategory | null;
  priority: "niedrig" | "normal" | "hoch" | "kritisch" | null;
  assignee: string | null;
  customerName: string;
  customerEmail: string;
  updated_at: string;
  hasUnread: boolean;
};

export default function TicketPreview({
  title,
  status,
  category,
  priority,
  assignee,
  customerName,
  customerEmail,
  updated_at,
  hasUnread,
}: Props) {
  return (
    <div className="ticket-row">
      {/* LEFT SIDE */}
      <div className="ticket-left">
        <strong className="ticket-title">{title}</strong>

        <div className="ticket-meta">
          {customerName}
          {customerEmail && ` · ${customerEmail}`} ·{" "}
          {new Date(updated_at).toLocaleString("de-DE")}
        </div>
      </div>

      {/* ✅ MIDDLE ICON (zwischen links und badges) */}
      <div className="ticket-unread-slot">
        {hasUnread && (
          <span
            className="ticket-unread-icon"
            title="Neue Kunden-Nachricht"
            aria-label="Neue Kunden-Nachricht"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="ticket-unread-svg"
            >
              <path
                d="M3 7L12 13L21 7"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <rect
                x="3"
                y="5"
                width="18"
                height="14"
                rx="2"
                stroke="currentColor"
                strokeWidth="2"
              />
            </svg>
          </span>
        )}
      </div>

      {/* RIGHT SIDE – BADGES */}
      <div className="ticket-badges-grid">
        <span className="badge assignee">
          {assignee ? assignee.toUpperCase() : "–"}
        </span>

        <span className={`badge priority ${priority ? `priority-${priority}` : ""}`}>
          {priority ? priority.toUpperCase() : "–"}
        </span>

        <span className={`badge category ${category ? `category-${category}` : ""}`}>
          {category ? category.replace("_", " ").toUpperCase() : "–"}
        </span>

        <span className={`badge status status-${status}`}>
          {status.replace("_", " ").toUpperCase()}
        </span>
      </div>
    </div>
  );
}