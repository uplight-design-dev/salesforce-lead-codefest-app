export type LeadStatus =
  | "new"
  | "engaged"
  | "mql"
  | "assigned"
  | "contacted"
  | "sql"
  | "opportunity"
  | "nurturing"
  | "stalled"
  | "closed_won"
  | "closed_lost";

export type Momentum = "accelerating" | "stalled" | "at_risk";

export type EngagementActivity = {
  id: string;
  date: string;
  activity: string;
  source: "marketing" | "sales" | "website" | "webinar";
};

export type Lead = {
  id: string;
  name: string;
  email: string;
  company: string;
  title: string;
  status: LeadStatus;
  owner: string;
  engagementScore: number;
  momentum: Momentum;
  lastActivity: string;
  source: string;
  activities: EngagementActivity[];
  aiSummary?: string;
  conversionProbability?: number;
  websiteVisits?: number;
  assetDownloads?: number;
  webinarAttendance?: number;
};

export type PipelineMetrics = {
  totalLeads: number;
  mqls: number;
  sqls: number;
  opportunities: number;
  closedWon: number;
  conversionRate: number;
};

export type FunnelStage = {
  label: string;
  count: number;
  color: string;
};

export type HighIntentAlert = {
  id: string;
  leadId: string;
  leadName: string;
  owner: string;
  message: string;
  reason: string;
  priority: "high" | "medium";
  createdAt: string;
};

export type TeamMemberMetrics = {
  id: string;
  name: string;
  followUpRate: number;
  meetingsBooked: number;
  avgResponseTimeHours: number;
  conversionRate: number;
};

export type AlignmentMetrics = {
  leadsAcceptedBySales: number;
  marketingGeneratedPipeline: number;
  marketingGeneratedRevenue: number;
};

export type SustainabilityMetrics = {
  aiQueriesProcessed: number;
  energyPerQueryWh: number;
  carbonPerQueryGco2e: number;
};

export type WebsiteEngagement = {
  pagePath: string;
  sessions: number;
  users: number;
  avgEngagementTime: number;
};
