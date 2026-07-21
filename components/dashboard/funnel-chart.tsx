import type { FunnelStage } from "@/lib/types/lead";
import { cn } from "@/lib/utils/cn";

type FunnelChartProps = {
  stages: FunnelStage[];
  conversionRate: number;
};

export function FunnelChart({ stages, conversionRate }: FunnelChartProps) {
  const lastIndex = stages.length - 1;

  return (
    <div className="relative flex min-h-[520px] flex-col overflow-hidden rounded-2xl bg-uplight-blue p-8 md:min-h-[560px] md:p-10">
      <div
        style={{
          animation: "funnel-stage-in 520ms ease-out both",
        }}
      >
        <p className="text-2xl font-semibold tracking-tight text-white md:text-3xl">
          Sales Funnel
        </p>
        <p className="mt-1 text-sm text-white/75">
          {conversionRate}% lead → customer conversion
        </p>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center gap-px py-10">
        {stages.map((stage, i) => {
          const isLast = i === lastIndex;
          // Stepped narrowing (widest → narrowest), centered like the reference.
          const widthPercent =
            stages.length <= 1 ? 100 : 100 - (i / lastIndex) * 58;

          return (
            <div
              key={stage.label}
              className={cn(
                "relative flex h-16 shrink-0 items-center justify-between gap-3 px-4 md:h-[4.75rem] md:px-5",
                isLast ? "bg-uplight-green text-uplight-blue" : "bg-white text-uplight-black"
              )}
              style={{
                width: `${widthPercent}%`,
                animation: "funnel-stage-in 520ms ease-out both",
                animationDelay: `${i * 90}ms`,
              }}
            >
              <p className="min-w-0 truncate text-xl font-semibold tracking-tight md:text-2xl">
                {stage.label}
              </p>

              <span className="shrink-0 text-xl font-semibold tracking-tight tabular-nums md:text-2xl">
                {stage.count.toLocaleString()}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
