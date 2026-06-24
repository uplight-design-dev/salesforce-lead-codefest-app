import { randomBytes } from "crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { buildAuthorizeUrl, getSalesforceConfig } from "@/lib/salesforce/config";
import { OAUTH_STATE_COOKIE } from "@/lib/salesforce/oauth";

/**
 * GET /api/salesforce/connect
 *
 * Step 1 of the OAuth flow (server-side only):
 * 1. Read Salesforce config from environment variables (client secret stays here).
 * 2. Generate a CSRF state token and store it in an httpOnly cookie.
 * 3. Redirect the browser to Salesforce's authorization endpoint.
 *
 * The browser never sees the client secret — only the public client_id is sent to Salesforce.
 */
export async function GET() {
  try {
    const config = getSalesforceConfig();

    // CSRF protection: random state verified in the callback route.
    const state = randomBytes(32).toString("hex");
    const cookieStore = await cookies();

    cookieStore.set(OAUTH_STATE_COOKIE, state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 10, // 10 minutes — enough time to complete OAuth
      path: "/",
    });

    const authorizeUrl = buildAuthorizeUrl({
      clientId: config.clientId,
      redirectUri: config.redirectUri,
      loginUrl: config.loginUrl,
      state,
    });

    return NextResponse.redirect(authorizeUrl);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to start Salesforce OAuth";
    console.error("[salesforce/connect]", message);
    return NextResponse.redirect(
      new URL(`/settings?error=${encodeURIComponent(message)}`, process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000")
    );
  }
}
