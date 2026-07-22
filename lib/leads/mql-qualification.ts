/**
 * MQL qualification from Fit + Engagement criteria.
 *
 * Suggested MQL rule (AND):
 *   Lead Score ≥ 60
 *   Fits ICP (≥ 2 fit criteria)
 *   Engaged with ≥ 3 marketing activities
 *
 * CSV gaps (skipped / heuristic):
 *   Email Opens, Video View — not in Lead Tracker export
 *   Region / Company Size — inferred when possible
 */

import type { IntentActivityEvent } from "@/lib/leads/intent-scoring";
import type {
  LeadStatus,
  MqlCriterionResult,
  MqlQualification,
} from "@/lib/types/lead";

export type { MqlQualification };

const FIT_REQUIRED = 2;
const ENGAGEMENT_REQUIRED = 3;
const SCORE_THRESHOLD = 60;
const WINDOW_DAYS = 14;

const JOB_FUNCTION_KEYWORDS = [
  "c&i",
  "commercial",
  "industrial",
  "customer experience",
  "customer service",
  "customer satisfaction",
  "member engagement",
  "demand response",
  "dsm",
  "demand side",
  "electrification",
  "ev ",
  "electric vehicle",
  "em&v",
  "energy efficiency",
  "energy manager",
  "grid",
  "derms",
  "distributed energy",
  "renewable",
  "innovation",
  "new business",
  "strategy",
  "new product",
  "program manager",
  "program developer",
  "sustainability",
  "regulatory",
  "it ",
  "information technology",
];

const SENIORITY_KEYWORDS = [
  "manager",
  "director",
  "svp",
  "vp",
  "vice president",
  "chief",
  "c-level",
  "ceo",
  "cto",
  "cio",
  "coo",
  "president",
  "head of",
];

const UTILITY_COMPANY_KEYWORDS = [
  "power",
  "energy",
  "electric",
  "utility",
  "gas",
  "authority",
  "cooperative",
  "coop",
  "municipal",
  "grid",
  "hydro",
  "pseg",
  "evergy",
  "dominion",
  "coned",
  "southern",
  "duke",
];

const LARGE_UTILITY_KEYWORDS = [
  "alabama power",
  "georgia power",
  "duke",
  "dominion",
  "aps",
  "arizona public",
  "southern company",
  "evergy",
  "xcel",
  "national grid",
  "pseg",
  "con edison",
  "coned",
  "pacific gas",
  "pg&e",
  "florida power",
  "oncor",
  "aep",
  "american electric",
];

function withinWindow(
  events: IntentActivityEvent[],
  asOf: Date,
  days = WINDOW_DAYS
): IntentActivityEvent[] {
  const cutoff = asOf.getTime() - days * 24 * 60 * 60 * 1000;
  return events.filter((event) => event.date.getTime() >= cutoff);
}

function statusOf(event: IntentActivityEvent): string {
  return event.memberStatus.trim().toLowerCase();
}

function campaignOf(event: IntentActivityEvent): string {
  return event.campaignName.trim().toLowerCase();
}

function dayKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function includesAny(value: string, keywords: string[]): boolean {
  const normalized = value.toLowerCase();
  return keywords.some((keyword) => normalized.includes(keyword));
}

function isEmailClick(event: IntentActivityEvent): boolean {
  return statusOf(event).includes("clicked email");
}

function isNewsletterClick(event: IntentActivityEvent): boolean {
  return isEmailClick(event) && campaignOf(event).includes("newsletter");
}

function isWebsiteVisit(event: IntentActivityEvent): boolean {
  return statusOf(event).includes("page visit");
}

function isSolutionPageVisit(event: IntentActivityEvent): boolean {
  if (!isWebsiteVisit(event) && !campaignOf(event).includes("[web]")) {
    return false;
  }
  const campaign = campaignOf(event);
  if (!campaign || campaign.includes("homepage") || campaign.includes("newsroom")) {
    return false;
  }
  return (
    campaign.includes("[web]") ||
    campaign.includes("demand response") ||
    campaign.includes("derms") ||
    campaign.includes("solution") ||
    campaign.includes("product") ||
    campaign.includes("pricing") ||
    campaign.includes("resources")
  );
}

function isWebinarRegistration(event: IntentActivityEvent): boolean {
  return statusOf(event).includes("registered");
}

