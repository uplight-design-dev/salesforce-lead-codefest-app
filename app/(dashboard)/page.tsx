import { DealMomentum } from "@/components/dashboard/deal-momentum";
import { HighIntentAlerts } from "@/components/dashboard/high-intent-alerts";
import { IntelligencePulse } from "@/components/dashboard/intelligence-pulse";
import { NewCampaignAlerts } from "@/components/dashboard/new-campaign-alerts";
import { OverviewKpis } from "@/components/dashboard/overview-kpis";
import { PipelineOverview } from "@/components/dashboard/pipeline-overview";
import { TopCampaigns } from "@/components/dashboard/top-campaigns";
import { Header } from "@/components/layout/header";
import { PageContent } from "@/components/layout/page-content";
import { getOverviewAlerts } from "@/lib/data/alerts";
import {
  getIntelligencePulse,
  getOverviewKpis,
  getPipelineStages,
  getPipelineValue,
  getTopCampaigns,
} from "@/lib/data/dashboard-data";
import { getLeadsResult } from "@/lib/salesforce/reports";

export default async function OverviewPage() {
  const { leads, source } = await getLeadsResult();
  const overviewKpis = getOverviewKpis();
  const pipelineStages = getPipelineStages();
  const pipelineValue = getPipelineValue();
  const topCampaigns = getTopCampaigns();
  const intelligencePulse = getIntelligencePulse();
  const { highIntentAlerts, campaignAlerts } = getOverviewAlerts(leads);

  return (
    <>
      <Header
        title="Overview"
        description="Pipeline KPIs, deal momentum, and engaged contacts at a glance."
        dataSource={source}
      />
      <PageContent className="space-y-6">
        <OverviewKpis kpis={overviewKpis} leads={leads} />

        <PipelineOverview
          stages={pipelineStages}
          pipelineValue={pipelineValue}
          leads={leads}
        />

        <div className="grid gap-6 lg:grid-cols-2">
          <HighIntentAlerts alerts={highIntentAlerts} />
          <NewCampaignAlerts alerts={campaignAlerts} />
        </div>

        <DealMomentum leads={leads} />

        <div className="grid gap-6 lg:grid-cols-2">
          <TopCampaigns campaigns={topCampaigns} />
          <IntelligencePulse insights={intelligencePulse} />
        </div>
      </PageContent>
    </>
  );
}
