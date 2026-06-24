import { Header } from "@/components/layout/header";
import { PageContent } from "@/components/layout/page-content";
import { Card } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import { mockAlignment } from "@/lib/data/mock-pipeline";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export default function AlignmentPage() {
  return (
    <>
      <Header
        title="Sales & Marketing Alignment"
        description="Measure leads accepted by Sales, marketing-generated pipeline, and revenue attribution."
      />

      <PageContent className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard
            label="Leads Accepted by Sales"
            value={mockAlignment.leadsAcceptedBySales}
            subtext="MQLs → SQL conversion"
            accent="blue"
          />
          <StatCard
            label="Marketing Pipeline"
            value={formatCurrency(mockAlignment.marketingGeneratedPipeline)}
            accent="green"
          />
          <StatCard
            label="Marketing Revenue"
            value={formatCurrency(mockAlignment.marketingGeneratedRevenue)}
            accent="navy"
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <h3 className="mb-4 text-sm font-semibold">Marketing asks</h3>
            <ul className="space-y-3 text-sm text-uplight-black/80">
              <li className="flex gap-2">
                <span className="text-uplight-green">✓</span>
                Did Sales follow up on the leads we generated?
              </li>
              <li className="flex gap-2">
                <span className="text-uplight-green">✓</span>
                Which campaigns created opportunities?
              </li>
              <li className="flex gap-2">
                <span className="text-uplight-green">✓</span>
                How many leads became customers?
              </li>
            </ul>
          </Card>

          <Card>
            <h3 className="mb-4 text-sm font-semibold">Sales asks</h3>
            <ul className="space-y-3 text-sm text-uplight-black/80">
              <li className="flex gap-2">
                <span className="text-uplight-blue">✓</span>
                Which leads are most engaged?
              </li>
              <li className="flex gap-2">
                <span className="text-uplight-blue">✓</span>
                Which leads should I prioritize?
              </li>
              <li className="flex gap-2">
                <span className="text-uplight-blue">✓</span>
                What marketing touchpoints happened before outreach?
              </li>
            </ul>
          </Card>
        </div>

        <Card className="border-uplight-navy/20 bg-uplight-navy/5">
          <p className="text-sm leading-relaxed">
            <strong>uplight IQ</strong> answers both questions by showing exactly where every
            lead is in the pipeline and how Marketing efforts contribute to revenue — a
            single source of truth for both teams.
          </p>
        </Card>
      </PageContent>
    </>
  );
}
