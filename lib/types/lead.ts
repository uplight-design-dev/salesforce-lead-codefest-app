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

export type IntentScoreBreakdownItem = {
  parameter: string;
  threshold: string;
  points: number;
  observed: string;
  awarded: boolean;
};

export type MqlCriterionResult = {
  key: string;
  label: string;
  detail: string;
  met: boolean;
};

export type MqlQualification = {
  qualifies: boolean;
  fitsIcp: boolean;
  fitCount: number;
  fitRequired: number;
  engagementCount: number;
  engagementRequired: number;
  scoreMeetsThreshold: boolean;
  scoreThreshold: number;
  leadScore: number;
  fitCriteria: MqlCriterionResult[];
  engagementCriteria: MqlCriterionResult[];
  ruleSummary: string;
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
  /** Segment/touchpoint base before 14-day intent bonuses. */
  baseEngagementScore?: number;
  /** Points from High-Intent Lead Scoring Criteria (Last 14 Days). */
  intentScoreBonus?: number;
  intentScoreBreakdown?: IntentScoreBreakdownItem[];
  mqlQualification?: MqlQualification;
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
