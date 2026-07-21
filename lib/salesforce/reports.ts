/**
 * Salesforce Reports API integration.
 *
 * Pulls engaged contacts from the [SDR] 2026-Engaged Contacts report
 * (and optional pipeline/team reports) via the Analytics REST API.
 */

import { getSalesforceClient, type SalesforceReportResponse } from "./client";
import { applyStatusOverrides } from "@/lib/data/lead-status-overrides";
import { getCsvLeads } from "@/lib/data/csv-leads";
import { getCsvPipelineMetrics } from "@/lib/data/csv-metrics";
import { mockLeads } from "@/lib/data/mock-leads";
import { mockPipeline } from "@/lib/data/mock-pipeline";
import type { DataSource } from "@/lib/types/data-source";
import type { Lead, LeadStatus, Momentum, PipelineMetrics } from "@/lib/types/lead";

export type { DataSource, DataSourceKind } from "@/lib/types/data-source";

/** Salesforce report: [SDR] 2026-Engaged Contacts */
export const ENGAGED_CONTACTS_REPORT_NAME = "[SDR] 2026-Engaged Contacts";

const CSV_FALLBACK_LABEL = "SDR Lead Tracker NEW - Lead Tracker.csv";

export type LeadsResult = {
  leads: Lead[];
  source: DataSource;
};

export type PipelineResult = {
  pipeline: PipelineMetrics;
  source: DataSource;
};

function salesforceSource(reportName: string, reportId: string): DataSource {
  return {
    kind: "salesforce",
    label: "Salesforce sandbox",
    detail: `${reportName} (${reportId})`,
  };
}

function csvSource(
  reason: NonNullable<DataSource["reason"]>
): DataSource {
  return {
    kind: "csv",
    label: "Backup CSV",
    detail: CSV_FALLBACK_LABEL,
    reason,
  };
}

function mockSource(
  reason: NonNullable<DataSource["reason"]>
): DataSource {
  return {
    kind: "mock",
    label: "Demo mock data",
    detail: "Built-in sample leads",
    reason,
  };
}

function withOverrides(result: LeadsResult): LeadsResult {
  return { ...result, leads: applyStatusOverrides(result.leads) };
}

function getFallbackLeadsResult(
  reason: NonNullable<DataSource["reason"]>
): LeadsResult {
  const csvLeads = getCsvLeads();
  if (csvLeads.length > 0) {
    return withOverrides({ leads: csvLeads, source: csvSource(reason) });
  }

  console.log(
    "[salesforce/reports] Using mock leads — CSV not found and Salesforce is not connected."
  );
  return withOverrides({ leads: mockLeads, source: mockSource(reason) });
}

export type SalesforceReportConfig = {
  engagedContactsReportId: string;
  pipelineReportId: string;
  teamPerformanceReportId: string;
};

export function getEngagedContactsReportId(): string | null {
  return (
    process.env.SALESFORCE_ENGAGED_CONTACTS_REPORT_ID ??
    process.env.SALESFORCE_LEADS_REPORT_ID ??
    null
  );
}

export function getReportConfig(): SalesforceReportConfig | null {
  const engagedContactsReportId = getEngagedContactsReportId();
  const pipelineReportId = process.env.SALESFORCE_PIPELINE_REPORT_ID;
  const teamPerformanceReportId = process.env.SALESFORCE_TEAM_REPORT_ID;

  if (!engagedContactsReportId && !pipelineReportId) return null;

  return {
    engagedContactsReportId: engagedContactsReportId ?? "",
    pipelineReportId: pipelineReportId ?? "",
    teamPerformanceReportId: teamPerformanceReportId ?? "",
  };
}

