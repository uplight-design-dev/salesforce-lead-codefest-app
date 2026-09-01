import { Suspense } from "react";
import { DealMomentum } from "@/components/dashboard/deal-momentum";
import { HighIntentAlerts } from "@/components/dashboard/high-intent-alerts";
import { IntelligencePulse } from "@/components/dashboard/intelligence-pulse";
import { NewCampaignAlerts } from "@/components/dashboard/new-campaign-alerts";
import { OverviewKpis } from "@/components/dashboard/overview-kpis";
import { PeriodSelector } from "@/components/dashboard/period-selector";
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
import {
  filterLeadsByPeriod,
  parsePeriodKey,
  periodLabel,
  resolveAsOfFromLeads,
} from "@/lib/leads/period";
import { getLeadsResult } from "@/lib/salesforce/reports";

type OverviewPageProps = {
  searchParams: Promise<{ period?: string }>;
};

export default async function OverviewPage({ searchParams }: OverviewPageProps) {
  const params = await searchParams;
  const period = parsePeriodKey(params.period);
  const { leads: allLeads, source } = await getLeadsResult();
  const asOf = resolveAsOfFromLeads(allLeads);
  const leads = filterLeadsByPeriod(allLeads, period, asOf);

  const overviewKpis = getOverviewKpis(leads);
  const pipelineStages = getPipelineStages(leads);
  const pipelineValue = getPipelineValue(leads);
  const topCampaigns = getTopCampaigns();
  const intelligencePulse = getIntelligencePulse(leads);
  const { highIntentAlerts, campaignAlerts } = getOverviewAlerts(leads);

  return (
    <>
      <Header
        title="Overview"
        description={`Pipeline KPIs, deal momentum, and engaged contacts — ${periodLabel(period)}.`}
        dataSource={source}
        actions={
          <Suspense fallback={null}>
            <PeriodSelector active={period} />
          </Suspense>
        }
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
