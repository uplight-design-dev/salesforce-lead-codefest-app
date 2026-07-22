import Link from "next/link";
import type { Lead } from "@/lib/types/lead";
import {
  MOMENTUM_DOTS,
  MOMENTUM_LABELS,
  MOMENTUM_STYLES,
  STATUS_LABELS,
  STATUS_STYLES,
} from "@/lib/constants/status";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

type LeadTableProps = {
  leads: Lead[];
};

export function LeadTable({ leads }: LeadTableProps) {
  return (
    <Card className="overflow-hidden p-0">
      <div className="overflow-x-auto">
        <table className="w-full text-[15px]">
          <thead className="bg-surface">
            <tr className="text-left text-sm text-muted">
              <th className="px-6 py-4 font-medium">Lead</th>
              <th className="px-6 py-4 font-medium">Company</th>
              <th className="px-6 py-4 font-medium">Status</th>
              <th className="px-6 py-4 font-medium">Owner</th>
              <th className="px-6 py-4 font-medium">Momentum</th>
              <th className="px-6 py-4 font-medium">Score</th>
              <th className="px-6 py-4 font-medium">Last Activity</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {leads.map((lead) => (
              <tr key={lead.id} className="hover:bg-surface/60">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/leads/${lead.id}`}
                      className="font-semibold text-uplight-blue hover:underline"
                    >
                      {lead.name}
                    </Link>
                    {lead.status === "new" && (
                      <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                        New
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted">{lead.email}</p>
                </td>
                <td className="px-6 py-4">{lead.company}</td>
                <td className="px-6 py-4">
                  <Badge className={`px-3 py-1 text-sm ${STATUS_STYLES[lead.status]}`}>
                    {STATUS_LABELS[lead.status]}
                  </Badge>
                </td>
                <td className="px-6 py-4">{lead.owner}</td>
                <td className="px-6 py-4">
                  <span
                    className={`inline-flex items-center gap-2 ${MOMENTUM_STYLES[lead.momentum]}`}
                  >
                    <span
                      className={`h-2.5 w-2.5 rounded-full ${MOMENTUM_DOTS[lead.momentum]}`}
                    />
                    {MOMENTUM_LABELS[lead.momentum]}
                  </span>
                </td>
                <td className="px-6 py-4 text-lg font-bold tabular-nums">
                  {lead.engagementScore}
                </td>
                <td className="px-6 py-4 text-muted">{lead.lastActivity}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
