/**
 * SQL eligibility — for now: MQL rules + No-Go Accounts gate.
 * Sales Dev Team will add more SQL parameters later; keep criteria list extensible.
 */

import { matchNoGoAccount, type NoGoAccount } from "@/lib/data/no-go-accounts";
import type {
  LeadStatus,
  MqlQualification,
  SqlCriterionResult,
  SqlEligibility,
} from "@/lib/types/lead";

export type { SqlEligibility };

export function evaluateSqlEligibility(input: {
  company: string;
  mqlQualification: MqlQualification;
}): SqlEligibility {
  const noGo = matchNoGoAccount(input.company);
  const mqlMet = input.mqlQualification.qualifies;
  const notNoGo = noGo === null;

  const criteria: SqlCriterionResult[] = [
    {
      key: "mql_rules",
      label: "MQL rules",
      detail: mqlMet
        ? input.mqlQualification.ruleSummary
        : "Lead must meet Suggested MQL rule (score, ICP fit, engagements)",
      met: mqlMet,
    },
    {
      key: "no_go_accounts",
      label: "No-Go Accounts",
      detail: noGo
        ? `Blocked — ${noGo.utility} (Sales Director: ${noGo.salesDirector})`
        : "Account is not on the Do Not Prospect / No-Go list",
      met: notNoGo,
    },
  ];

  // Extensible: future Sales Dev SQL parameters append here.
  const eligible = criteria.every((item) => item.met);

  const ruleSummary = eligible
    ? "SQL eligible: MQL rules met and account is not on the No-Go list."
    : noGo && mqlMet
      ? `SQL blocked: MQL met, but ${noGo.utility} is a No-Go account.`
      : "SQL not eligible yet — need MQL qualification and a clear No-Go check.";

  return {
    eligible,
    mqlMet,
    notNoGo,
    noGoAccount: noGo
      ? {
          utility: noGo.utility,
          salesDirector: noGo.salesDirector,
          reason: noGo.reason,
        }
      : null,
    criteria,
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
 * Promote to SQL when eligible, without downgrading opportunity+ or closed outcomes.
 * No-Go accounts that already qualify as MQL stay at MQL (or current status).
 */
export function applySqlStatus(
  currentStatus: LeadStatus,
  eligibility: SqlEligibility
): LeadStatus {
  if (!eligibility.eligible) return currentStatus;
  if (currentStatus === "closed_lost" || currentStatus === "closed_won") {
    return currentStatus;
  }
  if (STATUS_RANK[currentStatus] >= STATUS_RANK.sql) return currentStatus;
  return "sql";
}

export function summarizeNoGo(noGo: NoGoAccount | null): string | null {
  if (!noGo) return null;
  return `${noGo.utility} (No-Go — ${noGo.salesDirector})`;
}
