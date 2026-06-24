/**
 * Server-side Google Analytics Data API client.
 *
 * Fetches uplight.com engagement metrics to enrich lead timelines and
 * high-intent alerts (e.g. pricing page visits, contact us page visits).
 *
 * TODO: Install @google-analytics/data and wire up live API calls when credentials are ready.
 */

import type { WebsiteEngagement } from "@/lib/types/lead";
import { getGoogleAnalyticsConfig, isGoogleAnalyticsConfigured } from "./config";

/** Mock uplight.com page engagement — replaced by live GA4 data when connected. */
const MOCK_WEBSITE_ENGAGEMENT: WebsiteEngagement[] = [
  { pagePath: "/", sessions: 1240, users: 980, avgEngagementTime: 142 },
  { pagePath: "/solutions", sessions: 620, users: 510, avgEngagementTime: 198 },
  { pagePath: "/pricing", sessions: 340, users: 290, avgEngagementTime: 245 },
  { pagePath: "/contact", sessions: 180, users: 165, avgEngagementTime: 120 },
  { pagePath: "/resources/whitepaper-demand-response", sessions: 420, users: 380, avgEngagementTime: 310 },
  { pagePath: "/webinars", sessions: 290, users: 260, avgEngagementTime: 175 },
];

/**
 * Fetches top uplight.com pages by session count for the last 7 days.
 *
 * Live implementation will call GA4 runReport with:
 *   dimensions: pagePath
 *   metrics: sessions, activeUsers, averageSessionDuration
 *   dateRanges: last 7 days
 */
export async function fetchWebsiteEngagement(): Promise<WebsiteEngagement[]> {
  if (!isGoogleAnalyticsConfigured()) {
    console.log(
      "[google-analytics] Using mock data — configure GOOGLE_ANALYTICS_* env vars for live data."
    );
    return MOCK_WEBSITE_ENGAGEMENT;
  }

  const config = getGoogleAnalyticsConfig();

  // TODO: Replace with @google-analytics/data BetaAnalyticsDataClient
  // const client = new BetaAnalyticsDataClient({
  //   credentials: {
  //     client_email: config.clientEmail,
  //     private_key: config.privateKey,
  //   },
  // });
  // const [response] = await client.runReport({
  //   property: `properties/${config.propertyId}`,
  //   dateRanges: [{ startDate: "7daysAgo", endDate: "today" }],
  //   dimensions: [{ name: "pagePath" }],
  //   metrics: [
  //     { name: "sessions" },
  //     { name: "activeUsers" },
  //     { name: "averageSessionDuration" },
  //   ],
  //   orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
  //   limit: 10,
  // });

  console.log(
    `[google-analytics] GA configured for property ${config.propertyId} — returning mock data until API client is wired.`
  );
  return MOCK_WEBSITE_ENGAGEMENT;
}