function normalizeKey(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function cellValue(cell: { label?: string; value?: string | number | null }): string {
  const raw = cell.value ?? cell.label ?? "";
  return String(raw).trim();
}

function findColumnIndex(
  columns: Array<{ name?: string; label?: string }>,
  patterns: string[]
): number {
  const normalizedPatterns = patterns.map(normalizeKey);

  for (let i = 0; i < columns.length; i++) {
    const column = columns[i];
    const keys = [column.name, column.label].filter(Boolean).map((k) => normalizeKey(k!));
    if (keys.some((key) => normalizedPatterns.some((pattern) => key.includes(pattern)))) {
      return i;
    }
  }

  return -1;
}

function parseDate(value: string): Date | null {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatDate(value: string): string {
  const parsed = parseDate(value);
  if (!parsed) return value || "—";
  return parsed.toISOString().slice(0, 10);
}

function momentumFromLastActivity(lastActivity: string): Momentum {
  const parsed = parseDate(lastActivity);
  if (!parsed) return "stalled";

  const daysSince = (Date.now() - parsed.getTime()) / (1000 * 60 * 60 * 24);
  if (daysSince <= 7) return "accelerating";
  if (daysSince <= 14) return "stalled";
  return "at_risk";
}

function mapSalesforceStatus(value: string): LeadStatus {
  const normalized = value.toLowerCase();
  if (normalized.includes("mql")) return "mql";
  if (normalized.includes("sql")) return "sql";
  if (normalized.includes("opportunity")) return "opportunity";
  if (normalized.includes("nurtur")) return "nurturing";
  if (normalized.includes("stall") || normalized.includes("risk")) return "stalled";
  if (normalized.includes("won")) return "closed_won";
  if (normalized.includes("lost")) return "closed_lost";
  if (normalized.includes("contact")) return "contacted";
  if (normalized.includes("assign")) return "assigned";
  if (normalized.includes("engag")) return "engaged";
  if (normalized.includes("new")) return "new";
  return "engaged";
}

function parseEngagedContactsReport(response: SalesforceReportResponse): Lead[] {
  const columns = response.reportMetadata?.detailColumns ?? [];
  const rows =
    response.factMap?.["T!T"]?.rows ??
    Object.values(response.factMap ?? {}).flatMap((section) => section.rows ?? []);

  if (!columns.length || !rows.length) {
    return [];
  }

  const idIndex = findColumnIndex(columns, ["contactid", "id", "contact_id"]);
  const nameIndex = findColumnIndex(columns, [
    "fullname",
    "contactname",
    "name",
    "firstname",
  ]);
  const firstNameIndex = findColumnIndex(columns, ["firstname", "first_name"]);
  const lastNameIndex = findColumnIndex(columns, ["lastname", "last_name"]);
  const emailIndex = findColumnIndex(columns, ["email", "contactemail"]);
  const companyIndex = findColumnIndex(columns, [
    "accountname",
    "company",
    "account",
  ]);
  const titleIndex = findColumnIndex(columns, ["title", "jobtitle"]);
  const ownerIndex = findColumnIndex(columns, [
    "contactowner",
    "owner",
    "ownername",
    "assigned",
  ]);
  const statusIndex = findColumnIndex(columns, ["status", "leadstatus", "contactstatus"]);
  const sourceIndex = findColumnIndex(columns, ["leadsource", "source", "accountsource"]);
  const lastActivityIndex = findColumnIndex(columns, [
    "lastactivity",
    "lastactivitydate",
    "lastengagement",
    "lastmodified",
  ]);
  const scoreIndex = findColumnIndex(columns, [
    "engagementscore",
    "score",
    "leadscore",
    "pi_score",
  ]);

  return rows.map((row, rowIndex) => {
    const cells = row.dataCells;

    const getCell = (index: number): string =>
      index >= 0 && index < cells.length ? cellValue(cells[index]) : "";

    const firstName = getCell(firstNameIndex);
    const lastName = getCell(lastNameIndex);
    const combinedName = [firstName, lastName].filter(Boolean).join(" ").trim();
    const name = getCell(nameIndex) || combinedName || `Contact ${rowIndex + 1}`;

    const salesforceId = getCell(idIndex);
    const lastActivityRaw = getCell(lastActivityIndex);
    const lastActivity = formatDate(lastActivityRaw);
    const scoreRaw = getCell(scoreIndex);
    const engagementScore = scoreRaw ? Number.parseInt(scoreRaw, 10) || 60 : 60;

    const statusValue = getCell(statusIndex);

    return {
      id: salesforceId || `sf-contact-${rowIndex + 1}`,
      name,
      email: getCell(emailIndex),
      company: getCell(companyIndex),
      title: getCell(titleIndex),
      status: statusValue ? mapSalesforceStatus(statusValue) : "engaged",
      owner: getCell(ownerIndex) || "Unassigned",
      engagementScore,
      momentum: momentumFromLastActivity(lastActivityRaw),
      lastActivity,
      source: getCell(sourceIndex) || ENGAGED_CONTACTS_REPORT_NAME,
      activities: [],
    };
  });
}

async function fetchEngagedContactsReport(): Promise<{
  leads: Lead[];
  reportName: string;
  reportId: string;
} | null> {
  const reportId = getEngagedContactsReportId();
  const client = await getSalesforceClient();

  if (!client || !reportId) {
    return null;
  }

  const response = await client.fetchReport(reportId);
  const reportName =
    response.attributes?.reportName ?? ENGAGED_CONTACTS_REPORT_NAME;

  return {
    leads: parseEngagedContactsReport(response),
    reportName,
    reportId,
  };
}

/**
 * Returns leads plus where they came from (Salesforce report, CSV, or mock).
 * Prefer this when the UI needs a data-source indicator.
 */
export async function getLeadsResult(): Promise<LeadsResult> {
  try {
    const result = await fetchEngagedContactsReport();
    if (!result) {
      console.log(
        "[salesforce/reports] Salesforce not connected — using SDR Lead Tracker CSV."
      );
      return getFallbackLeadsResult("not_connected");
    }

    console.log(
      `[salesforce/reports] Loaded ${result.leads.length} rows from "${result.reportName}" (${result.reportId}).`
    );

    if (result.leads.length === 0) {
      return getFallbackLeadsResult("empty_report");
    }

    return withOverrides({
      leads: result.leads,
      source: salesforceSource(result.reportName, result.reportId),
    });
  } catch (error) {
    console.error("[salesforce/reports] Failed to fetch engaged contacts report:", error);
    return getFallbackLeadsResult("fetch_error");
  }
}

/**
 * Returns leads from [SDR] 2026-Engaged Contacts when Salesforce is connected.
 * Falls back to the SDR Lead Tracker CSV, then mock data.
 */
export async function getLeads(): Promise<Lead[]> {
  const { leads } = await getLeadsResult();
  return leads;
}

export async function getLeadById(id: string): Promise<Lead | undefined> {
  const leads = await getLeads();
  return leads.find((lead) => lead.id === id);
}

/**
 * Fetches pipeline metrics plus data-source metadata.
 */
export async function fetchPipelineResult(): Promise<PipelineResult> {
  const reportConfig = getReportConfig();
  const client = await getSalesforceClient();

  if (!client || !reportConfig?.pipelineReportId) {
    const csvPipeline = getCsvPipelineMetrics();
    if (getCsvLeads().length > 0) {
      console.log("[salesforce/reports] Using pipeline metrics from SDR Lead Tracker CSV.");
      return {
        pipeline: csvPipeline,
        source: csvSource(
          client ? "report_not_configured" : "not_connected"
        ),
      };
    }

    console.log(
      "[salesforce/reports] Using mock pipeline — connect Salesforce and set SALESFORCE_PIPELINE_REPORT_ID."
    );
    return {
      pipeline: mockPipeline,
      source: mockSource(
        client ? "report_not_configured" : "not_connected"
      ),
    };
  }

  // TODO: Parse pipeline report factMap into PipelineMetrics
  console.log(
    `[salesforce/reports] Would fetch pipeline report ${reportConfig.pipelineReportId} — returning mock data.`
  );
  return {
    pipeline: mockPipeline,
    source: mockSource("report_not_configured"),
  };
}

/**
 * Fetches pipeline metrics from a Salesforce report.
 */
export async function fetchPipelineFromReport(): Promise<PipelineMetrics> {
  const { pipeline } = await fetchPipelineResult();
  return pipeline;
}
