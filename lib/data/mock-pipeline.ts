import type {
  AlignmentMetrics,
  FunnelStage,
  PipelineMetrics,
  SustainabilityMetrics,
  TeamMemberMetrics,
} from "@/lib/types/lead";

/** Pipeline metrics aligned with the PDF sales funnel example. */
export const mockPipeline: PipelineMetrics = {
  totalLeads: 350,
  mqls: 120,
  sqls: 75,
  opportunities: 30,
  closedWon: 8,
  conversionRate: 2.3,
};

export const funnelStages: FunnelStage[] = [
  { label: "Total Leads", count: 350, color: "#0047FF" },
  { label: "MQLs", count: 120, color: "#00E297" },
  { label: "SQLs", count: 75, color: "#000F9F" },
  { label: "Opportunities", count: 30, color: "#0047FF" },
  { label: "Closed Won", count: 8, color: "#00E297" },
];

export const mockTeamMetrics: TeamMemberMetrics[] = [
  {
    id: "sdr-1",
    name: "Shivani",
    followUpRate: 94,
    meetingsBooked: 18,
    avgResponseTimeHours: 3.2,
    conversionRate: 12.5,
  },
  {
    id: "sdr-2",
    name: "Marcus",
    followUpRate: 88,
    meetingsBooked: 14,
    avgResponseTimeHours: 5.1,
    conversionRate: 10.2,
  },
  {
    id: "sdr-3",
    name: "Jordan",
    followUpRate: 91,
    meetingsBooked: 11,
    avgResponseTimeHours: 4.0,
    conversionRate: 9.8,
  },
];

export const mockAlignment: AlignmentMetrics = {
  leadsAcceptedBySales: 75,
  marketingGeneratedPipeline: 2400000,
  marketingGeneratedRevenue: 680000,
};

export const mockSustainability: SustainabilityMetrics = {
  aiQueriesProcessed: 4200,
  energyPerQueryWh: 0.42,
  carbonPerQueryGco2e: 0.12,
};
