export type PipelineStageMetric = {
  label: string;
  count: number;
  conversionFromPrevious?: number;
};

export const overviewKpis = [
  {
    label: "Total Active Leads",
    value: "350",
    subtext: "Utility accounts",
  },
  {
    label: "High Intent Accounts",
    value: "85",
    subtext: "Score 85+",
  },
  {
    label: "Event Attendees",
    value: "47",
    subtext: "UCC & webinars",
  },
  {
    label: "Engagement Touchpoints",
    value: "144",
    subtext: "Campaign interactions",
  },
  {
    label: "At-Risk Leads",
    value: "26",
    subtext: "Need follow-up",
  },
];

export const pipelineStages: PipelineStageMetric[] = [
  { label: "Total Leads", count: 350 },
  { label: "MQLs", count: 120, conversionFromPrevious: 34.3 },
  { label: "SQLs", count: 75, conversionFromPrevious: 62.5 },
  { label: "Opportunities", count: 30, conversionFromPrevious: 40.0 },
  { label: "Closed Won", count: 8, conversionFromPrevious: 26.7 },
];

export const pipelineValue = {
  amount: "$8.7M",
  label: "Weighted",
  trend: "+18% vs last 30 days",
};

export const topCampaigns = [
  {
    id: "c1",
    name: "Q2 Demand Response Webinar",
    type: "Webinar",
    metric: "+42% Qualified Leads",
  },
  {
    id: "c2",
    name: "Grid Modernization Whitepaper",
    type: "Content Download",
    metric: "$480k Influenced Pipeline",
  },
  {
    id: "c3",
    name: "Energy Summit 2026",
    type: "Event",
    metric: "+28% SQL Conversion",
  },
  {
    id: "c4",
    name: "LinkedIn ABM — Utilities",
    type: "Paid Social",
    metric: "156 MQLs",
  },
];

export const intelligencePulse = [
  {
    id: "i1",
    title: "ERCOT Expands Battery Aggregation",
    summary:
      "New market rules may accelerate DER adoption among your utility accounts.",
    tags: ["3 Relevant Accounts", "High Impact"],
    time: "2h ago",
  },
  {
    id: "i2",
    title: "FERC Order Opens Capacity Markets",
    summary: "Potential impact on demand response programs in Northeast territories.",
    tags: ["2 Relevant Accounts", "Medium Impact"],
    time: "5h ago",
  },
  {
    id: "i3",
    title: "Major Utility Announces Grid Investment",
    summary: "Southern Company commits $2B to grid modernization through 2028.",
    tags: ["1 Relevant Account", "High Impact"],
    time: "1d ago",
  },
];
