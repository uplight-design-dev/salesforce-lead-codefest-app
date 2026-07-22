/**
 * Builds an insights network graph from lead + campaign touchpoints.
 * Accounts (companies) are hubs; contacts and campaigns connect through them.
 */

import { getCsvLeads, getCsvRows } from "@/lib/data/csv-leads";
import { getIntelligencePulse } from "@/lib/data/dashboard-data";
import { mockLeads } from "@/lib/data/mock-leads";
import type { Lead } from "@/lib/types/lead";

export type InsightNodeKind = "account" | "contact" | "campaign";

export type InsightNode = {
  id: string;
  kind: InsightNodeKind;
  label: string;
  sublabel?: string;
  score?: number;
  highIntent?: boolean;
  mql?: boolean;
  weight: number;
  leadId?: string;
  company?: string;
  campaignType?: string;
};

export type InsightEdge = {
  id: string;
  source: string;
  target: string;
  kind: "works_at" | "engaged";
  strength: number;
};

export type InsightCard = {
  id: string;
  title: string;
  summary: string;
  tags: string[];
  time: string;
  relatedNodeIds: string[];
};

export type InsightsGraph = {
  nodes: InsightNode[];
  edges: InsightEdge[];
  insights: InsightCard[];
  stats: {
    accounts: number;
    contacts: number;
    campaigns: number;
    connections: number;
    highIntent: number;
  };
};

function shortCampaign(name: string): string {
  return name.replace(/^\[[^\]]+\]\s*/, "").trim() || name;
}

function campaignType(name: string): string {
  const match = name.match(/^\[([^\]]+)\]/);
  if (!match) return "Marketing";
  const channel = match[1];
  if (channel === "UCC") return "Event";
  if (channel === "WEB") return "Website";
  if (channel === "WG" || channel === "EB" || channel === "WB") return "Webinar";
  if (channel === "AH" || channel === "CORP" || channel === "CS") return "Email";
  if (channel === "Google") return "Paid Search";
  return "Marketing";
}

