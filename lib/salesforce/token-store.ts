/**
 * Server-side token storage for Salesforce OAuth tokens.
 *
 * Tokens are stored in an httpOnly cookie so OAuth survives Vercel serverless
 * cold starts. In a multi-tenant production app, move this to Supabase with
 * per-user encryption.
 */

import { cookies } from "next/headers";
import type { NextResponse } from "next/server";

export const SALESFORCE_TOKEN_COOKIE = "sf_connection";

/** Salesforce sessions typically last ~2h when expires_in is omitted from the token response. */
export const DEFAULT_ACCESS_TOKEN_TTL_SECONDS = 7200;

export type SalesforceTokens = {
  accessToken: string;
  refreshToken: string;
  instanceUrl: string;
  /** Salesforce `issued_at` — milliseconds since Unix epoch. */
  issuedAt: number;
  /**
   * Access-token lifetime in seconds.
   * Salesforce usually omits `expires_in`; we default to 2 hours.
   */
  expiresIn: number;
};

const TOKEN_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: 60 * 60 * 24 * 30,
};

function serializeTokens(tokens: SalesforceTokens): string {
  return encodeURIComponent(JSON.stringify(tokens));
}

function deserializeTokens(raw: string): SalesforceTokens | null {
  try {
    const decoded = raw.includes("%") ? decodeURIComponent(raw) : raw;
    const parsed = JSON.parse(decoded) as Partial<SalesforceTokens>;

    if (!parsed.accessToken || !parsed.instanceUrl) {
      return null;
    }

    return {
      accessToken: parsed.accessToken,
      refreshToken: parsed.refreshToken ?? "",
      instanceUrl: parsed.instanceUrl,
      issuedAt: Number(parsed.issuedAt) || Date.now(),
      expiresIn:
        typeof parsed.expiresIn === "number" && parsed.expiresIn > 0
          ? parsed.expiresIn
          : DEFAULT_ACCESS_TOKEN_TTL_SECONDS,
    };
  } catch {
    return null;
  }
}

/** Persists tokens after a successful OAuth callback. Server-side only. */
export async function saveTokens(tokens: SalesforceTokens): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SALESFORCE_TOKEN_COOKIE, serializeTokens(tokens), TOKEN_COOKIE_OPTIONS);
}

/** Sets the token cookie on a specific response (needed for OAuth redirects). */
export function setTokensOnResponse(
  response: NextResponse,
  tokens: SalesforceTokens
): void {
  response.cookies.set(
    SALESFORCE_TOKEN_COOKIE,
    serializeTokens(tokens),
    TOKEN_COOKIE_OPTIONS
  );
}

/** Returns stored tokens if a Salesforce connection exists. */
export async function getTokens(): Promise<SalesforceTokens | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(SALESFORCE_TOKEN_COOKIE)?.value;
  if (!raw) return null;
  return deserializeTokens(raw);
}

/** Removes stored tokens on disconnect or auth failure. */
export async function clearTokens(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SALESFORCE_TOKEN_COOKIE);
}

/**
 * Returns true when Salesforce tokens are stored.
 *
 * Presence of a refresh token means the org connection is active even if the
 * short-lived access token needs refreshing. Access-token-only connections are
 * treated as active until their (possibly defaulted) expiry.
 */
export async function hasActiveConnection(): Promise<boolean> {
  const tokens = await getTokens();
  if (!tokens?.accessToken || !tokens.instanceUrl) return false;

  // Refresh token = durable Connected App authorization.
  if (tokens.refreshToken) return true;

  const expiresIn =
    tokens.expiresIn > 0 ? tokens.expiresIn : DEFAULT_ACCESS_TOKEN_TTL_SECONDS;
  const expiresAt = tokens.issuedAt + expiresIn * 1000;
  return Date.now() < expiresAt;
}
