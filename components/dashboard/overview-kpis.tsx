"use client";

import { useMemo, useState } from "react";
import { LeadsFilterLightbox } from "@/components/leads/leads-filter-lightbox";
import { StatCard } from "@/components/ui/stat-card";
import type { OverviewKpi } from "@/lib/data/csv-metrics";
import {
  filterKeyFromKpiLabel,
  filterLeads,
  type LeadFilterKey,
} from "@/lib/leads/filters";
import { sortLeadsForDisplay } from "@/lib/leads/sort-leads";
import type { Lead } from "@/lib/types/lead";

type OverviewKpisProps = {
  kpis: OverviewKpi[];
  leads: Lead[];
};

export function OverviewKpis({ kpis, leads }: OverviewKpisProps) {
  const [activeFilter, setActiveFilter] = useState<LeadFilterKey | null>(null);

  const filteredLeads = useMemo(() => {
    if (!activeFilter) return [];
    return sortLeadsForDisplay(filterLeads(leads, activeFilter));
  }, [activeFilter, leads]);

  return (
    <>
      <div className="grid gap-4 xl:grid-cols-5">
        {kpis.map((kpi) => {
          const filterKey = filterKeyFromKpiLabel(kpi.label);
          const isActive = filterKey !== null && activeFilter === filterKey;

          if (!filterKey) {
            return (
              <StatCard
                key={kpi.label}
                label={kpi.label}
                value={kpi.value}
                subtext={kpi.subtext}
                trend={kpi.trend}
              />
            );
          }

          return (
            <button
              key={kpi.label}
              type="button"
              onClick={() => setActiveFilter(filterKey)}
              className="rounded-2xl text-left transition hover:-translate-y-0.5 hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-uplight-blue"
              aria-pressed={isActive}
            >
              <StatCard
                label={kpi.label}
                value={kpi.value}
                subtext={kpi.subtext ?? "Click to view leads"}
                trend={kpi.trend}
                className={
                  isActive
                    ? "ring-2 ring-uplight-blue/40"
                    : "cursor-pointer hover:border-uplight-blue/30"
                }
              />
            </button>
          );
        })}
      </div>

      <LeadsFilterLightbox
        open={activeFilter !== null}
        filterKey={activeFilter}
        leads={filteredLeads}
        onClose={() => setActiveFilter(null)}
      />
    </>
  );
}
