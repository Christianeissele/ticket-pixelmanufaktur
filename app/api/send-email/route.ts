import { NextResponse } from "next/server";
import postmark from "postmark";

const client = new postmark.ServerClient(
  process.env.POSTMARK_SERVER_TOKEN!
);

export async function POST(req: Request) {
  try {
    const { to, subject, html } = await req.json();

    const result = await client.sendEmail({
      From: "support@pixelmanufaktur.eu",
      To: to,
      Subject: subject,
      HtmlBody: html,
      MessageStream: "outbound",
    });

    return NextResponse.json({ success: true, result });
  } catch (error: any) {
    console.error("POSTMARK ERROR:", error);

    return NextResponse.json(
      { error: error.message ?? "Send failed" },
      { status: 500 }
    );
  }
}