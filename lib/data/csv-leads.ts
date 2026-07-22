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
import { calculateIntentScoreBonus } from "@/lib/leads/intent-scoring";
import {
  applyMqlStatus,
  evaluateMqlQualification,
} from "@/lib/leads/mql-qualification";

const DEFAULT_CSV_FILENAME = "SDR Lead Tracker NEW - Lead Tracker.csv";
const UPLOADED_CSV_FILENAME = "lead-tracker.csv";
const UPLOAD_META_FILENAME = "lead-tracker-meta.json";

/** Columns expected in an SDR Lead Tracker export. */
export const CSV_COLUMNS = [
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

/** Minimum columns required for a usable upload. */
export const REQUIRED_CSV_COLUMNS = [
  "Email",
  "Company",
  "Full Name",
  "Lead Status",
] as const;

type CsvRow = Record<(typeof CSV_COLUMNS)[number], string>;

export type CsvSourceMeta = {
  filename: string;
  source: "upload" | "bundled" | "env" | "missing";
  rowCount: number;
  leadCount: number;
  uploadedAt: string | null;
  pathLabel: string;
};

type UploadMetaFile = {
  originalFilename: string;
  uploadedAt: string;
  rowCount: number;
  leadCount: number;
};

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

function getDataDir(): string {
  return path.join(process.cwd(), ".data");
}

function getUploadedCsvPath(): string {
  return path.join(getDataDir(), UPLOADED_CSV_FILENAME);
}

function getUploadMetaPath(): string {
  return path.join(getDataDir(), UPLOAD_META_FILENAME);
}

function getBundledCsvPath(): string {
  return path.join(process.cwd(), DEFAULT_CSV_FILENAME);
}

function getEnvCsvPath(): string | null {
  const configured = process.env.LEAD_TRACKER_CSV_PATH;
  if (!configured) return null;
  return path.isAbsolute(configured)
    ? configured
    : path.join(process.cwd(), configured);
}

/**
 * Prefer an admin-uploaded CSV, then LEAD_TRACKER_CSV_PATH, then the bundled export.
 */
function getCsvPath(): string {
  const uploaded = getUploadedCsvPath();
  if (fs.existsSync(uploaded)) return uploaded;

  const envPath = getEnvCsvPath();
  if (envPath && fs.existsSync(envPath)) return envPath;

  return getBundledCsvPath();
}

function readUploadMeta(): UploadMetaFile | null {
  try {
    const metaPath = getUploadMetaPath();
    if (!fs.existsSync(metaPath)) return null;
    const parsed = JSON.parse(fs.readFileSync(metaPath, "utf8")) as UploadMetaFile;
    if (!parsed?.originalFilename || !parsed?.uploadedAt) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearCsvCache(): void {
  cachedLeads = null;
  cachedRows = null;
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
  intentBonus?: number;
  mqlQualified?: boolean;
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
  if ((params.intentBonus ?? 0) > 0) {
    parts.push(`+${params.intentBonus} high-intent points (last 14 days)`);
  }
  if (params.mqlQualified) {
    parts.push("meets Suggested MQL rule");
  }

  if (parts.length === 0) {
    return "Recent engagement detected from the SDR lead tracker export.";
  }

  const intent =
    params.mqlQualified ||
    (params.intentBonus ?? 0) >= 40 ||
    (params.accountHealth === "Green" && params.touchpoints >= 3)
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

/** Latest parseable activity date in the export — used as the 14-day window anchor. */
function latestActivityDate(rows: CsvRow[]): Date {
  let latest = 0;
  for (const row of rows) {
    const parsed = parseActivityDate(row["Last Activity Date"]);
    if (parsed) latest = Math.max(latest, parsed.getTime());
  }
  return latest > 0 ? new Date(latest) : new Date();
}

function rowToActivity(row: CsvRow, index: number): EngagementActivity {
  return {
    id: `activity-${index}`,
    date: formatIsoDate(row["Last Activity Date"]),
    activity: activityLabel(row["Member Status"], row["Campaign Name"]),
    source: activitySource(row["Member Status"], row["Campaign Name"]),
  };
}

function buildLead(email: string, rows: CsvRow[], intentAsOf: Date): Lead {
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

  const engagementScoreBase = engagementScoreFromSignals(
    segment,
    sortedRows.length,
    accountHealth
  );

  const intentEvents = sortedRows.flatMap((row) => {
    const date = parseActivityDate(row["Last Activity Date"]);
    if (!date) return [];
    return [
      {
        date,
        memberStatus: row["Member Status"],
        campaignName: row["Campaign Name"],
      },
    ];
  });
  const intent = calculateIntentScoreBonus(intentEvents, intentAsOf);
  const engagementScore = engagementScoreBase + intent.bonus;

  const activities = sortedRows
    .map((row, index) => rowToActivity(row, index))
    .sort((a, b) => b.date.localeCompare(a.date));

  const owner = firstNonEmpty(sortedRows.map((row) => row.Owner)) || "Unassigned";
  const name =
    firstNonEmpty(sortedRows.map((row) => row["Full Name"])) ||
    email.split("@")[0].replace(/[._]/g, " ");
  const company = firstNonEmpty(sortedRows.map((row) => row.Company));
  const title = firstNonEmpty(sortedRows.map((row) => row.Title));
  const sourceStatus = pickLeadStatus(sortedRows.map((row) => row["Lead Status"]));

  const mqlQualification = evaluateMqlQualification({
    title,
    company,
    email: latest.Email.trim(),
    segment,
    leadScore: engagementScore,
    events: intentEvents,
    asOf: intentAsOf,
  });
  const status = applyMqlStatus(sourceStatus, mqlQualification);

  return {
    id: leadIdFromEmail(email),
    name,
    email: latest.Email.trim(),
    company,
    title,
    status,
    owner,
    engagementScore,
    baseEngagementScore: engagementScoreBase,
    intentScoreBonus: intent.bonus,
    intentScoreBreakdown: intent.breakdown,
    mqlQualification,
    momentum: momentumFromSignals(accountHealth, lastActivity),
    lastActivity,
    source: campaignChannel(latest["Campaign Name"]),
    websiteVisits,
    assetDownloads,
    webinarAttendance,
    conversionProbability: Math.min(95, Math.max(10, Math.min(engagementScore, 99) - 5)),
    aiSummary: buildAiSummary({
      touchpoints: sortedRows.length,
      websiteVisits,
      webinarAttendance,
      segment,
      accountHealth,
      intentBonus: intent.bonus,
      mqlQualified: mqlQualification.qualifies,
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
  const intentAsOf = latestActivityDate(rows);
  const grouped = groupRowsByEmail(rows);
  const leads = Array.from(grouped.entries())
    .map(([email, emailRows]) => buildLead(email, emailRows, intentAsOf))
    .sort((a, b) => b.engagementScore - a.engagementScore);

  console.log(
    `[csv-leads] Loaded ${leads.length} leads from ${path.basename(csvPath)} (intent window as of ${intentAsOf.toISOString().slice(0, 10)})`
  );
  return { rows, leads };
}

export type CsvValidationResult =
  | {
      ok: true;
      rowCount: number;
      leadCount: number;
      missingOptionalColumns: string[];
    }
  | {
      ok: false;
      error: string;
      missingRequiredColumns?: string[];
    };

/**
 * Validates Lead Tracker CSV content before saving an upload.
 */
export function validateCsvContent(content: string): CsvValidationResult {
  const trimmed = content.replace(/^\uFEFF/, "").trim();
  if (!trimmed) {
    return { ok: false, error: "CSV file is empty." };
  }

  const lines = trimmed.split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) {
    return {
      ok: false,
      error: "CSV needs a header row and at least one data row.",
    };
  }

  const header = parseCsvLine(lines[0]).map((value) => value.trim());
  const missingRequired = REQUIRED_CSV_COLUMNS.filter(
    (column) => !header.includes(column)
  );

  if (missingRequired.length > 0) {
    return {
      ok: false,
      error: `Missing required columns: ${missingRequired.join(", ")}.`,
      missingRequiredColumns: [...missingRequired],
    };
  }

  const rows = parseCsv(content);
  if (rows.length === 0) {
    return { ok: false, error: "No data rows found in the CSV." };
  }

  const leads = Array.from(groupRowsByEmail(rows).entries());
  if (leads.length === 0) {
    return {
      ok: false,
      error:
        "No usable leads found. Each row needs a non-empty Email and Company.",
    };
  }

  const missingOptional = CSV_COLUMNS.filter(
    (column) =>
      !(REQUIRED_CSV_COLUMNS as readonly string[]).includes(column) &&
      !header.includes(column)
  );

  return {
    ok: true,
    rowCount: rows.length,
    leadCount: leads.length,
    missingOptionalColumns: [...missingOptional],
  };
}

/**
 * Saves an admin-uploaded Lead Tracker CSV and refreshes the in-memory cache.
 */
export function saveUploadedCsv(
  content: string,
  originalFilename: string
): CsvSourceMeta {
  const validation = validateCsvContent(content);
  if (!validation.ok) {
    throw new Error(validation.error);
  }

  const dataDir = getDataDir();
  fs.mkdirSync(dataDir, { recursive: true });

  const csvPath = getUploadedCsvPath();
  fs.writeFileSync(csvPath, content.replace(/^\uFEFF/, ""), "utf8");

  const meta: UploadMetaFile = {
    originalFilename: originalFilename || UPLOADED_CSV_FILENAME,
    uploadedAt: new Date().toISOString(),
    rowCount: validation.rowCount,
    leadCount: validation.leadCount,
  };
  fs.writeFileSync(getUploadMetaPath(), JSON.stringify(meta, null, 2), "utf8");

  clearCsvCache();
  // Warm cache from the new file.
  const loaded = loadCsvContent();
  cachedRows = loaded.rows;
  cachedLeads = loaded.leads;

  return getCsvSourceMeta();
}

export function getCsvSourceMeta(): CsvSourceMeta {
  const uploadedPath = getUploadedCsvPath();
  const uploadMeta = readUploadMeta();
  const leads = getCsvLeads();
  const rows = getCsvRows();

  if (fs.existsSync(uploadedPath)) {
    return {
      filename: uploadMeta?.originalFilename ?? UPLOADED_CSV_FILENAME,
      source: "upload",
      rowCount: uploadMeta?.rowCount || rows.length,
      leadCount: uploadMeta?.leadCount || leads.length,
      uploadedAt: uploadMeta?.uploadedAt ?? null,
      pathLabel: `.data/${UPLOADED_CSV_FILENAME}`,
    };
  }

  const envPath = getEnvCsvPath();
  if (envPath && fs.existsSync(envPath)) {
    return {
      filename: path.basename(envPath),
      source: "env",
      rowCount: rows.length,
      leadCount: leads.length,
      uploadedAt: null,
      pathLabel: path.basename(envPath),
    };
  }

  const bundled = getBundledCsvPath();
  if (fs.existsSync(bundled)) {
    return {
      filename: DEFAULT_CSV_FILENAME,
      source: "bundled",
      rowCount: rows.length,
      leadCount: leads.length,
      uploadedAt: null,
      pathLabel: DEFAULT_CSV_FILENAME,
    };
  }

  return {
    filename: "None",
    source: "missing",
    rowCount: 0,
    leadCount: 0,
    uploadedAt: null,
    pathLabel: "No CSV loaded",
  };
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
