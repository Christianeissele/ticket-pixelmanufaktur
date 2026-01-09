import { NextResponse } from "next/server";
import { exec } from "child_process";
import fs from "fs";
import path from "path";
import os from "os";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "Keine Datei übergeben" },
        { status: 400 }
      );
    }

    // 📁 Temp-Verzeichnis (OS-sicher)
    const tmpDir = os.tmpdir();

    const inputPath = path.join(tmpDir, file.name);
    const outputPath = inputPath.replace(/\.(docx|xlsx|pptx)$/i, ".pdf");

    // Datei speichern
    const buffer = Buffer.from(await file.arrayBuffer());
    fs.writeFileSync(inputPath, buffer);

    // 🔄 Konvertieren mit LibreOffice
    await new Promise<void>((resolve, reject) => {
      exec(
        `libreoffice --headless --convert-to pdf "${inputPath}" --outdir "${tmpDir}"`,
        (error) => {
          if (error) reject(error);
          else resolve();
        }
      );
    });

    // PDF lesen
    if (!fs.existsSync(outputPath)) {
      return NextResponse.json(
        { error: "PDF konnte nicht erstellt werden" },
        { status: 500 }
      );
    }

    const pdfBuffer = fs.readFileSync(outputPath);

    // Aufräumen
    fs.unlinkSync(inputPath);
    fs.unlinkSync(outputPath);

    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": "inline; filename=converted.pdf",
      },
    });
  } catch (err) {
    console.error("Convert error:", err);
    return NextResponse.json(
      { error: "Konvertierung fehlgeschlagen" },
      { status: 500 }
    );
  }
}