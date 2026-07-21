/**
 * Lightweight admin session for the status-edit lightbox.
 * Demo credentials are intentional for the codefest app.
 */

import { cookies } from "next/headers";
import type { NextResponse } from "next/server";

export const ADMIN_SESSION_COOKIE = "admin_session";
export const ADMIN_USERNAME = "admin";
export const ADMIN_PASSWORD = "uplightiq";

const SESSION_VALUE = "authenticated";

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: 60 * 60 * 8,
};

export function isValidAdminCredentials(
  username: string,
  password: string
): boolean {
  return username === ADMIN_USERNAME && password === ADMIN_PASSWORD;
}

export async function hasAdminSession(): Promise<boolean> {
  const cookieStore = await cookies();
  return cookieStore.get(ADMIN_SESSION_COOKIE)?.value === SESSION_VALUE;
}

export async function setAdminSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_SESSION_COOKIE, SESSION_VALUE, COOKIE_OPTIONS);
}

export function setAdminSessionOnResponse(response: NextResponse): void {
  response.cookies.set(ADMIN_SESSION_COOKIE, SESSION_VALUE, COOKIE_OPTIONS);
}

export async function clearAdminSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_SESSION_COOKIE);
}

export function clearAdminSessionOnResponse(response: NextResponse): void {
  response.cookies.delete(ADMIN_SESSION_COOKIE);
}
