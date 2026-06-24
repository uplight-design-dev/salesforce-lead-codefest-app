/**
 * Server-side token storage for Salesforce OAuth tokens.
 *
 * Tokens are stored in an httpOnly cookie so OAuth survives Vercel serverless
 * cold starts. In a multi-tenant production app, move this to Supabase with
 * per-user encryption.
 */

import { cookies } from "next/headers";

export const SALESFORCE_TOKEN_COOKIE = "sf_connection";

export type SalesforceTokens = {
  accessToken: string;
  refreshToken: string;
  instanceUrl: string;
  issuedAt: number;
  /** Salesforce token lifetime in seconds (typically 7200). */
  expiresIn: number;
};

/** Persists tokens after a successful OAuth callback. Server-side only. */
export async function saveTokens(tokens: SalesforceTokens): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SALESFORCE_TOKEN_COOKIE, JSON.stringify(tokens), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

/** Returns stored tokens if a Salesforce connection exists. */
export async function getTokens(): Promise<SalesforceTokens | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(SALESFORCE_TOKEN_COOKIE)?.value;
  if (!raw) return null;

  try {
    return JSON.parse(raw) as SalesforceTokens;
  } catch {
    return null;
  }
}

/** Removes stored tokens on disconnect or auth failure. */
export async function clearTokens(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SALESFORCE_TOKEN_COOKIE);
}

/** Returns true when valid (non-expired) tokens are available. */
export async function hasActiveConnection(): Promise<boolean> {
  const tokens = await getTokens();
  if (!tokens) return false;

  const expiresAt = tokens.issuedAt + tokens.expiresIn * 1000;
  return Date.now() < expiresAt;
}
