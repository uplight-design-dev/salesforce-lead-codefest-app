"use client";

import { Badge } from "@/components/ui/badge";
import { CollapsibleCard } from "@/components/ui/collapsible-card";
import type { MqlQualification } from "@/lib/types/lead";

type MqlQualificationPanelProps = {
  qualification: MqlQualification;
};

export function MqlQualificationPanel({
  qualification,
}: MqlQualificationPanelProps) {
  return (
    <CollapsibleCard
      title="MQL Qualification"
      badge={
        <Badge
          className={
            qualification.qualifies
              ? "bg-emerald-50 text-emerald-700"
              : "bg-amber-50 text-amber-800"
          }
        >
          {qualification.qualifies ? "MQL qualified" : "Not yet MQL"}
        </Badge>
      }
      summary={
        <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted">
          <span>
            Score{" "}
            <strong className="tabular-nums text-uplight-black">
              {qualification.leadScore}
            </strong>
            /{qualification.scoreThreshold}
          </span>
          <span>
            ICP fit{" "}
            <strong className="tabular-nums text-uplight-black">
              {qualification.fitCount}
            </strong>
            /{qualification.fitRequired}
          </span>
          <span>
            Engagements{" "}
            <strong className="tabular-nums text-uplight-black">
              {qualification.engagementCount}
            </strong>
            /{qualification.engagementRequired}
          </span>
          <span className="text-xs text-muted">Click to view criteria</span>
        </div>
      }
    >
      <p className="mb-4 text-sm text-muted">{qualification.ruleSummary}</p>

      <div className="grid gap-6 lg:grid-cols-2">
        <div>
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
            Fit criteria
          </h4>
          <ul className="space-y-2">
            {qualification.fitCriteria.map((item) => (
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
        </div>

        <div>
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
            Engagement criteria
          </h4>
          <ul className="space-y-2">
            {qualification.engagementCriteria.map((item) => (
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
        </div>
      </div>
    </CollapsibleCard>
  );
}
