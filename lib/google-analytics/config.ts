/**
 * Server-only Google Analytics 4 configuration.
 *
 * Used to pull uplight.com usage data (page views, sessions, engagement)
 * and correlate with lead activity in the dashboard.
 */

export type GoogleAnalyticsConfig = {
  propertyId: string;
  clientEmail: string;
  privateKey: string;
};

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

/** Returns validated GA4 config. Throws if credentials are not configured. */
export function getGoogleAnalyticsConfig(): GoogleAnalyticsConfig {
  return {
    propertyId: requireEnv("GOOGLE_ANALYTICS_PROPERTY_ID"),
    clientEmail: requireEnv("GOOGLE_ANALYTICS_CLIENT_EMAIL"),
    // Private keys in env vars often use literal \n — normalize to real newlines.
    privateKey: requireEnv("GOOGLE_ANALYTICS_PRIVATE_KEY").replace(/\\n/g, "\n"),
  };
}

/** True when GA4 credentials are present (used to show connection status in Settings). */
export function isGoogleAnalyticsConfigured(): boolean {
  return Boolean(
    process.env.GOOGLE_ANALYTICS_PROPERTY_ID &&
      process.env.GOOGLE_ANALYTICS_CLIENT_EMAIL &&
      process.env.GOOGLE_ANALYTICS_PRIVATE_KEY
  );
}
