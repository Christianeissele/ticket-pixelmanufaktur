import { NextResponse, NextRequest } from "next/server";
import { supabaseAdmin } from "@/app/lib/supabase-admin";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<Response> {
  try {
    // ✅ params korrekt awaiten (WICHTIG)
    const { id: ticketId } = await context.params;

    const body = await req.json();
    const { duration_seconds } = body;

    if (
      !ticketId ||
      typeof duration_seconds !== "number" ||
      duration_seconds < 1
    ) {
      return NextResponse.json(
        { error: "Ungültige Zeitdaten" },
        { status: 400 }
      );
    }

    const { error } = await supabaseAdmin
      .from("ticket_time_entries")
      .insert({
        ticket_id: ticketId,
        duration_seconds,
        user_name: "christian",
      });

    if (error) {
      console.error("Zeit speichern Fehler:", error);
      return NextResponse.json(
        { error: "Zeit konnte nicht gespeichert werden" },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Time Route Error:", err);
    return NextResponse.json(
      { error: "Serverfehler" },
      { status: 500 }
    );
  }
}