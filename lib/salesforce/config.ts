/**
 * Server-only Salesforce configuration.
 *
 * These values are read from environment variables and must never be imported
 * into client components. The client secret in particular must only be used in
 * API routes and server-side library code.
 */

export type SalesforceConfig = {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  loginUrl: string;
};

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${name}. ` +
        "Copy .env.example to .env.local and fill in your Salesforce Connected App credentials."
    );
  }
  return value;
}

/** Public app URL — used for OAuth redirects back to Settings. */
export function getAppUrl(): string {
  return (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
}

/** OAuth callback URL sent to Salesforce — must match a Connected App callback URL exactly. */
export function getSalesforceRedirectUri(): string {
  return (
    process.env.SALESFORCE_REDIRECT_URI ?? `${getAppUrl()}/api/salesforce/callback`
  );
}

/** Returns validated Salesforce OAuth config. Throws if any variable is missing. */
export function getSalesforceConfig(): SalesforceConfig {
  return {
    clientId: requireEnv("SALESFORCE_CLIENT_ID"),
    clientSecret: requireEnv("SALESFORCE_CLIENT_SECRET"),
    redirectUri: getSalesforceRedirectUri(),
    loginUrl: requireEnv("SALESFORCE_LOGIN_URL").replace(/\/$/, ""),
  };
}

/** Builds the Salesforce OAuth authorization URL users are redirected to. */
export function buildAuthorizeUrl(params: {
  clientId: string;
  redirectUri: string;
  loginUrl: string;
  state: string;
}): string {
  const url = new URL(`${params.loginUrl}/services/oauth2/authorize`);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", params.clientId);
  url.searchParams.set("redirect_uri", params.redirectUri);
  // Request API access and offline refresh so we can sync data on a schedule.
  url.searchParams.set("scope", "api refresh_token offline_access");
  url.searchParams.set("state", params.state);
  return url.toString();
}
