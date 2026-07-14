import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import {
  createSalesforceClient,
  exchangeCodeForTokens,
} from "@/lib/salesforce/client";
import { getAppUrl } from "@/lib/salesforce/config";
import { OAUTH_PKCE_COOKIE, OAUTH_STATE_COOKIE } from "@/lib/salesforce/oauth";
import { probeSalesforceAccess } from "@/lib/salesforce/probe";
import { setTokensOnResponse } from "@/lib/salesforce/token-store";

const SETTINGS_PATH = "/settings";

/**
 * GET /api/salesforce/callback
 *
 * Step 2 of the OAuth flow (server-side only):
 * 1. Salesforce redirects here with `code` and `state` query parameters.
 * 2. Verify the state matches the httpOnly cookie set in /connect (CSRF check).
 * 3. Exchange the authorization code for access + refresh tokens using the client secret.
 * 4. Probe report + Lead API access so Settings can show what was actually pulled.
 * 5. Store tokens on the redirect response (so Set-Cookie survives the 302).
 * 6. Redirect back to Settings with a success message.
 */
export async function GET(request: NextRequest) {
  const appUrl = getAppUrl();
  const redirectWith = (params: Record<string, string>) => {
    const url = new URL(SETTINGS_PATH, appUrl);
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }
    return NextResponse.redirect(url);
  };

  const searchParams = request.nextUrl.searchParams;
  const error = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");

  // User denied access or Salesforce returned an error.
  if (error) {
    console.error("[salesforce/callback] OAuth error:", error, errorDescription);
    return redirectWith({
      error: errorDescription ?? error,
    });
  }

  const code = searchParams.get("code");
  const state = searchParams.get("state");

  if (!code || !state) {
    return redirectWith({ error: "Missing authorization code or state parameter." });
  }

  // Verify CSRF state against the httpOnly cookie from /connect.
  const cookieStore = await cookies();
  const storedState = cookieStore.get(OAUTH_STATE_COOKIE)?.value;
  const codeVerifier = cookieStore.get(OAUTH_PKCE_COOKIE)?.value;

  if (!storedState || storedState !== state) {
    return redirectWith({ error: "Invalid OAuth state. Please try connecting again." });
  }

  if (!codeVerifier) {
    return redirectWith({
      error: "Missing PKCE verifier. Please try connecting again.",
    });
  }

  try {
    const tokens = await exchangeCodeForTokens(code, codeVerifier);
    const client = createSalesforceClient(tokens);

    try {
      const probe = await probeSalesforceAccess(client);
      console.log("[salesforce/callback] Access probe:", JSON.stringify(probe));
    } catch (probeError) {
      console.error("[salesforce/callback] Access probe failed:", probeError);
    }

    const response = redirectWith({ connected: "true" });

    // Attach tokens + clear one-time OAuth cookies on the redirect response.
    setTokensOnResponse(response, tokens);
    response.cookies.set(OAUTH_STATE_COOKIE, "", { path: "/", maxAge: 0 });
    response.cookies.set(OAUTH_PKCE_COOKIE, "", { path: "/", maxAge: 0 });

    return response;
  } catch (tokenError) {
    const message =
      tokenError instanceof Error
        ? tokenError.message
        : "Token exchange failed.";
    console.error("[salesforce/callback]", message);
    return redirectWith({ error: message });
  }
}
