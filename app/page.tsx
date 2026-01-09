"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "./lib/supabase";
import TicketPreview from "./ticketpreview/ticketpreview";
import type { TicketCategory } from "@/app/lib/classification";
/* ================= TYPES ================= */

type Ticket = {
  id: string;
  title: string;
  status: "offen" | "in_bearbeitung" | "geschlossen";
  category: TicketCategory | null;
  priority: "niedrig" | "normal" | "hoch" | "kritisch" | null; // ✅ FEHLTE
  updated_at: string;
  assignee: string | null; // ⚠️ wichtig, nicht optional
  has_unread_customer_message: boolean;
  customers: {
    name: string | null;
    email: string | null;
  } | null;
};

/* ================= PAGE ================= */

export default function HomePage() {
  const router = useRouter();

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  /* 🔽 FILTER STATES */
  const [assigneeFilter, setAssigneeFilter] = useState<string>("alle");
  const [statusFilter, setStatusFilter] = useState<string>("alle");
  const [companyFilter, setCompanyFilter] = useState<string>("alle");
  const [companySearch, setCompanySearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("alle");
const [priorityFilter, setPriorityFilter] = useState<string>("alle");
  /* ================= LOAD ================= */

  useEffect(() => {
    const load = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        router.replace("/login");
        return;
      }

      const { data, error } = await supabase
  .from("tickets")
  .select(`
    id,
    title,
    status,
    category,
    priority,
    assignee,
    updated_at,
    has_unread_customer_message,
    customers!left (
      name,
      email
    )
  `)
  .order("updated_at", { ascending: false });

      if (error) {
        console.error("Supabase error:", error);
        setTickets([]);
      } else {
        const normalizedTickets: Ticket[] =
          data?.map((t: any) => ({
            ...t,
            customers: Array.isArray(t.customers)
              ? t.customers[0] ?? null
              : t.customers ?? null,
          })) ?? [];

        setTickets(normalizedTickets);
      }

      setLoading(false);
    };

    load();
  }, [router]);

  /* ================= COMPANIES ================= */

  const companies: string[] = Array.from(
    new Set(
      tickets
        .map((t) => t.customers?.name)
        .filter((name): name is string => Boolean(name))
    )
  );

  /* ================= FILTER ================= */
const filteredTickets = tickets.filter((ticket) => {
  const assigneeOk =
    assigneeFilter === "alle" || ticket.assignee === assigneeFilter;

  const statusOk =
    statusFilter === "alle" || ticket.status === statusFilter;

  const categoryOk =
    categoryFilter === "alle" || ticket.category === categoryFilter;

  const priorityOk =
    priorityFilter === "alle" || ticket.priority === priorityFilter;

  const companyName = ticket.customers?.name ?? "";

  const companyOk =
    companyFilter === "alle" || companyName === companyFilter;

  const searchOk =
    companySearch === "" ||
    companyName.toLowerCase().includes(companySearch.toLowerCase());

  return (
    assigneeOk &&
    statusOk &&
    categoryOk &&
    priorityOk &&
    companyOk &&
    searchOk
  );
});

  /* ================= RENDER ================= */

  if (loading) {
    return (
      <main className="page">
        <h1 className="page-title">To-Dos</h1>
        <p>Lade Tickets…</p>
      </main>
    );
  }

  return (
    <main className="page">
      <h1 className="page-title">To-Dos</h1>

      {/* ================= FILTER BAR ================= */}
<div className="ticket-filter-bar">

  {/* BEARBEITER */}
  <div className="ticket-assignee-filter">
    <label className="ticket-assignee-filter-label">Bearbeiter</label>
    <select
      className="ticket-assignee-filter-select"
      value={assigneeFilter}
      onChange={(e) => setAssigneeFilter(e.target.value)}
    >
      <option value="alle">Alle</option>
      <option value="christian">Christian</option>
      <option value="milan">Milan</option>
      <option value="support">Support</option>
    </select>
  </div>

  {/* STATUS */}
  <div className="ticket-status-filter">
    <label className="ticket-status-filter-label">Status</label>
    <select
      className="ticket-status-filter-select"
      value={statusFilter}
      onChange={(e) => setStatusFilter(e.target.value)}
    >
      <option value="alle">Alle</option>
      <option value="offen">Offen</option>
      <option value="in_bearbeitung">In Bearbeitung</option>
      <option value="geschlossen">Geschlossen</option>
    </select>
  </div>

  {/* FIRMA */}
  <div className="ticket-company-filter">
    <label className="ticket-company-filter-label">Firma</label>
    <input
      type="text"
      placeholder="Firma suchen…"
      className="ticket-company-filter-search"
      value={companySearch}
      onChange={(e) => {
        setCompanySearch(e.target.value);
        setCompanyFilter("alle");
      }}
    />
    <select
      className="ticket-company-filter-select"
      value={companyFilter}
      onChange={(e) => {
        setCompanyFilter(e.target.value);
        setCompanySearch("");
      }}
    >
      <option value="alle">Alle</option>
      {companies.map((company) => (
        <option key={company} value={company}>
          {company}
        </option>
      ))}
    </select>
  </div>

  {/* KATEGORIE */}
  <div className="ticket-category-filter">
    <label className="ticket-category-filter-label">Kategorie</label>
    <select
      className="ticket-category-filter-select"
      value={categoryFilter}
      onChange={(e) => setCategoryFilter(e.target.value)}
    >
      <option value="alle">Alle</option>
      <option value="website">Website</option>
      <option value="hosting">Hosting</option>
      <option value="wartung">Wartung</option>
      <option value="verwaltung_intern">Verwaltung intern</option>
      <option value="verwaltung_extern">Verwaltung extern</option>
      <option value="spam">Spam</option>
    </select>
  </div>

  {/* PRIORITÄT */}
  <div className="ticket-priority-filter">
    <label className="ticket-priority-filter-label">Priorität</label>
    <select
      className="ticket-priority-filter-select"
      value={priorityFilter}
      onChange={(e) => setPriorityFilter(e.target.value)}
    >
      <option value="alle">Alle</option>
      <option value="niedrig">Niedrig</option>
      <option value="normal">Normal</option>
      <option value="hoch">Hoch</option>
      <option value="kritisch">Kritisch</option>
    </select>
  </div>

</div>

      {/* ================= TICKETS ================= */}
      <div className="ticket-list">
        {filteredTickets.length > 0 ? (
          filteredTickets.map((ticket) => (
            <Link
              key={ticket.id}
              href={`/ticket/${ticket.id}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ textDecoration: "none", color: "inherit" }}
            >
              <div className={`ticket-wrapper status-${ticket.status}`}>
                <TicketPreview
                  id={ticket.id}
                  title={ticket.title}
                  status={ticket.status}
                  category={ticket.category} 
                  priority={ticket.priority}
                  assignee={ticket.assignee}
                  customerName={ticket.customers?.name ?? "Unbekannter Kunde"}
                  customerEmail={ticket.customers?.email ?? ""}
                  updated_at={ticket.updated_at}
                  hasUnread={ticket.has_unread_customer_message}
                />
              </div>
            </Link>
          ))
        ) : (
          <p>Keine Tickets für diese Filter.</p>
        )}
      </div>
    </main>
  );
}