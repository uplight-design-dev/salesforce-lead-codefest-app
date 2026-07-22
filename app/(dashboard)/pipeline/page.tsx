import { PipelineFunnelSection } from "@/components/dashboard/pipeline-funnel-section";
import { Header } from "@/components/layout/header";
import { PageContent } from "@/components/layout/page-content";
import { getFunnelStages } from "@/lib/data/dashboard-data";
import { fetchPipelineResult, getLeadsResult } from "@/lib/salesforce/reports";

export default async function PipelinePage() {
  const [{ pipeline, source }, { leads }] = await Promise.all([
    fetchPipelineResult(),
    getLeadsResult(),
  ]);
  const funnelStages = getFunnelStages();

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
        description="Real-time view of where leads are in the sales funnel and how effectively they progress."
        dataSource={source}
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
