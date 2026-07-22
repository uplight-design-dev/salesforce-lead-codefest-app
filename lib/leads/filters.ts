import type { Lead } from "@/lib/types/lead";

export type LeadFilterKey =
  | "all"
  | "mql"
  | "sql"
  | "opportunity"
  | "closed_won"
  | "high_intent"
  | "event_attendees"
  | "with_touchpoints"
  | "at_risk";

export type LeadFilterDefinition = {
  key: LeadFilterKey;
  title: string;
  description: string;
  match: (lead: Lead) => boolean;
};

export const LEAD_FILTERS: Record<LeadFilterKey, LeadFilterDefinition> = {
  all: {
    key: "all",
    title: "Total Leads",
    description: "All engaged contacts in the current dataset.",
    match: () => true,
  },
  mql: {
    key: "mql",
    title: "MQLs",
    description: "Marketing-qualified and nurturing leads.",
    match: (lead) => lead.status === "mql" || lead.status === "nurturing",
  },
  sql: {
    key: "sql",
    title: "SQLs",
    description: "Sales-qualified leads ready for follow-up.",
    match: (lead) => lead.status === "sql",
  },
  opportunity: {
    key: "opportunity",
    title: "Opportunities",
    description: "Leads currently in an active opportunity.",
    match: (lead) => lead.status === "opportunity",
  },
  closed_won: {
    key: "closed_won",
    title: "Closed Won",
    description: "Deals that resulted in revenue.",
    match: (lead) => lead.status === "closed_won",
  },
  high_intent: {
    key: "high_intent",
    title: "High Intent Accounts",
    description:
      "Leads with an engagement score of 85 or higher (base + 14-day intent bonuses).",
    match: (lead) => lead.engagementScore >= 85,
  },
  event_attendees: {
    key: "event_attendees",
    title: "Event Attendees",
    description: "Contacts who attended UCC or webinar events.",
    match: (lead) => (lead.webinarAttendance ?? 0) > 0,
  },
  with_touchpoints: {
    key: "with_touchpoints",
    title: "Engagement Touchpoints",
    description: "Leads with recorded campaign interactions.",
    match: (lead) => lead.activities.length > 0,
  },
  at_risk: {
    key: "at_risk",
    title: "At-Risk Leads",
    description: "Leads that need follow-up based on momentum.",
    match: (lead) => lead.momentum === "at_risk",
  },
};

const FUNNEL_LABEL_TO_FILTER: Record<string, LeadFilterKey> = {
  "Total Leads": "all",
  MQLs: "mql",
  SQLs: "sql",
  Opportunities: "opportunity",
  "Closed Won": "closed_won",
};

const KPI_LABEL_TO_FILTER: Record<string, LeadFilterKey> = {
  "Total Active Leads": "all",
  "High Intent Accounts": "high_intent",
  "Event Attendees": "event_attendees",
  "Engagement Touchpoints": "with_touchpoints",
  "At-Risk Leads": "at_risk",
};

export function filterKeyFromFunnelLabel(label: string): LeadFilterKey | null {
  return FUNNEL_LABEL_TO_FILTER[label] ?? null;
}

export function filterKeyFromKpiLabel(label: string): LeadFilterKey | null {
  return KPI_LABEL_TO_FILTER[label] ?? null;
}

export function filterLeads(leads: Lead[], key: LeadFilterKey): Lead[] {
  return leads.filter(LEAD_FILTERS[key].match);
}
