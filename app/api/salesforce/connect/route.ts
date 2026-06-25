import { randomBytes } from "crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { buildAuthorizeUrl, getAppUrl, getSalesforceConfig } from "@/lib/salesforce/config";
import { OAUTH_PKCE_COOKIE, OAUTH_STATE_COOKIE } from "@/lib/salesforce/oauth";
import { generateCodeChallenge, generateCodeVerifier } from "@/lib/salesforce/pkce";

const OAUTH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  maxAge: 60 * 10,
  path: "/",
};

/**
 * GET /api/salesforce/connect
 *
 * Step 1 of the OAuth flow (server-side only):
 * 1. Read Salesforce config from environment variables (client secret stays here).
 * 2. Generate CSRF state + PKCE code verifier/challenge.
 * 3. Redirect the browser to Salesforce's authorization endpoint.
 */
export async function GET() {
  try {
    const config = getSalesforceConfig();

    const state = randomBytes(32).toString("hex");
    const codeVerifier = generateCodeVerifier();
    const codeChallenge = generateCodeChallenge(codeVerifier);

    const cookieStore = await cookies();
    cookieStore.set(OAUTH_STATE_COOKIE, state, OAUTH_COOKIE_OPTIONS);
    cookieStore.set(OAUTH_PKCE_COOKIE, codeVerifier, OAUTH_COOKIE_OPTIONS);

    const authorizeUrl = buildAuthorizeUrl({
      clientId: config.clientId,
      redirectUri: config.redirectUri,
      loginUrl: config.loginUrl,
      state,
      codeChallenge,
    });

    return NextResponse.redirect(authorizeUrl);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to start Salesforce OAuth";
    console.error("[salesforce/connect]", message);
    return NextResponse.redirect(
      new URL(`/settings?error=${encodeURIComponent(message)}`, getAppUrl())
    );
  }
}
