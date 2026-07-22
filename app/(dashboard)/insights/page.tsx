import { InsightsNetwork } from "@/components/insights/insights-network";
import { Header } from "@/components/layout/header";
import { PageContent } from "@/components/layout/page-content";
import { buildInsightsGraph } from "@/lib/data/insights-graph";
import { getLeadsResult } from "@/lib/salesforce/reports";

export default async function InsightsPage() {
  const { leads, source } = await getLeadsResult();
  const graph = buildInsightsGraph(leads);

  return (
    <>
      <Header
        title="Insights"
        description="A living web of accounts, contacts, and campaign touchpoints — explore how engagement connects."
        dataSource={source}
      />
      <PageContent className="space-y-6">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <Metric
            label="Accounts in web"
            value={graph.stats.accounts}
          />
          <Metric
            label="Contacts mapped"
            value={graph.stats.contacts}
          />
          <Metric
            label="Campaigns linked"
            value={graph.stats.campaigns}
          />
          <Metric
            label="Connections"
            value={graph.stats.connections}
          />
          <Metric
            label="High-intent nodes"
            value={graph.stats.highIntent}
          />
        </div>

        <InsightsNetwork graph={graph} />
      </PageContent>
    </>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-border bg-white px-4 py-3">
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-1 text-2xl font-bold tabular-nums">{value}</p>
    </div>
  );
}
