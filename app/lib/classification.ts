// app/lib/classification.ts

export type TicketCategory =
  | "website"
  | "hosting"
  | "wartung"
  | "fehler"
  | "verwaltung_intern"
  | "verwaltung_extern"
  | "spam";

export const TICKET_CATEGORIES: {
  value: TicketCategory;
  label: string;
  color: string;
}[] = [
  { value: "website", label: "Website", color: "#3b82f6" },
  { value: "hosting", label: "Hosting", color: "#8b5cf6" },
  { value: "wartung", label: "Wartung", color: "#f59e0b" },
  { value: "fehler", label: "Fehler", color: "#ef4444" },
  { value: "verwaltung_intern", label: "Verwaltung (intern)", color: "#64748b" },
  { value: "verwaltung_extern", label: "Verwaltung (extern)", color: "#22c55e" },
  { value: "spam", label: "Spam", color: "#6b7280" },
];