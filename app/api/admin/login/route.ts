import { NextResponse } from "next/server";
import {
  isValidAdminCredentials,
  setAdminSessionOnResponse,
} from "@/lib/admin/session";

export async function POST(request: Request) {
  let body: { username?: string; password?: string };

  try {
    body = (await request.json()) as { username?: string; password?: string };
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const username = body.username?.trim() ?? "";
  const password = body.password ?? "";

  if (!isValidAdminCredentials(username, password)) {
    return NextResponse.json(
      { error: "Invalid username or password." },
      { status: 401 }
    );
  }

  const response = NextResponse.json({ ok: true });
  setAdminSessionOnResponse(response);
  return response;
}