function isWebinarAttendance(event: IntentActivityEvent): boolean {
  if (!statusOf(event).includes("attended")) return false;
  const campaign = campaignOf(event);
  if (campaign.includes("[ucc]")) return false;
  return (
    campaign.includes("[wg]") ||
    campaign.includes("[wb]") ||
    campaign.includes("webinar")
  );
}

function isEventBoothScan(event: IntentActivityEvent): boolean {
  return statusOf(event).includes("attended") && campaignOf(event).includes("[ucc]");
}

function isCaseStudyDownload(event: IntentActivityEvent): boolean {
  const campaign = campaignOf(event);
  const status = statusOf(event);
  return (
    campaign.includes("case study") ||
    (status.includes("converted") && campaign.includes("case"))
  );
}

function isWhitepaperDownload(event: IntentActivityEvent): boolean {
  const status = statusOf(event);
  const campaign = campaignOf(event);
  if (isCaseStudyDownload(event)) return false;
  if (status.includes("converted")) return true;
  return (
    campaign.includes("whitepaper") ||
    campaign.includes("ebook") ||
    campaign.includes("e-book") ||
    campaign.includes("download") ||
    campaign.includes("report")
  );
}

function evaluateFitCriteria(input: {
  title: string;
  company: string;
  email: string;
  segment: string;
}): MqlCriterionResult[] {
  const title = input.title.trim();
  const company = input.company.trim();
  const email = input.email.trim().toLowerCase();
  const segment = input.segment.trim();

  const companyType =
    Boolean(company) && includesAny(company, UTILITY_COMPANY_KEYWORDS);
  const jobFunction = Boolean(title) && includesAny(title, JOB_FUNCTION_KEYWORDS);
  const seniority = Boolean(title) && includesAny(title, SENIORITY_KEYWORDS);

  const region =
    email.endsWith(".ca") ||
    email.endsWith(".us") ||
    (Boolean(company) && includesAny(company, UTILITY_COMPANY_KEYWORDS));

  const companySize =
    segment.startsWith("1_") ||
    segment.startsWith("2_") ||
    includesAny(company, LARGE_UTILITY_KEYWORDS);

  return [
    {
      key: "company_type",
      label: "Company Type",
      detail: companyType
        ? `${company || "Company"} matches utility / energy ICP`
        : "Need utility, energy retailer, grid operator, or municipality",
      met: companyType,
    },
    {
      key: "job_function",
      label: "Job Function",
      detail: jobFunction
        ? `Title matches ICP function (${title})`
        : "Need ICP job function (DSM, CX, EE, grid, etc.)",
      met: jobFunction,
    },
    {
      key: "seniority",
      label: "Seniority",
      detail: seniority
        ? `Title matches Manager+ seniority (${title})`
        : "Need Manager, Director, VP, SVP, or C-Level",
      met: seniority,
    },
    {
      key: "region",
      label: "Region",
      detail: region
        ? "Treated as US/Canada target market from company/email signals"
        : "Region not confirmed for US/Canada target markets",
      met: region,
    },
    {
      key: "company_size",
      label: "Company Size",
      detail: companySize
        ? "Large-utility signal from segment or known account"
        : "Need utility serving >100K customers signal",
      met: companySize,
    },
  ];
}

