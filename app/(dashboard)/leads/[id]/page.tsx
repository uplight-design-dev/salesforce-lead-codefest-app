import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { AiSummary } from "@/components/leads/ai-summary";
import { EngagementTimeline } from "@/components/leads/engagement-timeline";
import { IntentScorePanel } from "@/components/leads/intent-score-panel";
import { MqlQualificationPanel } from "@/components/leads/mql-qualification-panel";
import { Header } from "@/components/layout/header";
import { PageContent } from "@/components/layout/page-content";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import {
  MOMENTUM_DOTS,
  MOMENTUM_LABELS,
  MOMENTUM_STYLES,
  STATUS_LABELS,
  STATUS_STYLES,
} from "@/lib/constants/status";
import { getLeadById } from "@/lib/salesforce/reports";

type LeadDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function LeadDetailPage({ params }: LeadDetailPageProps) {
  const { id } = await params;
  const lead = await getLeadById(id);

  if (!lead) notFound();

  return (
    <>
      <Header title={lead.name} description={`${lead.title} at ${lead.company}`} />

      <PageContent className="space-y-6">
        <Link
          href="/leads"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-uplight-blue hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to leads
        </Link>

        <div className="flex flex-wrap items-center gap-3">
          <Badge className={STATUS_STYLES[lead.status]}>
            {STATUS_LABELS[lead.status]}
          </Badge>
          <span
            className={`inline-flex items-center gap-1.5 text-sm font-medium ${MOMENTUM_STYLES[lead.momentum]}`}
          >
            <span
              className={`h-2 w-2 rounded-full ${MOMENTUM_DOTS[lead.momentum]}`}
            />
            {MOMENTUM_LABELS[lead.momentum]}
          </span>
          <span className="text-sm text-muted">Owner: {lead.owner}</span>
        </div>

        {lead.aiSummary && (
          <AiSummary
            summary={lead.aiSummary}
            conversionProbability={lead.conversionProbability}
          />
        )}

        <div className="grid gap-4 sm:grid-cols-4">
          <StatCard label="Engagement Score" value={lead.engagementScore} accent="green" />
          <StatCard label="Website Visits" value={lead.websiteVisits ?? 0} accent="blue" />
          <StatCard label="Asset Downloads" value={lead.assetDownloads ?? 0} accent="navy" />
          <StatCard label="Webinars" value={lead.webinarAttendance ?? 0} accent="green" />
        </div>

        {lead.mqlQualification && (
          <MqlQualificationPanel qualification={lead.mqlQualification} />
        )}

        {lead.intentScoreBreakdown && lead.intentScoreBreakdown.length > 0 && (
          <IntentScorePanel
            baseScore={lead.baseEngagementScore}
            intentBonus={lead.intentScoreBonus}
            totalScore={lead.engagementScore}
            breakdown={lead.intentScoreBreakdown}
          />
        )}

        <div className="grid gap-6 lg:grid-cols-2">
          <EngagementTimeline activities={lead.activities} />

          <Card>
            <h3 className="mb-4 text-sm font-semibold">Lead Details</h3>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between border-b border-border pb-2">
                <dt className="text-muted">Email</dt>
                <dd className="font-medium">{lead.email}</dd>
              </div>
              <div className="flex justify-between border-b border-border pb-2">
                <dt className="text-muted">Source</dt>
                <dd className="font-medium">{lead.source}</dd>
              </div>
              <div className="flex justify-between border-b border-border pb-2">
                <dt className="text-muted">Last Activity</dt>
                <dd className="font-medium">{lead.lastActivity}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">Salesforce ID</dt>
                <dd className="font-mono text-xs text-muted">{lead.id}</dd>
              </div>
            </dl>
          </Card>
        </div>
      </PageContent>
    </>
  );
}
