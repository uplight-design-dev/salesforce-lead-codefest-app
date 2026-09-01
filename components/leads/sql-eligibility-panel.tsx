"use client";

import { Badge } from "@/components/ui/badge";
import { CollapsibleCard } from "@/components/ui/collapsible-card";
import type { SqlEligibility } from "@/lib/types/lead";

type SqlEligibilityPanelProps = {
  eligibility: SqlEligibility;
};

export function SqlEligibilityPanel({ eligibility }: SqlEligibilityPanelProps) {
  return (
    <CollapsibleCard
      title="SQL Parameters"
      badge={
        <Badge
          className={
            eligibility.eligible
              ? "bg-emerald-50 text-emerald-700"
              : eligibility.noGoAccount
                ? "bg-rose-50 text-rose-700"
                : "bg-amber-50 text-amber-800"
          }
        >
          {eligibility.eligible
            ? "SQL eligible"
            : eligibility.noGoAccount
              ? "No-Go blocked"
              : "Not yet SQL"}
        </Badge>
      }
      summary={
        <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted">
          <span>
            MQL{" "}
            <strong className="text-uplight-black">
              {eligibility.mqlMet ? "Met" : "Not met"}
            </strong>
          </span>
          <span>
            No-Go{" "}
            <strong className="text-uplight-black">
              {eligibility.noGoAccount
                ? eligibility.noGoAccount.utility
                : "Clear"}
            </strong>
          </span>
          <span className="text-xs text-muted">
            For now: MQL rules + No-Go Accounts
          </span>
        </div>
      }
    >
      <p className="mb-4 text-sm text-muted">{eligibility.ruleSummary}</p>

      {eligibility.noGoAccount && (
        <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-900">
          <p className="font-medium">
            No-Go account: {eligibility.noGoAccount.utility}
          </p>
          <p className="mt-0.5 text-xs">
            Sales Director: {eligibility.noGoAccount.salesDirector}
            {eligibility.noGoAccount.reason
              ? ` — ${eligibility.noGoAccount.reason}`
              : ""}
          </p>
        </div>
      )}

      <ul className="space-y-2">
        {eligibility.criteria.map((item) => (
          <li
            key={item.key}
            className="rounded-lg border border-border px-3 py-2 text-sm"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="font-medium">{item.label}</span>
              <span
                className={
                  item.met
                    ? "text-xs font-semibold text-emerald-700"
                    : "text-xs font-semibold text-muted"
                }
              >
                {item.met ? "Met" : "Not met"}
              </span>
            </div>
            <p className="mt-1 text-xs text-muted">{item.detail}</p>
          </li>
        ))}
      </ul>

      <p className="mt-4 text-xs text-muted">
        Sales Dev Team may add more SQL parameters later.
      </p>
    </CollapsibleCard>
  );
}
