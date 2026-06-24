import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { exchangeCodeForTokens } from "@/lib/salesforce/client";
import { syncLeads } from "@/lib/salesforce/sync-leads";
import { OAUTH_STATE_COOKIE } from "@/lib/salesforce/oauth";

const SETTINGS_PATH = "/settings";

/**
 * GET /api/salesforce/callback
 *
 * Step 2 of the OAuth flow (server-side only):
 * 1. Salesforce redirects here with `code` and `state` query parameters.
 * 2. Verify the state matches the httpOnly cookie set in /connect (CSRF check).
 * 3. Exchange the authorization code for access + refresh tokens using the client secret.
 * 4. Store tokens securely server-side (Supabase in production).
 * 5. Kick off an initial lead sync (logs records for now).
 * 6. Redirect back to Settings with a success or error message.
 */
export async function GET(request: NextRequest) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? request.nextUrl.origin;
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

  cookieStore.delete(OAUTH_STATE_COOKIE);

  if (!storedState || storedState !== state) {
    return redirectWith({ error: "Invalid OAuth state. Please try connecting again." });
  }

  try {
    // Exchange code for tokens — client secret is used only in this server-side call.
    await exchangeCodeForTokens(code);

    // Initial sync: fetch leads and log them. TODO: persist to Supabase.
    try {
      await syncLeads();
    } catch (syncError) {
      // OAuth succeeded but sync failed — still report partial success.
      console.error("[salesforce/callback] Initial sync failed:", syncError);
      return redirectWith({
        connected: "true",
        warning: "Connected to Salesforce, but initial lead sync failed. Check server logs.",
      });
    }

    return redirectWith({ connected: "true" });
  } catch (tokenError) {
    const message =
      tokenError instanceof Error
        ? tokenError.message
        : "Token exchange failed.";
    console.error("[salesforce/callback]", message);
    return redirectWith({ error: message });
  }
}
