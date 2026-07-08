/**
 * Loads and normalizes leads from the SDR Lead Tracker CSV export.
 * Used as interim data while Salesforce OAuth is being configured.
 */

import fs from "fs";
import path from "path";
import type {
  EngagementActivity,
  Lead,
  LeadStatus,
  Momentum,
} from "@/lib/types/lead";

const DEFAULT_CSV_FILENAME = "SDR Lead Tracker NEW - Lead Tracker.csv";

const CSV_COLUMNS = [
  "Owner",
  "Full Name",
  "Title",
  "Company",
  "Email",
  "Campaign Name",
  "Member Status",
  "Lead Status",
  "Last Activity Date",
  "Next Follow-Up Date",
  "Days Since Last Activity",
  "Priority",
  "Segment",
  "Account Health",
  "Notes/Activity",
] as const;

type CsvRow = Record<(typeof CSV_COLUMNS)[number], string>;

const SEGMENT_BASE_SCORE: Record<string, number> = {
  "1_Platinum": 92,
  "2_Gold": 84,
  "3_Silver": 76,
  "4_Bronze": 68,
  "6_Prospect": 58,
};

const STATUS_PRIORITY: Record<LeadStatus, number> = {
  closed_won: 100,
  opportunity: 90,
  sql: 85,
  mql: 80,
  nurturing: 70,
  contacted: 65,
  assigned: 60,
  engaged: 50,
  new: 45,
  stalled: 30,
  closed_lost: 10,
};

let cachedLeads: Lead[] | null = null;
let cachedRows: CsvRow[] | null = null;

function getCsvPath(): string {
  const configured = process.env.LEAD_TRACKER_CSV_PATH;
  if (configured) {
    return path.isAbsolute(configured)
      ? configured
      : path.join(process.cwd(), configured);
  }
  return path.join(process.cwd(), DEFAULT_CSV_FILENAME);
}

function parseCsvLine(line: string): string[] {
  const values: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      values.push(current);
      current = "";
      continue;
    }

    current += char;
  }

  values.push(current);
  return values;
}

function parseCsv(content: string): CsvRow[] {
  const lines = content.replace(/^\uFEFF/, "").split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return [];

  const header = parseCsvLine(lines[0]);
  const rows: CsvRow[] = [];

  for (let lineIndex = 1; lineIndex < lines.length; lineIndex++) {
    const cells = parseCsvLine(lines[lineIndex]);
    const row = {} as CsvRow;

    for (let i = 0; i < CSV_COLUMNS.length; i++) {
      const column = CSV_COLUMNS[i];
      const headerIndex = header.findIndex((value) => value.trim() === column);
      row[column] = (headerIndex >= 0 ? cells[headerIndex] : cells[i] ?? "").trim();
    }

    rows.push(row);
  }

  return rows;
}

