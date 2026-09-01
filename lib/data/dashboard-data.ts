/**
 * Dashboard data accessors — CSV-derived metrics when the lead tracker
 * export is available, otherwise mock fallbacks.
 */

import {
  getCsvAlignmentMetrics,
  getCsvFunnelStages,
  getCsvIntelligencePulse,
  getCsvOverviewKpis,
  getCsvPipelineMetrics,
  getCsvPipelineStages,
  getCsvPipelineValue,
  getCsvSustainabilityMetrics,
  getCsvTeamMetrics,
  getCsvTopCampaigns,
} from "@/lib/data/csv-metrics";
import { getCsvLeads } from "@/lib/data/csv-leads";
import {
  intelligencePulse as mockIntelligencePulse,
  overviewKpis as mockOverviewKpis,
  pipelineStages as mockPipelineStages,
  pipelineValue as mockPipelineValue,
  topCampaigns as mockTopCampaigns,
} from "@/lib/data/mock-overview";
import {
  funnelStages as mockFunnelStages,
  mockAlignment,
  mockPipeline,
  mockSustainability,
  mockTeamMetrics,
} from "@/lib/data/mock-pipeline";
import type { Lead } from "@/lib/types/lead";

function hasCsvData(): boolean {
  return getCsvLeads().length > 0;
}

export function getOverviewKpis(leads?: Lead[]) {
  if (leads) return getCsvOverviewKpis(leads);
  return hasCsvData() ? getCsvOverviewKpis() : mockOverviewKpis;
}

export function getPipelineStages(leads?: Lead[]) {
  if (leads) return getCsvPipelineStages(leads);
  return hasCsvData() ? getCsvPipelineStages() : mockPipelineStages;
}

export function getPipelineValue(leads?: Lead[]) {
  if (leads) return getCsvPipelineValue(leads);
  return hasCsvData() ? getCsvPipelineValue() : mockPipelineValue;
}

export function getTopCampaigns() {
  return hasCsvData() ? getCsvTopCampaigns() : mockTopCampaigns;
}

export function getIntelligencePulse(leads?: Lead[]) {
  if (leads) return getCsvIntelligencePulse(leads);
  return hasCsvData() ? getCsvIntelligencePulse() : mockIntelligencePulse;
}

export function getPipelineMetrics(leads?: Lead[]) {
  if (leads) return getCsvPipelineMetrics(leads);
  return hasCsvData() ? getCsvPipelineMetrics() : mockPipeline;
}

export function getFunnelStages(leads?: Lead[]) {
  if (leads) {
    return getCsvFunnelStages(getCsvPipelineMetrics(leads));
  }
  return hasCsvData()
    ? getCsvFunnelStages(getCsvPipelineMetrics())
    : mockFunnelStages;
}

export function getTeamMetrics() {
  return hasCsvData() ? getCsvTeamMetrics() : mockTeamMetrics;
}

export function getAlignmentMetrics() {
  return hasCsvData() ? getCsvAlignmentMetrics() : mockAlignment;
}

export function getSustainabilityMetrics() {
  return hasCsvData() ? getCsvSustainabilityMetrics() : mockSustainability;
}

export function hasCsvLeadData(): boolean {
  return hasCsvData();
}
