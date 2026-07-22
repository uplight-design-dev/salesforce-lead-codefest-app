import { NextResponse } from "next/server";
import { hasAdminSession } from "@/lib/admin/session";
import {
  getCsvSourceMeta,
  saveUploadedCsv,
  validateCsvContent,
} from "@/lib/data/csv-leads";

const MAX_UPLOAD_BYTES = 8 * 1024 * 1024; // 8 MB

export async function GET() {
  return NextResponse.json({
    meta: getCsvSourceMeta(),
    authenticated: await hasAdminSession(),
  });
}

export async function POST(request: Request) {
  if (!(await hasAdminSession())) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      { error: "Expected multipart form data." },
      { status: 400 }
    );
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json(
      { error: "Attach a CSV file using the file field." },
      { status: 400 }
    );
  }

  const filename = file.name || "lead-tracker.csv";
  if (!filename.toLowerCase().endsWith(".csv")) {
    return NextResponse.json(
      { error: "Only .csv files are supported." },
      { status: 400 }
    );
  }

  if (file.size <= 0) {
    return NextResponse.json({ error: "CSV file is empty." }, { status: 400 });
  }

  if (file.size > MAX_UPLOAD_BYTES) {
    return NextResponse.json(
      { error: "CSV is too large. Max size is 8 MB." },
      { status: 400 }
    );
  }

  const content = await file.text();
  const validation = validateCsvContent(content);
  if (!validation.ok) {
    return NextResponse.json(
      {
        error: validation.error,
        missingRequiredColumns: validation.missingRequiredColumns,
      },
      { status: 400 }
    );
  }

  try {
    const meta = saveUploadedCsv(content, filename);
    return NextResponse.json({
      ok: true,
      meta,
      missingOptionalColumns: validation.missingOptionalColumns,
    });
  } catch (error) {
    console.error("[api/admin/csv] Upload failed:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Could not save the uploaded CSV.",
      },
      { status: 500 }
    );
  }
}
