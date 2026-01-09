import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: ticketId } = await context.params; // ✅ DAS ist der Fix

    if (!ticketId) {
      return NextResponse.json({ error: "Ticket-ID fehlt" }, { status: 400 });
    }

    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: "Ungültiges JSON" }, { status: 400 });
    }

   const { field, value } = body as {
  field?: "status" | "priority" | "assignee" | "category";
  value?: string;
};

    if (!field || typeof value !== "string") {
      return NextResponse.json(
        { error: "field/value fehlt oder ungültig" },
        { status: 400 }
      );
    }

    if (!["status", "priority", "assignee", "category"].includes(field)) {
  return NextResponse.json({ error: "Ungültiges Feld" }, { status: 400 });
}

    const { error } = await supabaseAdmin
      .from("tickets")
      .update({ [field]: value })
      .eq("id", ticketId);

    if (error) {
      console.error("Supabase update error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Route error:", err);
    return NextResponse.json({ error: "Serverfehler" }, { status: 500 });
  }
}