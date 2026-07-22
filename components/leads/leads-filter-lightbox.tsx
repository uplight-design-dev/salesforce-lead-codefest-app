"use client";

import Link from "next/link";
import { useEffect, useId } from "react";
import { X } from "lucide-react";
import {
  MOMENTUM_DOTS,
  MOMENTUM_LABELS,
  MOMENTUM_STYLES,
  STATUS_LABELS,
  STATUS_STYLES,
} from "@/lib/constants/status";
import {
  LEAD_FILTERS,
  type LeadFilterKey,
} from "@/lib/leads/filters";
import type { Lead } from "@/lib/types/lead";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils/cn";

type LeadsFilterLightboxProps = {
  open: boolean;
  filterKey: LeadFilterKey | null;
  leads: Lead[];
  onClose: () => void;
};

export function LeadsFilterLightbox({
  open,
  filterKey,
  leads,
  onClose,
}: LeadsFilterLightboxProps) {
  const titleId = useId();
  const definition = filterKey ? LEAD_FILTERS[filterKey] : null;

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  if (!open || !definition) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close lead list"
        className="absolute inset-0 bg-uplight-black/50 backdrop-blur-[2px]"
        onClick={onClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-10 flex max-h-[min(88vh,52rem)] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
      >
        <div className="flex items-start justify-between gap-4 border-b border-border px-6 py-5">
          <div className="min-w-0">
            <p id={titleId} className="text-xl font-semibold tracking-tight">
              {definition.title}
            </p>
            <p className="mt-1 text-sm text-muted">
              {definition.description} · {leads.length.toLocaleString()} lead
              {leads.length === 1 ? "" : "s"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-muted transition-colors hover:bg-surface hover:text-uplight-black"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-auto">
          {leads.length === 0 ? (
            <div className="px-6 py-16 text-center text-sm text-muted">
              No leads match this filter in the current dataset.
            </div>
          ) : (
            <table className="w-full text-[15px]">
              <thead className="sticky top-0 bg-surface">
                <tr className="text-left text-sm text-muted">
                  <th className="px-6 py-3 font-medium">Lead</th>
                  <th className="px-6 py-3 font-medium">Company</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                  <th className="px-6 py-3 font-medium">Owner</th>
                  <th className="px-6 py-3 font-medium">Momentum</th>
                  <th className="px-6 py-3 font-medium">Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {leads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-surface/60">
                    <td className="px-6 py-3">
                      <Link
                        href={`/leads/${lead.id}`}
                        className="font-semibold text-uplight-blue hover:underline"
                        onClick={onClose}
                      >
                        {lead.name}
                      </Link>
                      {lead.status === "new" && (
                        <span className="ml-2 inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                          New
                        </span>
                      )}
                      <p className="text-sm text-muted">{lead.email}</p>
                    </td>
                    <td className="px-6 py-3">{lead.company}</td>
                    <td className="px-6 py-3">
                      <Badge
                        className={cn(
                          "px-3 py-1 text-sm",
                          STATUS_STYLES[lead.status]
                        )}
                      >
                        {STATUS_LABELS[lead.status]}
                      </Badge>
                    </td>
                    <td className="px-6 py-3">{lead.owner}</td>
                    <td className="px-6 py-3">
                      <span
                        className={cn(
                          "inline-flex items-center gap-2",
                          MOMENTUM_STYLES[lead.momentum]
                        )}
                      >
                        <span
                          className={cn(
                            "h-2.5 w-2.5 rounded-full",
                            MOMENTUM_DOTS[lead.momentum]
                          )}
                        />
                        {MOMENTUM_LABELS[lead.momentum]}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-lg font-bold tabular-nums">
                      {lead.engagementScore}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
