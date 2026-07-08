import { DealMomentum } from "@/components/dashboard/deal-momentum";
import { IntelligencePulse } from "@/components/dashboard/intelligence-pulse";
import { PipelineOverview } from "@/components/dashboard/pipeline-overview";
import { TopCampaigns } from "@/components/dashboard/top-campaigns";
import { PageContent } from "@/components/layout/page-content";
import { StatCard } from "@/components/ui/stat-card";
import {
  getIntelligencePulse,
  getOverviewKpis,
  getPipelineStages,
  getPipelineValue,
  getTopCampaigns,
} from "@/lib/data/dashboard-data";
import { getLeads } from "@/lib/salesforce/reports";

export default async function OverviewPage() {
  const leads = await getLeads();
  const overviewKpis = getOverviewKpis();
  const pipelineStages = getPipelineStages();
  const pipelineValue = getPipelineValue();
  const topCampaigns = getTopCampaigns();
  const intelligencePulse = getIntelligencePulse();

  return (
    <PageContent className="space-y-6">
      <div className="grid gap-4 xl:grid-cols-5">
        {overviewKpis.map((kpi) => (
          <StatCard
            key={kpi.label}
            label={kpi.label}
            value={kpi.value}
            subtext={kpi.subtext}
            trend={kpi.trend}
          />
        ))}
      </div>

      <PipelineOverview stages={pipelineStages} pipelineValue={pipelineValue} />

      <DealMomentum leads={leads} />

      <div className="grid gap-6 lg:grid-cols-2">
        <TopCampaigns campaigns={topCampaigns} />
        <IntelligencePulse insights={intelligencePulse} />
      </div>
    </PageContent>
  );
}
