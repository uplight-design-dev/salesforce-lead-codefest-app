/**
 * Dashboard metrics derived from the SDR Lead Tracker CSV.
 */

import { getCsvLeads, getCsvRows } from "@/lib/data/csv-leads";
import type {
  AlignmentMetrics,
  FunnelStage,
  Lead,
  LeadStatus,
  PipelineMetrics,
  SustainabilityMetrics,
  TeamMemberMetrics,
} from "@/lib/types/lead";

export type PipelineStageMetric = {
  label: string;
  count: number;
  conversionFromPrevious?: number;
};

export type OverviewKpi = {
  label: string;
  value: string;
  subtext?: string;
  trend?: { value: string; positive: boolean };
};

export type TopCampaign = {
  id: string;
  name: string;
  type: string;
  metric: string;
};

export type IntelligenceInsight = {
  id: string;
  title: string;
  summary: string;
  tags: string[];
  time: string;
};

function conversionRate(current: number, previous: number): number | undefined {
  if (previous <= 0) return undefined;
  return Math.round((current / previous) * 1000) / 10;
}

function countByStatus(leads: Lead[], status: LeadStatus): number {
  return leads.filter((lead) => lead.status === status).length;
}

function countScoreAtLeast(leads: Lead[], minScore: number): number {
  return leads.filter((lead) => lead.engagementScore >= minScore).length;
}

function totalTouchpoints(leads: Lead[]): number {
  return leads.reduce((sum, lead) => sum + lead.activities.length, 0);
}

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

function buildTeamMember(name: string, leads: Lead[]): TeamMemberMetrics {
  const followUpRate =
    leads.length === 0
      ? 0
      : Math.round(
          (leads.filter((lead) => lead.momentum === "accelerating").length / leads.length) *
            100
        );

  const meetingsBooked = leads.reduce((sum, lead) => sum + (lead.webinarAttendance ?? 0), 0);
  const avgResponseTimeHours =
    leads.length === 0
      ? 0
      : Math.round(
          (leads.reduce((sum, lead) => sum + lead.activities.length, 0) / leads.length) * 10
        ) / 10;

  const conversionRate =
    leads.length === 0
      ? 0
      : Math.round(
          (leads.filter((lead) => lead.engagementScore >= 80).length / leads.length) * 1000
        ) / 10;

  return {
    id: name.toLowerCase().replace(/\s+/g, "-"),
    name,
    followUpRate,
    meetingsBooked,
    avgResponseTimeHours,
    conversionRate,
  };
}

export function getCsvPipelineMetrics(): PipelineMetrics {
  const leads = getCsvLeads();
  const totalLeads = leads.length;
  const mqls = countByStatus(leads, "mql");
  const nurturing = countByStatus(leads, "nurturing");
  const closedWon = countByStatus(leads, "closed_won");

  return {
    totalLeads,
    mqls: mqls + nurturing,
    sqls: countByStatus(leads, "sql"),
    opportunities: countByStatus(leads, "opportunity"),
    closedWon,
    conversionRate:
      totalLeads > 0 ? Math.round((closedWon / totalLeads) * 1000) / 10 : 0,
  };
}

export function getCsvFunnelStages(metrics: PipelineMetrics): FunnelStage[] {
  return [
    { label: "Total Leads", count: metrics.totalLeads, color: "#0047FF" },
    { label: "MQLs", count: metrics.mqls, color: "#00E297" },
    { label: "SQLs", count: metrics.sqls, color: "#000F9F" },
    { label: "Opportunities", count: metrics.opportunities, color: "#0047FF" },
    { label: "Closed Won", count: metrics.closedWon, color: "#00E297" },
  ];
}

export function getCsvOverviewKpis(): OverviewKpi[] {
  const leads = getCsvLeads();
  const totalLeads = leads.length;
  const highIntent = countScoreAtLeast(leads, 85);
  const eventAttendees = leads.filter((lead) => (lead.webinarAttendance ?? 0) > 0).length;
  const touchpoints = totalTouchpoints(leads);
  const atRisk = leads.filter((lead) => lead.momentum === "at_risk").length;
  const companies = new Set(leads.map((lead) => lead.company)).size;

  return [
    {
      label: "Total Active Leads",
      value: totalLeads.toLocaleString(),
      subtext: `${companies} utility accounts`,
    },
    {
      label: "High Intent Accounts",
      value: highIntent.toLocaleString(),
      subtext: "Score 85+",
    },
    {
      label: "Event Attendees",
      value: eventAttendees.toLocaleString(),
      subtext: "UCC & webinars",
    },
    {
      label: "Engagement Touchpoints",
      value: touchpoints.toLocaleString(),
      subtext: "Campaign interactions",
    },
    {
      label: "At-Risk Leads",
      value: atRisk.toLocaleString(),
      subtext: "Need follow-up",
    },
  ];
}

