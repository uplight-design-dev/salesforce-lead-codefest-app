/**
 * Overview alert generators — High Intent Lead + New Campaign.
 */

import { getCsvLeads, getCsvRows } from "@/lib/data/csv-leads";
import { mockAlerts } from "@/lib/data/mock-leads";
import type { HighIntentAlert, Lead } from "@/lib/types/lead";

export type CampaignAlert = {
  id: string;
  campaignName: string;
  campaignType: string;
  message: string;
  reason: string;
  engagementCount: number;
  uniqueLeads: number;
  priority: "high" | "medium";
  createdAt: string;
};

function campaignType(campaignName: string): string {
  const match = campaignName.match(/^\[([^\]]+)\]/);
  if (!match) return "Marketing";
  const channel = match[1];
  if (channel === "UCC") return "Event";
  if (channel === "WEB") return "Website";
  if (channel === "WG" || channel === "EB" || channel === "WB") return "Webinar";
  if (channel === "AH" || channel === "CORP" || channel === "CS") return "Email";
  if (channel === "Google") return "Paid Search";
  return "Marketing";
}

function shortCampaignName(campaignName: string): string {
  return campaignName.replace(/^\[[^\]]+\]\s*/, "").trim() || campaignName;
}

function parseActivityDate(value: string): Date | null {
  if (!value) return null;
  const slashParts = value.split("/");
  if (slashParts.length === 3) {
    const [month, day, year] = slashParts.map((part) => Number.parseInt(part, 10));
    if (month && day && year) return new Date(year, month - 1, day);
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function buildHighIntentMessage(lead: Lead): { message: string; reason: string } {
  const awarded =
    lead.intentScoreBreakdown?.filter((item) => item.awarded).map((item) => item.parameter) ??
    [];

  if (lead.mqlQualification?.qualifies) {
    return {
      message: `${lead.owner}, ${lead.name} now meets the Suggested MQL rule (score ${lead.engagementScore}, ICP fit, and ${lead.mqlQualification.engagementCount} engagements). Recommend SDR follow-up within 24 hours.`,
      reason: "Suggested MQL rule met",
    };
  }

  if (awarded.length > 0) {
    const topSignals = awarded.slice(0, 3).join(", ");
    return {
      message: `${lead.owner}, ${lead.name} triggered high-intent signals: ${topSignals}. Score is now ${lead.engagementScore} (base ${lead.baseEngagementScore ?? "—"} + intent +${lead.intentScoreBonus ?? 0}).`,
      reason: `${awarded.length} high-intent criteria met (last 14 days)`,
    };
  }

  return {
    message: `${lead.owner}, ${lead.name} at ${lead.company} is high intent with score ${lead.engagementScore}. Recommend personalized outreach.`,
    reason: `Engagement score ${lead.engagementScore}`,
  };
}

export function buildHighIntentAlerts(leads: Lead[], limit = 5): HighIntentAlert[] {
  const candidates = leads
    .filter(
      (lead) =>
        lead.engagementScore >= 85 ||
        (lead.intentScoreBonus ?? 0) >= 25 ||
        Boolean(lead.mqlQualification?.qualifies)
    )
    .sort((a, b) => {
      const aRank =
        (a.mqlQualification?.qualifies ? 1000 : 0) +
        (a.intentScoreBonus ?? 0) +
        a.engagementScore;
      const bRank =
        (b.mqlQualification?.qualifies ? 1000 : 0) +
        (b.intentScoreBonus ?? 0) +
        b.engagementScore;
      return bRank - aRank;
    })
    .slice(0, limit);

  return candidates.map((lead, index) => {
    const { message, reason } = buildHighIntentMessage(lead);
    const priority: HighIntentAlert["priority"] =
      lead.mqlQualification?.qualifies ||
      lead.engagementScore >= 100 ||
      (lead.intentScoreBonus ?? 0) >= 40
        ? "high"
        : "medium";

    return {
      id: `hia-${lead.id}-${index}`,
      leadId: lead.id,
      leadName: lead.name,
      owner: lead.owner,
      message,
      reason,
      priority,
      createdAt: lead.lastActivity || new Date().toISOString(),
    };
  });
}

export function getHighIntentAlerts(leads: Lead[]): HighIntentAlert[] {
  if (leads.length === 0) return mockAlerts;
  const alerts = buildHighIntentAlerts(leads);
  return alerts.length > 0 ? alerts : mockAlerts;
}

export function getNewCampaignAlerts(limit = 4): CampaignAlert[] {
  const rows = getCsvRows().filter(
    (row) => row.Email.trim() && row["Campaign Name"].trim()
  );

  if (rows.length === 0) {
    return [
      {
        id: "campaign-alert-demo-1",
        campaignName: "Q2 Demand Response Webinar",
        campaignType: "Webinar",
        message:
          "New webinar campaign is driving registrations. Review attendee list for SDR assignment.",
        reason: "Demo campaign alert",
        engagementCount: 42,
        uniqueLeads: 28,
        priority: "high",
        createdAt: "2026-06-10",
      },
      {
        id: "campaign-alert-demo-2",
        campaignName: "Customer Intelligence Blog",
        campaignType: "Email",
        message:
          "Email campaign showing elevated click activity across utility accounts.",
        reason: "Demo campaign alert",
        engagementCount: 35,
        uniqueLeads: 22,
        priority: "medium",
        createdAt: "2026-06-09",
      },
    ];
  }

  let latest = 0;
  for (const row of rows) {
    const parsed = parseActivityDate(row["Last Activity Date"]);
    if (parsed) latest = Math.max(latest, parsed.getTime());
  }
  const asOf = latest > 0 ? new Date(latest) : new Date();
  const windowStart = asOf.getTime() - 14 * 24 * 60 * 60 * 1000;

  type CampaignAgg = {
    name: string;
    engagements: number;
    leads: Set<string>;
    latestActivity: number;
  };

  const byCampaign = new Map<string, CampaignAgg>();

  for (const row of rows) {
    const name = row["Campaign Name"].trim();
    const parsed = parseActivityDate(row["Last Activity Date"]);
    if (!parsed || parsed.getTime() < windowStart) continue;

    const existing = byCampaign.get(name) ?? {
      name,
      engagements: 0,
      leads: new Set<string>(),
      latestActivity: 0,
    };
    existing.engagements += 1;
    existing.leads.add(row.Email.trim().toLowerCase());
    existing.latestActivity = Math.max(existing.latestActivity, parsed.getTime());
    byCampaign.set(name, existing);
  }

  // Fall back to top campaigns overall if the 14-day window is sparse.
  if (byCampaign.size === 0) {
    for (const row of rows) {
      const name = row["Campaign Name"].trim();
      const parsed = parseActivityDate(row["Last Activity Date"]);
      const existing = byCampaign.get(name) ?? {
        name,
        engagements: 0,
        leads: new Set<string>(),
        latestActivity: 0,
      };
      existing.engagements += 1;
      existing.leads.add(row.Email.trim().toLowerCase());
      if (parsed) {
        existing.latestActivity = Math.max(existing.latestActivity, parsed.getTime());
      }
      byCampaign.set(name, existing);
    }
  }

  return Array.from(byCampaign.values())
    .sort((a, b) => {
      if (b.latestActivity !== a.latestActivity) {
        return b.latestActivity - a.latestActivity;
      }
      return b.engagements - a.engagements;
    })
    .slice(0, limit)
    .map((campaign, index) => {
      const type = campaignType(campaign.name);
      const shortName = shortCampaignName(campaign.name);
      const uniqueLeads = campaign.leads.size;
      const priority: CampaignAlert["priority"] =
        campaign.engagements >= 20 || uniqueLeads >= 10 ? "high" : "medium";

      return {
        id: `campaign-alert-${index + 1}`,
        campaignName: shortName,
        campaignType: type,
        message: `${type} campaign “${shortName}” has ${campaign.engagements} engagement${campaign.engagements === 1 ? "" : "s"} across ${uniqueLeads} lead${uniqueLeads === 1 ? "" : "s"}. Review for SDR follow-up.`,
        reason: `Active in last 14 days of tracker export`,
        engagementCount: campaign.engagements,
        uniqueLeads,
        priority,
        createdAt: new Date(campaign.latestActivity || asOf.getTime())
          .toISOString()
          .slice(0, 10),
      };
    });
}

/** Convenience for pages that only need CSV-backed alerts. */
export function getOverviewAlerts(leads?: Lead[]) {
  const resolvedLeads = leads && leads.length > 0 ? leads : getCsvLeads();
  return {
    highIntentAlerts: getHighIntentAlerts(resolvedLeads),
    campaignAlerts: getNewCampaignAlerts(),
  };
}
