"use client";

import { Badge } from "@/components/ui/badge";
import { CollapsibleCard } from "@/components/ui/collapsible-card";
import type { IntentScoreBreakdownItem } from "@/lib/types/lead";

type IntentScorePanelProps = {
  baseScore?: number;
  intentBonus?: number;
  totalScore: number;
  breakdown: IntentScoreBreakdownItem[];
};

export function IntentScorePanel({
  baseScore,
  intentBonus = 0,
  totalScore,
  breakdown,
}: IntentScorePanelProps) {
  const awardedCount = breakdown.filter((item) => item.awarded).length;

  return (
    <CollapsibleCard
      title="High-Intent Scoring (Last 14 Days)"
      badge={
        <Badge
          className={
            intentBonus > 0
              ? "bg-uplight-blue/10 text-uplight-blue"
              : "bg-surface text-muted"
          }
        >
          {intentBonus > 0 ? `+${intentBonus} bonus` : "No bonus yet"}
        </Badge>
      }
      summary={
        <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted">
          <span>
            Base{" "}
            <strong className="tabular-nums text-uplight-black">
              {baseScore ?? "—"}
            </strong>
          </span>
          <span>
            Intent{" "}
            <strong className="tabular-nums text-uplight-black">
              +{intentBonus}
            </strong>
          </span>
          <span>
            Total{" "}
            <strong className="tabular-nums text-uplight-blue">{totalScore}</strong>
          </span>
          <span>
            Criteria met{" "}
            <strong className="tabular-nums text-uplight-black">
              {awardedCount}
            </strong>
            /{breakdown.length}
          </span>
          <span className="text-xs text-muted">Click to view breakdown</span>
        </div>
      }
    >
      <p className="mb-4 text-sm text-muted">
        Bonuses sit on top of the base engagement score. Window is the 14 days
        ending on the latest activity date in the CSV export.
      </p>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-muted">
              <th className="pb-2 pr-3 font-medium">Parameter</th>
              <th className="pb-2 pr-3 font-medium">Threshold</th>
              <th className="pb-2 pr-3 font-medium">Observed</th>
              <th className="pb-2 font-medium text-right">Score</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {breakdown.map((item) => (
              <tr
                key={item.parameter}
                className={item.awarded ? "text-uplight-black" : "text-muted"}
              >
                <td className="py-2.5 pr-3 font-medium">{item.parameter}</td>
                <td className="py-2.5 pr-3">{item.threshold}</td>
                <td className="py-2.5 pr-3 tabular-nums">{item.observed}</td>
                <td className="py-2.5 text-right tabular-nums font-semibold">
                  {item.awarded ? `+${item.points}` : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </CollapsibleCard>
  );
}
