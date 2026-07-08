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

function hasCsvData(): boolean {
  return getCsvLeads().length > 0;
}

export function getOverviewKpis() {
  return hasCsvData() ? getCsvOverviewKpis() : mockOverviewKpis;
}

export function getPipelineStages() {
  return hasCsvData() ? getCsvPipelineStages() : mockPipelineStages;
}

export function getPipelineValue() {
  return hasCsvData() ? getCsvPipelineValue() : mockPipelineValue;
}

export function getTopCampaigns() {
  return hasCsvData() ? getCsvTopCampaigns() : mockTopCampaigns;
}

export function getIntelligencePulse() {
  return hasCsvData() ? getCsvIntelligencePulse() : mockIntelligencePulse;
}

export function getPipelineMetrics() {
  return hasCsvData() ? getCsvPipelineMetrics() : mockPipeline;
}

export function getFunnelStages() {
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
