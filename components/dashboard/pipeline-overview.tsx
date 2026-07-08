import { Card, CardTitle } from "@/components/ui/card";
import type { PipelineStageMetric } from "@/lib/data/csv-metrics";

type PipelineOverviewProps = {
  stages: PipelineStageMetric[];
  pipelineValue: {
    amount: string;
    label: string;
    trend: string;
  };
};

export function PipelineOverview({ stages, pipelineValue }: PipelineOverviewProps) {
  return (
    <Card className="p-4">
      <div className="grid gap-x-5 gap-y-3 xl:grid-cols-[minmax(0,1fr)_13rem]">
        <CardTitle>Pipeline Overview</CardTitle>
        <CardTitle className="xl:border-l xl:border-border xl:pl-5">
          Pipeline Value
        </CardTitle>

        <div className="flex min-w-0 items-start justify-between gap-1">
          {stages.map((stage, index) => (
            <div key={stage.label} className="flex min-w-0 flex-1 items-start">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-muted">{stage.label}</p>
                <p className="mt-0.5 text-2xl font-bold leading-tight tabular-nums">
                  {stage.count.toLocaleString()}
                </p>
                <p className="mt-0.5 min-h-4 text-sm font-medium leading-tight text-emerald-600">
                  {stage.conversionFromPrevious !== undefined
                    ? `${stage.conversionFromPrevious}%`
                    : null}
                </p>
              </div>
              {index < stages.length - 1 && (
                <span className="hidden shrink-0 self-start px-0.5 pt-px text-lg text-border sm:inline">
                  ›
                </span>
              )}
            </div>
          ))}
        </div>

        <div className="xl:border-l xl:border-border xl:pl-5">
          <p className="text-2xl font-bold leading-tight tabular-nums">
            {pipelineValue.amount}
          </p>
          <p className="mt-0.5 text-sm text-muted">{pipelineValue.label}</p>
          <p className="mt-1 text-sm font-medium text-emerald-600">
            {pipelineValue.trend}
          </p>
        </div>
      </div>
    </Card>
  );
}
