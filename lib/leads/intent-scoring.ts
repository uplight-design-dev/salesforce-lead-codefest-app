/**
 * High-Intent Lead Scoring Criteria (Last 14 Days).
 * Bonuses sit on top of the existing segment/touchpoint base score.
 *
 * Signals not present in the Lead Tracker CSV are skipped for now:
 * Email Opens, Demo Request, Contact Us Form, Event Booth / Badge Scan.
 */

import type { IntentScoreBreakdownItem } from "@/lib/types/lead";

export type IntentActivityEvent = {
  date: Date;
  memberStatus: string;
  campaignName: string;
};

export type IntentScoreResult = {
  bonus: number;
  breakdown: IntentScoreBreakdownItem[];
};

const WINDOW_DAYS = 14;

function statusOf(event: IntentActivityEvent): string {
  return event.memberStatus.trim().toLowerCase();
}

function campaignOf(event: IntentActivityEvent): string {
  return event.campaignName.trim().toLowerCase();
}

function isEmailClick(event: IntentActivityEvent): boolean {
  return statusOf(event).includes("clicked email");
}

function isWebsiteVisit(event: IntentActivityEvent): boolean {
  return statusOf(event).includes("page visit");
}

function isProductPageVisit(event: IntentActivityEvent): boolean {
  if (!isWebsiteVisit(event) && !campaignOf(event).includes("[web]")) {
    return false;
  }
  const campaign = campaignOf(event);
  if (!campaign) return false;
  if (campaign.includes("homepage") || campaign.includes("newsroom")) {
    return false;
  }
  // Product / solution / resources pages from the web channel.
  return (
    campaign.includes("[web]") ||
    campaign.includes("demand response") ||
    campaign.includes("resources") ||
    campaign.includes("product") ||
    campaign.includes("pricing") ||
    campaign.includes("solution")
  );
}

function isAssetDownload(event: IntentActivityEvent): boolean {
  const status = statusOf(event);
  const campaign = campaignOf(event);
  if (status.includes("converted")) return true;
  return (
    campaign.includes("whitepaper") ||
    campaign.includes("ebook") ||
    campaign.includes("e-book") ||
    campaign.includes("download")
  );
}

function isWebinarRegistration(event: IntentActivityEvent): boolean {
  return statusOf(event).includes("registered");
}

function isWebinarAttendance(event: IntentActivityEvent): boolean {
  const status = statusOf(event);
  if (!status.includes("attended")) return false;
  const campaign = campaignOf(event);
  // UCC badge scans are event booth activity (not scored yet — no CSV mapping confirmed).
  if (campaign.includes("[ucc]")) return false;
  return (
    campaign.includes("[wg]") ||
    campaign.includes("[wb]") ||
    campaign.includes("webinar")
  );
}

function isLinkedInAdClick(event: IntentActivityEvent): boolean {
  const status = statusOf(event);
  return status.includes("clicked paid") || status.includes("clicked organic");
}

function dayKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function withinLastDays(
  events: IntentActivityEvent[],
  days: number,
  asOf: Date
): IntentActivityEvent[] {
  const cutoff = asOf.getTime() - days * 24 * 60 * 60 * 1000;
  return events.filter((event) => event.date.getTime() >= cutoff);
}

function award(
  parameter: string,
  threshold: string,
  points: number,
  met: boolean,
  observed: string
): IntentScoreBreakdownItem {
  return {
    parameter,
    threshold,
    points: met ? points : 0,
    observed,
    awarded: met,
  };
}

/**
 * Calculates 14-day high-intent bonuses from dated activity events.
 * Rows without a parseable Last Activity Date must be omitted by the caller.
 *
 * `asOf` defaults to now. For CSV exports, pass the latest activity date in
 * the file so a stale tracker still scores against its own time window.
 */
export function calculateIntentScoreBonus(
  events: IntentActivityEvent[],
  asOf: Date = new Date()
): IntentScoreResult {
  const recent = withinLastDays(events, WINDOW_DAYS, asOf);

  const emailClicks = recent.filter(isEmailClick).length;
  const websiteVisits = recent.filter(isWebsiteVisit).length;
  const productPageVisits = recent.filter(isProductPageVisit).length;
  const assetDownloads = recent.filter(isAssetDownload).length;
  const webinarRegistrations = recent.filter(isWebinarRegistration).length;
  const webinarAttendances = recent.filter(isWebinarAttendance).length;
  const linkedInClicks = recent.filter(isLinkedInAdClick).length;

  const websiteDays = new Set(
    recent.filter(isWebsiteVisit).map((event) => dayKey(event.date))
  ).size;

  const assets = new Set(
    recent
      .filter(
        (event) =>
          isAssetDownload(event) ||
          isProductPageVisit(event) ||
          isWebinarRegistration(event) ||
          isWebinarAttendance(event) ||
          campaignOf(event).includes("blog") ||
          campaignOf(event).includes("whitepaper") ||
          campaignOf(event).includes("ebook") ||
          campaignOf(event).includes("toolkit")
      )
      .map((event) => event.campaignName.trim().toLowerCase())
      .filter(Boolean)
  ).size;

  const breakdown: IntentScoreBreakdownItem[] = [
    award("Email Clicks", "≥ 5", 10, emailClicks >= 5, String(emailClicks)),
    award("Website Visits", "≥ 5", 15, websiteVisits >= 5, String(websiteVisits)),
    award(
      "Product Page Visits",
      "≥ 2",
      25,
      productPageVisits >= 2,
      String(productPageVisits)
    ),
    award(
      "Whitepaper/eBook Downloads",
      "≥ 2",
      20,
      assetDownloads >= 2,
      String(assetDownloads)
    ),
    award(
      "Webinar Registration",
      "1",
      15,
      webinarRegistrations >= 1,
      String(webinarRegistrations)
    ),
    award(
      "Webinar Attendance",
      "1",
      25,
      webinarAttendances >= 1,
      String(webinarAttendances)
    ),
    award(
      "Return Website Visits",
      "≥ 3 different days",
      15,
      websiteDays >= 3,
      `${websiteDays} days`
    ),
    award(
      "Multiple Asset Engagement",
      "≥ 4 different assets",
      20,
      assets >= 4,
      `${assets} assets`
    ),
    award("LinkedIn Ad Clicks", "≥ 2", 10, linkedInClicks >= 2, String(linkedInClicks)),
  ];

  const bonus = breakdown.reduce((sum, item) => sum + item.points, 0);
  return { bonus, breakdown };
}
