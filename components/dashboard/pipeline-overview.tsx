"use client";

import { useMemo, useState } from "react";
import { Card, CardTitle } from "@/components/ui/card";
import { LeadsFilterLightbox } from "@/components/leads/leads-filter-lightbox";
import type { PipelineStageMetric } from "@/lib/data/csv-metrics";
import {
  filterKeyFromFunnelLabel,
  filterLeads,
  type LeadFilterKey,
} from "@/lib/leads/filters";
import { sortLeadsForDisplay } from "@/lib/leads/sort-leads";
import type { Lead } from "@/lib/types/lead";
import { cn } from "@/lib/utils/cn";

type PipelineOverviewProps = {
  stages: PipelineStageMetric[];
  pipelineValue: {
    amount: string;
    label: string;
    trend: string;
  };
  leads: Lead[];
};

export function PipelineOverview({
  stages,
  pipelineValue,
  leads,
}: PipelineOverviewProps) {
  const [activeFilter, setActiveFilter] = useState<LeadFilterKey | null>(null);

  const filteredLeads = useMemo(() => {
    if (!activeFilter) return [];
    return sortLeadsForDisplay(filterLeads(leads, activeFilter));
  }, [activeFilter, leads]);

  function openStage(label: string) {
    const key = filterKeyFromFunnelLabel(label);
    if (key) setActiveFilter(key);
  }

  return (
    <>
      <Card className="p-4">
        <div className="grid gap-x-5 gap-y-3 xl:grid-cols-[minmax(0,1fr)_13rem]">
          <CardTitle>Pipeline Overview</CardTitle>
          <CardTitle className="xl:border-l xl:border-border xl:pl-5">
            Pipeline Value
          </CardTitle>

          <div className="flex min-w-0 items-start justify-between gap-1">
            {stages.map((stage, index) => {
              const filterKey = filterKeyFromFunnelLabel(stage.label);
              const isActive =
                filterKey !== null && activeFilter === filterKey;

              return (
                <div key={stage.label} className="flex min-w-0 flex-1 items-start">
                  <button
                    type="button"
                    disabled={!filterKey}
                    onClick={() => openStage(stage.label)}
                    className={cn(
                      "min-w-0 flex-1 rounded-lg px-1 py-1 text-left transition",
                      filterKey &&
                        "cursor-pointer hover:bg-surface focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-uplight-blue",
                      isActive && "bg-uplight-blue/5 ring-1 ring-uplight-blue/30"
                    )}
                  >
                    <p className="text-sm font-medium text-muted">{stage.label}</p>
                    <p className="mt-0.5 text-2xl font-bold leading-tight tabular-nums">
                      {stage.count.toLocaleString()}
                    </p>
                    <p className="mt-0.5 min-h-4 text-sm font-medium leading-tight text-emerald-600">
                      {stage.conversionFromPrevious !== undefined
                        ? `${stage.conversionFromPrevious}%`
                        : null}
                    </p>
                  </button>
                  {index < stages.length - 1 && (
                    <span className="hidden shrink-0 self-start px-0.5 pt-px text-lg text-border sm:inline">
                      ›
                    </span>
                  )}
                </div>
              );
            })}
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

      <LeadsFilterLightbox
        open={activeFilter !== null}
        filterKey={activeFilter}
        leads={filteredLeads}
        onClose={() => setActiveFilter(null)}
      />
    </>
  );
}