function parseActivityDate(value: string): Date | null {
  if (!value) return null;

  const slashParts = value.split("/");
  if (slashParts.length === 3) {
    const [month, day, year] = slashParts.map((part) => Number.parseInt(part, 10));
    if (month && day && year) {
      return new Date(year, month - 1, day);
    }
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatIsoDate(value: string): string {
  const parsed = parseActivityDate(value);
  if (!parsed) return value || "—";
  return parsed.toISOString().slice(0, 10);
}

function mapLeadStatus(value: string): LeadStatus | null {
  const normalized = value.trim().toLowerCase();
  if (!normalized) return null;
  if (normalized.includes("closed won") || normalized === "won") return "closed_won";
  if (
    normalized.includes("closed lost") ||
    normalized.includes("disqualif") ||
    normalized === "lost"
  ) {
    return "closed_lost";
  }
  if (normalized.includes("qualified")) return "mql";
  if (normalized.includes("nurtur")) return "nurturing";
  if (normalized.includes("new")) return "new";
  if (normalized.includes("sql")) return "sql";
  if (normalized.includes("opportunity")) return "opportunity";
  if (normalized.includes("contact")) return "contacted";
  return "engaged";
}

function pickLeadStatus(statuses: string[]): LeadStatus {
  let best: LeadStatus = "engaged";
  let bestPriority = STATUS_PRIORITY[best];

  for (const status of statuses) {
    const mapped = mapLeadStatus(status);
    if (!mapped) continue;
    const priority = STATUS_PRIORITY[mapped];
    if (priority > bestPriority) {
      best = mapped;
      bestPriority = priority;
    }
  }

  return best;
}

function segmentRank(segment: string): number {
  const match = segment.match(/^(\d+)_/);
  return match ? Number.parseInt(match[1], 10) : 99;
}

function pickBestSegment(segments: string[]): string {
  return segments.reduce((best, current) => {
    if (!current) return best;
    if (!best) return current;
    return segmentRank(current) < segmentRank(best) ? current : best;
  }, "");
}

function activitySource(
  memberStatus: string,
  campaignName: string
): EngagementActivity["source"] {
  const status = memberStatus.toLowerCase();
  const campaign = campaignName.toLowerCase();

  if (status.includes("attended") || status.includes("registered")) return "webinar";
  if (status.includes("page visit") || campaign.includes("[web]")) return "website";
  if (status.includes("contacted")) return "sales";
  return "marketing";
}

function activityLabel(memberStatus: string, campaignName: string): string {
  if (!campaignName) return memberStatus || "Engagement";
  if (!memberStatus) return campaignName;

  const shortCampaign = campaignName.replace(/^\[[^\]]+\]\s*/, "");
  return `${memberStatus} — ${shortCampaign}`;
}

function momentumFromSignals(
  accountHealth: string,
  lastActivityIso: string
): Momentum {
  if (accountHealth === "Green") return "accelerating";
  if (accountHealth === "Yellow") return "stalled";

  const parsed = parseActivityDate(lastActivityIso);
  if (!parsed) return "stalled";

  const daysSince = (Date.now() - parsed.getTime()) / (1000 * 60 * 60 * 24);
  if (daysSince <= 14) return "accelerating";
  if (daysSince <= 30) return "stalled";
  return "at_risk";
}

function engagementScoreFromSignals(
  segment: string,
  touchpoints: number,
  accountHealth: string
): number {
  const base = SEGMENT_BASE_SCORE[segment] ?? 55;
  const touchpointBoost = Math.min(touchpoints - 1, 5) * 3;
  const healthBoost = accountHealth === "Green" ? 5 : accountHealth === "Yellow" ? 0 : -5;
  return Math.min(99, Math.max(35, base + touchpointBoost + healthBoost));
}

function campaignChannel(campaignName: string): string {
  const match = campaignName.match(/^\[([^\]]+)\]/);
  if (match) return match[1];
  if (campaignName.toLowerCase().includes("homepage")) return "WEB";
  return "Marketing";
}

function leadIdFromEmail(email: string): string {
  return `csv-${email.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`;
}

function firstNonEmpty(values: string[]): string {
  return values.find((value) => value.trim())?.trim() ?? "";
}

function buildAiSummary(params: {
  touchpoints: number;
  websiteVisits: number;
  webinarAttendance: number;
  segment: string;
  accountHealth: string;
}): string {
  const parts: string[] = [];

  if (params.touchpoints > 1) {
    parts.push(`${params.touchpoints} marketing touchpoints`);
  }
  if (params.webinarAttendance > 0) {
    parts.push(
      `${params.webinarAttendance} webinar engagement${params.webinarAttendance > 1 ? "s" : ""}`
    );
  }
  if (params.websiteVisits > 0) {
    parts.push(
      `${params.websiteVisits} website visit${params.websiteVisits > 1 ? "s" : ""}`
    );
  }
  if (params.segment) {
    parts.push(`${params.segment.replace("_", " ")} account segment`);
  }
  if (params.accountHealth) {
    parts.push(`${params.accountHealth.toLowerCase()} account health`);
  }

  if (parts.length === 0) {
    return "Recent engagement detected from the SDR lead tracker export.";
  }

  const intent =
    params.accountHealth === "Green" && params.touchpoints >= 3
      ? "Strong buying intent."
      : params.accountHealth === "Yellow"
        ? "Moderate intent — follow-up recommended."
        : "Monitor for additional engagement signals.";

  return `${parts.join(", ")}. ${intent}`;
}

function isUsableRow(row: CsvRow): boolean {
  return Boolean(row.Email.trim() && row.Company.trim());
}

function groupRowsByEmail(rows: CsvRow[]): Map<string, CsvRow[]> {
  const grouped = new Map<string, CsvRow[]>();

  for (const row of rows) {
    if (!isUsableRow(row)) continue;
    const email = row.Email.trim().toLowerCase();
    const existing = grouped.get(email) ?? [];
    existing.push(row);
    grouped.set(email, existing);
  }

  return grouped;
}

