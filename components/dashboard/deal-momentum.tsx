import Link from "next/link";
import type { Lead } from "@/lib/types/lead";
import {
  MOMENTUM_DOTS,
  MOMENTUM_LABELS,
  MOMENTUM_STYLES,
  STATUS_LABELS,
  STATUS_STYLES,
} from "@/lib/constants/status";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type DealMomentumProps = {
  leads: Lead[];
};

export function DealMomentum({ leads }: DealMomentumProps) {
  const topLeads = [...leads]
    .sort((a, b) => b.engagementScore - a.engagementScore)
    .slice(0, 10);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Deal Momentum Tracker</CardTitle>
      </CardHeader>

      <div className="overflow-x-auto">
        <table className="w-full table-fixed text-left text-[15px]">
          <colgroup>
            <col className="w-[22%]" />
            <col className="w-[28%]" />
            <col className="w-[18%]" />
            <col className="w-[20%]" />
            <col className="w-[12%]" />
          </colgroup>
          <thead>
            <tr className="border-b border-border text-sm text-muted">
              <th className="px-0 pb-4 pr-6 text-left font-medium">Name</th>
              <th className="px-0 pb-4 pr-6 text-left font-medium">Account</th>
              <th className="px-0 pb-4 pr-6 text-left font-medium">Stage</th>
              <th className="px-0 pb-4 pr-6 text-left font-medium">Momentum</th>
              <th className="px-0 pb-4 text-left font-medium">Score</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {topLeads.map((lead) => (
              <tr key={lead.id} className="group">
                <td className="px-0 py-4 pr-6 text-left align-middle">
                  <Link
                    href={`/leads/${lead.id}`}
                    className="font-semibold text-uplight-blue hover:underline"
                  >
                    {lead.name}
                  </Link>
                </td>
                <td className="px-0 py-4 pr-6 text-left align-middle text-muted">
                  {lead.company}
                </td>
                <td className="px-0 py-4 pr-6 text-left align-middle">
                  <Badge
                    className={`inline-flex px-3 py-1 text-sm ${STATUS_STYLES[lead.status]}`}
                  >
                    {STATUS_LABELS[lead.status]}
                  </Badge>
                </td>
                <td className="px-0 py-4 pr-6 text-left align-middle">
                  <span
                    className={`inline-flex items-center justify-start gap-2 font-medium ${MOMENTUM_STYLES[lead.momentum]}`}
                  >
                    <span
                      className={`h-2.5 w-2.5 shrink-0 rounded-full ${MOMENTUM_DOTS[lead.momentum]}`}
                    />
                    {MOMENTUM_LABELS[lead.momentum]}
                  </span>
                </td>
                <td className="px-0 py-4 text-left align-middle text-lg font-bold tabular-nums">
                  {lead.engagementScore}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Link
        href="/leads"
        className="mt-5 inline-block text-sm font-medium text-uplight-blue hover:underline"
      >
        View all leads →
      </Link>
    </Card>
  );
}
