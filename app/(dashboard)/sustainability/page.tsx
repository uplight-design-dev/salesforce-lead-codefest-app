import { Leaf } from "lucide-react";
import { Header } from "@/components/layout/header";
import { PageContent } from "@/components/layout/page-content";
import { Card } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import { getSustainabilityMetrics } from "@/lib/data/dashboard-data";

export default function SustainabilityPage() {
  const sustainability = getSustainabilityMetrics();
  const totalEnergy =
    sustainability.aiQueriesProcessed * sustainability.energyPerQueryWh;
  const totalCarbon =
    sustainability.aiQueriesProcessed * sustainability.carbonPerQueryGco2e;

  return (
    <>
      <Header
        title="AI Energy Dashboard"
        description="Track AI requests processed and estimated energy / carbon footprint — Code Fest sustainability feature."
      />

      <PageContent className="space-y-6">
        <Card className="flex items-start gap-4 border-uplight-green/30 bg-uplight-green/5">
          <Leaf className="h-6 w-6 shrink-0 text-uplight-green" />
          <div>
            <h3 className="font-semibold">Sustainability at Uplight</h3>
            <p className="mt-1 text-sm text-muted">
              Transparency into the environmental cost of AI-powered lead intelligence.
              Metrics scale with engagement touchpoints from the lead tracker.
            </p>
          </div>
        </Card>

        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard
            label="AI Queries Processed"
            value={sustainability.aiQueriesProcessed.toLocaleString()}
            accent="green"
          />
          <StatCard
            label="Energy Used"
            value={`${totalEnergy.toFixed(0)} Wh`}
            subtext={`${sustainability.energyPerQueryWh} Wh/query`}
            accent="blue"
          />
          <StatCard
            label="Carbon Footprint"
            value={`${totalCarbon.toFixed(0)} gCO₂e`}
            subtext={`${sustainability.carbonPerQueryGco2e} gCO₂e/query`}
            accent="navy"
          />
        </div>

        <Card>
          <h3 className="mb-4 text-sm font-semibold">How we calculate</h3>
          <dl className="grid gap-4 sm:grid-cols-3 text-sm">
            <div>
              <dt className="text-muted">AI Queries</dt>
              <dd className="mt-1 text-2xl font-bold">
                {sustainability.aiQueriesProcessed.toLocaleString()}
              </dd>
            </div>
            <div>
              <dt className="text-muted">Energy per query</dt>
              <dd className="mt-1 text-2xl font-bold">
                {sustainability.energyPerQueryWh} Wh
              </dd>
            </div>
            <div>
              <dt className="text-muted">Carbon per query</dt>
              <dd className="mt-1 text-2xl font-bold">
                {sustainability.carbonPerQueryGco2e} gCO₂e
              </dd>
            </div>
          </dl>
        </Card>
      </PageContent>
    </>
  );
}
