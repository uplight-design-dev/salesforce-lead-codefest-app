"use client";

import type { FunnelStage } from "@/lib/types/lead";
import { cn } from "@/lib/utils/cn";

type FunnelChartProps = {
  stages: FunnelStage[];
  conversionRate: number;
  onStageClick?: (label: string) => void;
  activeStageLabel?: string | null;
};

export function FunnelChart({
  stages,
  conversionRate,
  onStageClick,
  activeStageLabel,
}: FunnelChartProps) {
  const lastIndex = stages.length - 1;
  const clickable = Boolean(onStageClick);

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
          {clickable ? " · Click a stage to view leads" : null}
        </p>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center gap-px py-10">
        {stages.map((stage, i) => {
          const isLast = i === lastIndex;
          const widthPercent =
            stages.length <= 1 ? 100 : 100 - (i / lastIndex) * 58;
          const isActive = activeStageLabel === stage.label;

          const className = cn(
            "relative flex h-16 shrink-0 items-center justify-between gap-3 px-4 transition md:h-[4.75rem] md:px-5",
            isLast ? "bg-uplight-green text-uplight-blue" : "bg-white text-uplight-black",
            clickable &&
              "cursor-pointer hover:brightness-[0.97] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white",
            isActive && "ring-2 ring-white ring-offset-2 ring-offset-uplight-blue"
          );

          const style = {
            width: `${widthPercent}%`,
            animation: "funnel-stage-in 520ms ease-out both",
            animationDelay: `${i * 90}ms`,
          } as const;

          const content = (
            <>
              <p className="min-w-0 truncate text-xl font-semibold tracking-tight md:text-2xl">
                {stage.label}
              </p>
              <span className="shrink-0 text-xl font-semibold tracking-tight tabular-nums md:text-2xl">
                {stage.count.toLocaleString()}
              </span>
            </>
          );

          if (clickable) {
            return (
              <button
                key={stage.label}
                type="button"
                className={className}
                style={style}
                onClick={() => onStageClick?.(stage.label)}
                aria-pressed={isActive}
              >
                {content}
              </button>
            );
          }

          return (
            <div key={stage.label} className={className} style={style}>
              {content}
            </div>
          );
        })}
      </div>
    </div>
  );
}
