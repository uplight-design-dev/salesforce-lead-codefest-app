import { NextResponse } from "next/server";
import { clearAdminSessionOnResponse } from "@/lib/admin/session";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  clearAdminSessionOnResponse(response);
  return response;
}
