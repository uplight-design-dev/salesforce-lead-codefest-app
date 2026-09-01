import { Suspense } from "react";
import { PipelineFunnelSection } from "@/components/dashboard/pipeline-funnel-section";
import { PeriodSelector } from "@/components/dashboard/period-selector";
import { Header } from "@/components/layout/header";
import { PageContent } from "@/components/layout/page-content";
import { getFunnelStages, getPipelineMetrics } from "@/lib/data/dashboard-data";
import {
  filterLeadsByPeriod,
  parsePeriodKey,
  periodLabel,
  resolveAsOfFromLeads,
} from "@/lib/leads/period";
import { getLeadsResult } from "@/lib/salesforce/reports";

type PipelinePageProps = {
  searchParams: Promise<{ period?: string }>;
};

export default async function PipelinePage({ searchParams }: PipelinePageProps) {
  const params = await searchParams;
  const period = parsePeriodKey(params.period);
  const { leads: allLeads, source } = await getLeadsResult();
  const asOf = resolveAsOfFromLeads(allLeads);
  const leads = filterLeadsByPeriod(allLeads, period, asOf);
  const pipeline = getPipelineMetrics(leads);
  const funnelStages = getFunnelStages(leads);

  const metrics = [
    { label: "Total Leads", value: pipeline.totalLeads },
    { label: "MQLs", value: pipeline.mqls },
    { label: "SQLs", value: pipeline.sqls },
    { label: "Opportunities", value: pipeline.opportunities },
    { label: "Closed Won", value: pipeline.closedWon },
  ];

  return (
    <>
      <Header
        title="Pipeline Visibility"
        description={`Funnel progress for ${periodLabel(period).toLowerCase()}.`}
        dataSource={source}
        actions={
          <Suspense fallback={null}>
            <PeriodSelector active={period} />
          </Suspense>
        }
      />

      <PageContent className="space-y-6">
        <PipelineFunnelSection
          stages={funnelStages}
          conversionRate={pipeline.conversionRate}
          metrics={metrics}
          leads={leads}
          closedWon={pipeline.closedWon}
          totalLeads={pipeline.totalLeads}
        />
      </PageContent>
    </>
  );
}