function rowToActivity(row: CsvRow, index: number): EngagementActivity {
  return {
    id: `activity-${index}`,
    date: formatIsoDate(row["Last Activity Date"]),
    activity: activityLabel(row["Member Status"], row["Campaign Name"]),
    source: activitySource(row["Member Status"], row["Campaign Name"]),
  };
}

function buildLead(email: string, rows: CsvRow[]): Lead {
  const sortedRows = [...rows].sort((a, b) => {
    const aDate = parseActivityDate(a["Last Activity Date"])?.getTime() ?? 0;
    const bDate = parseActivityDate(b["Last Activity Date"])?.getTime() ?? 0;
    return bDate - aDate;
  });

  const latest = sortedRows[0];
  const segment = pickBestSegment(sortedRows.map((row) => row.Segment));
  const accountHealth = firstNonEmpty(sortedRows.map((row) => row["Account Health"]));
  const lastActivity = formatIsoDate(latest["Last Activity Date"]);

  const websiteVisits = sortedRows.filter((row) =>
    row["Member Status"].toLowerCase().includes("page visit")
  ).length;
  const webinarAttendance = sortedRows.filter((row) => {
    const status = row["Member Status"].toLowerCase();
    return status.includes("attended") || status.includes("registered");
  }).length;
  const assetDownloads = sortedRows.filter((row) =>
    row["Member Status"].toLowerCase().includes("converted")
  ).length;

  const engagementScore = engagementScoreFromSignals(
    segment,
    sortedRows.length,
    accountHealth
  );

  const activities = sortedRows
    .map((row, index) => rowToActivity(row, index))
    .sort((a, b) => b.date.localeCompare(a.date));

  const owner = firstNonEmpty(sortedRows.map((row) => row.Owner)) || "Unassigned";
  const name =
    firstNonEmpty(sortedRows.map((row) => row["Full Name"])) ||
    email.split("@")[0].replace(/[._]/g, " ");

  return {
    id: leadIdFromEmail(email),
    name,
    email: latest.Email.trim(),
    company: firstNonEmpty(sortedRows.map((row) => row.Company)),
    title: firstNonEmpty(sortedRows.map((row) => row.Title)),
    status: pickLeadStatus(sortedRows.map((row) => row["Lead Status"])),
    owner,
    engagementScore,
    momentum: momentumFromSignals(accountHealth, lastActivity),
    lastActivity,
    source: campaignChannel(latest["Campaign Name"]),
    websiteVisits,
    assetDownloads,
    webinarAttendance,
    conversionProbability: Math.min(95, Math.max(10, engagementScore - 5)),
    aiSummary: buildAiSummary({
      touchpoints: sortedRows.length,
      websiteVisits,
      webinarAttendance,
      segment,
      accountHealth,
    }),
    activities,
  };
}

function loadCsvContent(): { rows: CsvRow[]; leads: Lead[] } {
  const csvPath = getCsvPath();
  if (!fs.existsSync(csvPath)) {
    console.warn(`[csv-leads] CSV not found at ${csvPath}`);
    return { rows: [], leads: [] };
  }

  const content = fs.readFileSync(csvPath, "utf8");
  const rows = parseCsv(content);
  const grouped = groupRowsByEmail(rows);
  const leads = Array.from(grouped.entries())
    .map(([email, emailRows]) => buildLead(email, emailRows))
    .sort((a, b) => b.engagementScore - a.engagementScore);

  console.log(`[csv-leads] Loaded ${leads.length} leads from ${path.basename(csvPath)}`);
  return { rows, leads };
}

/** Raw CSV rows (cached). Useful for campaign-level aggregations. */
export function getCsvRows(): CsvRow[] {
  if (!cachedRows) {
    const loaded = loadCsvContent();
    cachedRows = loaded.rows;
    cachedLeads = loaded.leads;
  }
  return cachedRows;
}

export function getCsvLeads(): Lead[] {
  if (!cachedLeads) {
    const loaded = loadCsvContent();
    cachedRows = loaded.rows;
    cachedLeads = loaded.leads;
  }
  return cachedLeads;
}

/**
 * Returns leads parsed from the SDR Lead Tracker CSV.
 * Results are cached for the lifetime of the server process.
 */
export function getCsvLeadById(id: string): Lead | undefined {
  return getCsvLeads().find((lead) => lead.id === id);
}
