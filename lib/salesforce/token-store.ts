/**
 * Secure server-side token storage for Salesforce OAuth tokens.
 *
 * Tokens must never be sent to the browser or stored in localStorage.
 * In production, persist encrypted tokens in Supabase (or another server-side store)
 * keyed by the authenticated app user / org.
 */

export type SalesforceTokens = {
  accessToken: string;
  refreshToken: string;
  instanceUrl: string;
  issuedAt: number;
  /** Salesforce token lifetime in seconds (typically 7200). */
  expiresIn: number;
};

// In-memory placeholder for local development before Supabase wiring.
// TODO: Replace with Supabase `salesforce_connections` table:
//   - Encrypt access_token and refresh_token at rest (e.g. pgcrypto or app-level AES)
//   - Associate rows with the authenticated user / tenant
//   - Add RLS policies so users can only read their own connection
let storedTokens: SalesforceTokens | null = null;

/** Persists tokens after a successful OAuth callback. Server-side only. */
export async function saveTokens(tokens: SalesforceTokens): Promise<void> {
  // TODO: Upsert into Supabase instead of in-memory storage.
  // Example:
  //   await supabase.from('salesforce_connections').upsert({
  //     user_id: session.user.id,
  //     access_token: encrypt(tokens.accessToken),
  //     refresh_token: encrypt(tokens.refreshToken),
  //     instance_url: tokens.instanceUrl,
  //     issued_at: new Date(tokens.issuedAt).toISOString(),
  //     expires_in: tokens.expiresIn,
  //   });
  storedTokens = tokens;
}

/** Returns stored tokens if a Salesforce connection exists. */
export async function getTokens(): Promise<SalesforceTokens | null> {
  // TODO: Load from Supabase for the current authenticated user.
  return storedTokens;
}

/** Removes stored tokens on disconnect or auth failure. */
export async function clearTokens(): Promise<void> {
  // TODO: Delete the user's row from Supabase `salesforce_connections`.
  storedTokens = null;
}

/** Returns true when valid (non-expired) tokens are available. */
export async function hasActiveConnection(): Promise<boolean> {
  const tokens = await getTokens();
  if (!tokens) return false;

  const expiresAt = tokens.issuedAt + tokens.expiresIn * 1000;
  return Date.now() < expiresAt;
}
