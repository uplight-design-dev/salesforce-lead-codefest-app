export type PipelineStageMetric = {
  label: string;
  count: number;
  conversionFromPrevious?: number;
};

export const overviewKpis = [
  {
    label: "Total Active Leads",
    value: "12,483",
    trend: { value: "↑ 14.2% vs last 30 days", positive: true },
  },
  {
    label: "High Intent Accounts",
    value: "385",
    subtext: "AI prioritized",
  },
  {
    label: "Avg SDR Response Time",
    value: "1.8 hrs",
    trend: { value: "↓ 22% vs last 30 days", positive: true },
  },
  {
    label: "Campaign Attribution ROI",
    value: "$2.4M",
    subtext: "Tracked influence",
  },
  {
    label: "Industry Alerts",
    value: "17",
  },
];

export const pipelineStages: PipelineStageMetric[] = [
  { label: "Captured", count: 2965 },
  { label: "Qualified", count: 1892, conversionFromPrevious: 63.8 },
  { label: "Nurturing", count: 1234, conversionFromPrevious: 65.2 },
  { label: "Meetings Sch.", count: 652, conversionFromPrevious: 52.8 },
  { label: "Proposal", count: 296, conversionFromPrevious: 45.4 },
  { label: "Closed Won", count: 142, conversionFromPrevious: 48.0 },
  { label: "Closed Lost", count: 91 },
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