function slug(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export function buildInsightsGraph(leadsInput?: Lead[]): InsightsGraph {
  const leads =
    leadsInput && leadsInput.length > 0
      ? leadsInput
      : getCsvLeads().length > 0
        ? getCsvLeads()
        : mockLeads;

  const byCompany = new Map<string, Lead[]>();
  for (const lead of leads) {
    if (!lead.company.trim()) continue;
    const list = byCompany.get(lead.company) ?? [];
    list.push(lead);
    byCompany.set(lead.company, list);
  }

  // Focus the web on the strongest account clusters so it stays readable.
  const topCompanies = Array.from(byCompany.entries())
    .map(([company, companyLeads]) => ({
      company,
      companyLeads,
      score:
        companyLeads.length * 20 +
        companyLeads.reduce((sum, lead) => sum + lead.engagementScore, 0),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 6)
    .map(({ company, companyLeads }) => [company, companyLeads] as const);

  const focusLeads = topCompanies.flatMap(([, companyLeads]) =>
    [...companyLeads]
      .sort((a, b) => b.engagementScore - a.engagementScore)
      .slice(0, 3)
  );

  const nodes: InsightNode[] = [];
  const edges: InsightEdge[] = [];
  const nodeIds = new Set<string>();

  for (const [company, companyLeads] of topCompanies) {
    const accountId = `account-${slug(company)}`;
    if (!nodeIds.has(accountId)) {
      nodeIds.add(accountId);
      const highIntent = companyLeads.filter((l) => l.engagementScore >= 85).length;
      nodes.push({
        id: accountId,
        kind: "account",
        label: company,
        sublabel: `${companyLeads.length} contacts`,
        weight: Math.min(28, 14 + companyLeads.length * 1.5),
        highIntent: highIntent > 0,
        company,
      });
    }
  }

  for (const lead of focusLeads) {
    const contactId = `contact-${lead.id}`;
    const accountId = `account-${slug(lead.company)}`;

    if (!nodeIds.has(contactId)) {
      nodeIds.add(contactId);
      nodes.push({
        id: contactId,
        kind: "contact",
        label: lead.name,
        sublabel: lead.title || lead.email,
        score: lead.engagementScore,
        highIntent: lead.engagementScore >= 85,
        mql: lead.status === "mql" || Boolean(lead.mqlQualification?.qualifies),
        weight: Math.min(16, 8 + lead.engagementScore / 20),
        leadId: lead.id,
        company: lead.company,
      });
    }

    edges.push({
      id: `edge-${contactId}-${accountId}`,
      source: contactId,
      target: accountId,
      kind: "works_at",
      strength: 1,
    });
  }

  const campaignCounts = new Map<
    string,
    { name: string; leads: Set<string>; touchpoints: number }
  >();

  const focusLeadIds = new Set(focusLeads.map((lead) => lead.id));
  const focusEmails = new Set(
    focusLeads.map((lead) => lead.email.trim().toLowerCase())
  );

  // Prefer raw CSV campaign rows for richer contact ↔ campaign links.
  try {
    for (const row of getCsvRows()) {
      const email = row.Email.trim().toLowerCase();
      const campaignName = row["Campaign Name"].trim();
      if (!email || !campaignName || !focusEmails.has(email)) continue;
      const lead = focusLeads.find(
        (item) => item.email.trim().toLowerCase() === email
      );
      if (!lead || !focusLeadIds.has(lead.id)) continue;

      const key = campaignName.toLowerCase();
      const existing = campaignCounts.get(key) ?? {
        name: campaignName,
        leads: new Set<string>(),
        touchpoints: 0,
      };
      existing.leads.add(lead.id);
      existing.touchpoints += 1;
      campaignCounts.set(key, existing);
    }
  } catch {
    // CSV may be unavailable in mock-only mode.
  }

  if (campaignCounts.size === 0) {
    for (const lead of focusLeads) {
      for (const activity of lead.activities.slice(0, 6)) {
        const raw = activity.activity.includes("—")
          ? activity.activity.split("—").slice(1).join("—").trim()
          : activity.activity;
        const campaignLabel = raw || activity.activity;
        if (!campaignLabel || campaignLabel.length < 3) continue;

        const key = campaignLabel.toLowerCase();
        const existing = campaignCounts.get(key) ?? {
          name: campaignLabel,
          leads: new Set<string>(),
          touchpoints: 0,
        };
        existing.leads.add(lead.id);
        existing.touchpoints += 1;
        campaignCounts.set(key, existing);
      }
    }
  }

  // Rebuild campaign links with cleaner names from activity when possible.
  // Use top campaigns by shared leads for the web.
  const topCampaigns = Array.from(campaignCounts.entries())
    .filter(([, value]) => value.leads.size >= 1)
    .sort((a, b) => b[1].leads.size - a[1].leads.size || b[1].touchpoints - a[1].touchpoints)
    .slice(0, 10);

  for (const [key, campaign] of topCampaigns) {
    const campaignId = `campaign-${slug(key)}`;
    if (!nodeIds.has(campaignId)) {
      nodeIds.add(campaignId);
      nodes.push({
        id: campaignId,
        kind: "campaign",
        label: shortCampaign(campaign.name),
        sublabel: campaignType(campaign.name),
        weight: Math.min(18, 9 + campaign.leads.size * 1.2),
        campaignType: campaignType(campaign.name),
      });
    }

    for (const leadId of campaign.leads) {
      const contactId = `contact-${leadId}`;
      if (!nodeIds.has(contactId)) continue;
      edges.push({
        id: `edge-${contactId}-${campaignId}`,
        source: contactId,
        target: campaignId,
        kind: "engaged",
        strength: Math.min(3, campaign.touchpoints / campaign.leads.size),
      });
    }
  }

  const pulse = getIntelligencePulse();
  const insights: InsightCard[] = pulse.map((item) => {
    const companyMatch = topCompanies.find(([company]) =>
      item.title.toLowerCase().includes(company.toLowerCase().slice(0, 12))
    );
    const related = companyMatch
      ? nodes
          .filter(
            (node) =>
              node.company === companyMatch[0] ||
              (node.kind === "account" && node.label === companyMatch[0])
          )
          .map((node) => node.id)
      : nodes.filter((node) => node.highIntent).slice(0, 4).map((node) => node.id);

    return {
      id: item.id,
      title: item.title,
      summary: item.summary,
      tags: item.tags,
      time: item.time,
      relatedNodeIds: related,
    };
  });

  // Extra graph-native insights for bridge campaigns / multi-contact accounts.
  for (const [company, companyLeads] of topCompanies.slice(0, 3)) {
    if (insights.some((insight) => insight.title.includes(company))) continue;
    const highIntent = companyLeads.filter((l) => l.engagementScore >= 85).length;
    insights.push({
      id: `graph-${slug(company)}`,
      title: `${company} network cluster`,
      summary: `${companyLeads.length} connected contacts with shared campaign touchpoints. ${
        highIntent > 0
          ? `${highIntent} high-intent signals in this account web.`
          : "Growing engagement density across the account."
      }`,
      tags: [
        `${companyLeads.length} Contacts`,
        highIntent > 0 ? `${highIntent} High Intent` : "Cluster",
      ],
      time: "From network",
      relatedNodeIds: nodes
        .filter((node) => node.company === company || node.label === company)
        .map((node) => node.id),
    });
  }

  return {
    nodes,
    edges,
    insights: insights.slice(0, 8),
    stats: {
      accounts: nodes.filter((n) => n.kind === "account").length,
      contacts: nodes.filter((n) => n.kind === "contact").length,
      campaigns: nodes.filter((n) => n.kind === "campaign").length,
      connections: edges.length,
      highIntent: nodes.filter((n) => n.highIntent).length,
    },
  };
}