function evaluateEngagementCriteria(
  events: IntentActivityEvent[],
  asOf: Date
): MqlCriterionResult[] {
  const recent = withinWindow(events, asOf);

  const emailClicks = recent.filter(isEmailClick).length;
  const websiteVisits = recent.filter(isWebsiteVisit).length;
  const solutionVisits = recent.filter(isSolutionPageVisit).length;
  const webinarRegs = recent.filter(isWebinarRegistration).length;
  const webinarAttend = recent.filter(isWebinarAttendance).length;
  const caseStudies = recent.filter(isCaseStudyDownload).length;
  const whitepapers = recent.filter(isWhitepaperDownload).length;
  const newsletterClicks = recent.filter(isNewsletterClick).length;
  const websiteDays = new Set(
    recent.filter(isWebsiteVisit).map((event) => dayKey(event.date))
  ).size;
  const boothScans = recent.filter(isEventBoothScan).length;

  return [
    {
      key: "email_opens",
      label: "Email Opens",
      detail: "Not available in Lead Tracker CSV",
      met: false,
    },
    {
      key: "email_clicks",
      label: "Email Clicks",
      detail: `${emailClicks} in last 14 days (need ≥ 2)`,
      met: emailClicks >= 2,
    },
    {
      key: "website_visits",
      label: "Website Visits",
      detail: `${websiteVisits} in last 14 days (need ≥ 3)`,
      met: websiteVisits >= 3,
    },
    {
      key: "solution_page_visits",
      label: "Solution Page Visits",
      detail: `${solutionVisits} observed (need ≥ 2)`,
      met: solutionVisits >= 2,
    },
    {
      key: "webinar_registration",
      label: "Webinar Registration",
      detail: webinarRegs > 0 ? "Registered" : "No registration in window",
      met: webinarRegs >= 1,
    },
    {
      key: "webinar_attendance",
      label: "Webinar Attendance",
      detail: webinarAttend > 0 ? "Attended" : "No webinar attendance in window",
      met: webinarAttend >= 1,
    },
    {
      key: "case_study_download",
      label: "Case Study Download",
      detail: `${caseStudies} observed (need ≥ 1)`,
      met: caseStudies >= 1,
    },
    {
      key: "whitepaper_download",
      label: "Whitepaper/eBook Download",
      detail: `${whitepapers} observed (need ≥ 1)`,
      met: whitepapers >= 1,
    },
    {
      key: "newsletter_click",
      label: "Newsletter Click",
      detail: `${newsletterClicks} observed (need ≥ 2)`,
      met: newsletterClicks >= 2,
    },
    {
      key: "return_website_visits",
      label: "Return Website Visits",
      detail: `${websiteDays} different days (need ≥ 2)`,
      met: websiteDays >= 2,
    },
    {
      key: "video_view",
      label: "Video View (≥60%)",
      detail: "Not available in Lead Tracker CSV",
      met: false,
    },
    {
      key: "event_booth_scan",
      label: "Event Booth Scan",
      detail:
        boothScans > 0 ? "UCC attendance counted as booth scan" : "No UCC booth scan",
      met: boothScans >= 1,
    },
  ];
}

export function evaluateMqlQualification(input: {
  title: string;
  company: string;
  email: string;
  segment: string;
  leadScore: number;
  events: IntentActivityEvent[];
  asOf: Date;
}): MqlQualification {
  const fitCriteria = evaluateFitCriteria(input);
  const engagementCriteria = evaluateEngagementCriteria(input.events, input.asOf);

  const fitCount = fitCriteria.filter((item) => item.met).length;
  const engagementCount = engagementCriteria.filter((item) => item.met).length;
  const fitsIcp = fitCount >= FIT_REQUIRED;
  const scoreMeetsThreshold = input.leadScore >= SCORE_THRESHOLD;
  const engagementMeets =
    engagementCount >= ENGAGEMENT_REQUIRED;
  const qualifies = scoreMeetsThreshold && fitsIcp && engagementMeets;

  const ruleSummary = qualifies
    ? `MQL rule met: score ${input.leadScore} ≥ ${SCORE_THRESHOLD}, ICP fit ${fitCount}/${FIT_REQUIRED}, engagements ${engagementCount}/${ENGAGEMENT_REQUIRED}.`
    : `MQL rule not met yet — need score ≥ ${SCORE_THRESHOLD}, ≥ ${FIT_REQUIRED} fit criteria, and ≥ ${ENGAGEMENT_REQUIRED} engagement activities.`;

  return {
    qualifies,
    fitsIcp,
    fitCount,
    fitRequired: FIT_REQUIRED,
    engagementCount,
    engagementRequired: ENGAGEMENT_REQUIRED,
    scoreMeetsThreshold,
    scoreThreshold: SCORE_THRESHOLD,
    leadScore: input.leadScore,
    fitCriteria,
    engagementCriteria,
    ruleSummary,
  };
}

const STATUS_RANK: Record<LeadStatus, number> = {
  new: 10,
  engaged: 20,
  nurturing: 30,
  assigned: 40,
  contacted: 50,
  mql: 60,
  sql: 70,
  opportunity: 80,
  stalled: 25,
  closed_won: 100,
  closed_lost: 5,
};

/**
 * Promote to MQL when the rule qualifies, without downgrading SQL+ or closed outcomes.
 */
export function applyMqlStatus(
  currentStatus: LeadStatus,
  qualification: MqlQualification
): LeadStatus {
  if (!qualification.qualifies) return currentStatus;
  if (currentStatus === "closed_lost" || currentStatus === "closed_won") {
    return currentStatus;
  }
  if (STATUS_RANK[currentStatus] >= STATUS_RANK.mql) return currentStatus;
  return "mql";
}
