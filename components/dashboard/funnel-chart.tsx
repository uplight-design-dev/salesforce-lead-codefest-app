import type { FunnelStage } from "@/lib/types/lead";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";

type FunnelChartProps = {
  stages: FunnelStage[];
  conversionRate: number;
};

export function FunnelChart({ stages, conversionRate }: FunnelChartProps) {
  const maxCount = stages[0]?.count ?? 1;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pipeline Visibility</CardTitle>
        <span className="text-sm font-semibold text-uplight-green">
          {conversionRate}% conversion
        </span>
      </CardHeader>

      <div className="space-y-3">
        {stages.map((stage) => {
          const widthPercent = Math.max((stage.count / maxCount) * 100, 8);

          return (
            <div key={stage.label}>
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="font-medium">{stage.label}</span>
                <span className="tabular-nums text-muted">{stage.count}</span>
              </div>
              <div className="h-8 w-full overflow-hidden rounded-md bg-surface">
                <div
                  className="flex h-full items-center rounded-md px-3 text-xs font-semibold text-white transition-all"
                  style={{
                    width: `${widthPercent}%`,
                    backgroundColor: stage.color,
                    minWidth: "3rem",
                  }}
                >
                  {stage.count}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
