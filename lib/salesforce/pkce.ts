import { createHash, randomBytes } from "crypto";

/** Generates a PKCE code verifier (43–128 chars, URL-safe). */
export function generateCodeVerifier(): string {
  return randomBytes(32).toString("base64url");
}

/** SHA-256 code challenge for S256 PKCE flow required by Salesforce Connected Apps. */
export function generateCodeChallenge(verifier: string): string {
  return createHash("sha256").update(verifier).digest("base64url");
}
