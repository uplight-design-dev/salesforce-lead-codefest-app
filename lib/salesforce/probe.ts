/**
 * Probes which Salesforce resources the current connection can actually access.
 * Used on Settings after OAuth so "Connected" is paired with real fetch results.
 */

import {
  SalesforceClient,
  type SalesforceReportResponse,
} from "./client";
import { LEAD_QUERY } from "./queries";
import {
  ENGAGED_CONTACTS_REPORT_NAME,
  getEngagedContactsReportId,
} from "./reports";

export type ProbeCheckStatus =
  | "ok"
  | "empty"
  | "missing"
  | "forbidden"
  | "error"
  | "not_configured";

export type ProbeCheck = {
  status: ProbeCheckStatus;
  label: string;
  detail: string;
  count?: number;
};

export type SalesforceProbeResult = {
  instanceUrl: string;
  report: ProbeCheck;
  leads: ProbeCheck;
  /** True when the engaged-contacts report returned at least one row. */
  dashboardReady: boolean;
};

function extractSalesforceError(errorBody: string): string {
  try {
    const parsed = JSON.parse(errorBody) as
      | Array<{ message?: string; errorCode?: string }>
      | { message?: string; errorCode?: string };

    const first = Array.isArray(parsed) ? parsed[0] : parsed;
    if (first?.message) {
      return first.errorCode
        ? `${first.errorCode}: ${first.message}`
        : first.message;
    }
  } catch {
    // fall through
  }

  return errorBody.slice(0, 280) || "Unknown Salesforce error";
}

function classifyHttpFailure(
  status: number,
  errorBody: string
): Pick<ProbeCheck, "status" | "detail"> {
  const detail = extractSalesforceError(errorBody);

  if (status === 404 || /NOT_FOUND|INVALID_ID/i.test(detail)) {
    return {
      status: "missing",
      detail:
        "Report ID not found in this sandbox. It may only exist in production, or the ID is wrong for partial2.",
    };
  }

  if (status === 401 || status === 403 || /INSUFFICIENT|FORBIDDEN|INVALID_SESSION/i.test(detail)) {
    return {
      status: "forbidden",
      detail: detail,
    };
  }

  return { status: "error", detail: `HTTP ${status}: ${detail}` };
}

function countReportRows(response: SalesforceReportResponse): number {
  const factMap = response.factMap ?? {};
  const primary = factMap["T!T"]?.rows;
  if (primary) return primary.length;
  return Object.values(factMap).reduce(
    (sum, section) => sum + (section.rows?.length ?? 0),
    0
  );
}

async function probeEngagedContactsReport(
  client: SalesforceClient
): Promise<ProbeCheck> {
  const reportId = getEngagedContactsReportId();

  if (!reportId) {
    return {
      status: "not_configured",
      label: ENGAGED_CONTACTS_REPORT_NAME,
      detail:
        "Set SALESFORCE_ENGAGED_CONTACTS_REPORT_ID in the environment.",
    };
  }

  try {
    const response = await client.fetchReport(reportId);
    const reportName =
      response.attributes?.reportName ?? ENGAGED_CONTACTS_REPORT_NAME;
    const rowCount = countReportRows(response);

    if (rowCount === 0) {
      return {
        status: "empty",
        label: reportName,
        detail: `Found report ${reportId}, but it returned 0 rows. Dashboard will keep using the backup CSV.`,
        count: 0,
      };
    }

    return {
      status: "ok",
      label: reportName,
      detail: `Pulled ${rowCount} row${rowCount === 1 ? "" : "s"} from report ${reportId}.`,
      count: rowCount,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const statusMatch = message.match(/\((\d{3})\):\s*([\s\S]*)$/);
    if (statusMatch) {
      const classified = classifyHttpFailure(
        Number(statusMatch[1]),
        statusMatch[2]
      );
      return {
        status: classified.status,
        label: ENGAGED_CONTACTS_REPORT_NAME,
        detail: `${classified.detail} (configured ID: ${reportId})`,
      };
    }

    return {
      status: "error",
      label: ENGAGED_CONTACTS_REPORT_NAME,
      detail: message,
    };
  }
}

async function probeLeadRecords(client: SalesforceClient): Promise<ProbeCheck> {
  try {
    const result = await client.query(LEAD_QUERY);
    const count = result.totalSize ?? result.records.length;

    if (count === 0) {
      return {
        status: "empty",
        label: "Lead object (SOQL)",
        detail: "API access works, but no Lead records were returned.",
        count: 0,
      };
    }

    return {
      status: "ok",
      label: "Lead object (SOQL)",
      detail: `API can read Lead records (${count} returned in sample query).`,
      count,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const statusMatch = message.match(/\((\d{3})\):\s*([\s\S]*)$/);
    if (statusMatch) {
      const classified = classifyHttpFailure(
        Number(statusMatch[1]),
        statusMatch[2]
      );
      return {
        status: classified.status,
        label: "Lead object (SOQL)",
        detail: classified.detail,
      };
    }

    return {
      status: "error",
      label: "Lead object (SOQL)",
      detail: message,
    };
  }
}

/** Runs live checks against the authenticated Salesforce org. */
export async function probeSalesforceAccess(
  client: SalesforceClient
): Promise<SalesforceProbeResult> {
  const [report, leads] = await Promise.all([
    probeEngagedContactsReport(client),
    probeLeadRecords(client),
  ]);

  return {
    instanceUrl: client.getInstanceUrl(),
    report,
    leads,
    dashboardReady: report.status === "ok",
  };
}