export function getCsvPipelineStages(): PipelineStageMetric[] {
  const metrics = getCsvPipelineMetrics();

  // Match the Pipeline page funnel stages, shown horizontally with % conversion.
  const stages = [
    { label: "Total Leads", count: metrics.totalLeads },
    { label: "MQLs", count: metrics.mqls },
    { label: "SQLs", count: metrics.sqls },
    { label: "Opportunities", count: metrics.opportunities },
    { label: "Closed Won", count: metrics.closedWon },
  ];

  return stages.map((stage, index) => ({
    ...stage,
    conversionFromPrevious:
      index === 0 ? undefined : conversionRate(stage.count, stages[index - 1].count),
  }));
}

export function getCsvPipelineValue(): {
  amount: string;
  label: string;
  trend: string;
} {
  const leads = getCsvLeads();
  const platinum = countScoreAtLeast(leads, 90);

  return {
    amount: platinum.toLocaleString(),
    label: "Platinum-tier accounts",
    trend: `${leads.length} total engaged contacts`,
  };
}

export function getCsvTopCampaigns(): TopCampaign[] {
  const rows = getCsvRows().filter((row) => row.Email.trim() && row["Campaign Name"].trim());
  const counts = new Map<string, number>();

  for (const row of rows) {
    const campaign = row["Campaign Name"].trim();
    counts.set(campaign, (counts.get(campaign) ?? 0) + 1);
  }

  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([name, count], index) => ({
      id: `campaign-${index + 1}`,
      name: shortCampaignName(name),
      type: campaignType(name),
      metric: `${count} engagement${count === 1 ? "" : "s"}`,
    }));
}

export function getCsvIntelligencePulse(): IntelligenceInsight[] {
  const leads = getCsvLeads();
  const byCompany = new Map<string, Lead[]>();

  for (const lead of leads) {
    const existing = byCompany.get(lead.company) ?? [];
    existing.push(lead);
    byCompany.set(lead.company, existing);
  }

  const topCompanies = Array.from(byCompany.entries())
    .sort((a, b) => b[1].length - a[1].length)
    .slice(0, 3);

  const summaries = [
    "Multiple contacts engaged across email and event campaigns in the tracker export.",
    "Strong cross-campaign activity from this account in Q2 2026.",
    "Active engagement cluster — prioritize coordinated SDR outreach.",
  ];

  return topCompanies.map(([company, companyLeads], index) => {
    const highIntent = companyLeads.filter((lead) => lead.engagementScore >= 85).length;
    const touchpoints = companyLeads.reduce((sum, lead) => sum + lead.activities.length, 0);

    return {
      id: `insight-${index + 1}`,
      title: `${company} engagement cluster`,
      summary: summaries[index] ?? summaries[0],
      tags: [
        `${companyLeads.length} Contact${companyLeads.length === 1 ? "" : "s"}`,
        highIntent > 0 ? `${highIntent} High Intent` : `${touchpoints} Touchpoints`,
      ],
      time: "From lead tracker",
    };
  });
}

export function getCsvTeamMetrics(): TeamMemberMetrics[] {
  const leads = getCsvLeads();
  const byOwner = new Map<string, Lead[]>();

  for (const lead of leads) {
    if (lead.owner === "Unassigned") continue;
    const existing = byOwner.get(lead.owner) ?? [];
    existing.push(lead);
    byOwner.set(lead.owner, existing);
  }

  const assigned = Array.from(byOwner.entries())
    .map(([name, ownerLeads]) => buildTeamMember(name, ownerLeads))
    .sort((a, b) => b.meetingsBooked - a.meetingsBooked);

  const unassignedLeads = leads.filter((lead) => lead.owner === "Unassigned");
  if (unassignedLeads.length > 0) {
    assigned.push(buildTeamMember("Unassigned pool", unassignedLeads));
  }

  return assigned;
}

export function getCsvAlignmentMetrics(): AlignmentMetrics {
  const leads = getCsvLeads();
  const pipeline = getCsvPipelineMetrics();

  return {
    leadsAcceptedBySales: leads.filter((lead) => lead.owner !== "Unassigned").length,
    marketingGeneratedPipeline: totalTouchpoints(leads),
    marketingGeneratedRevenue: pipeline.closedWon,
  };
}

export function getCsvSustainabilityMetrics(): SustainabilityMetrics {
  const leads = getCsvLeads();
  const touchpoints = totalTouchpoints(leads);

  return {
    aiQueriesProcessed: touchpoints * 8,
    energyPerQueryWh: 0.42,
    carbonPerQueryGco2e: 0.12,
  };
}
