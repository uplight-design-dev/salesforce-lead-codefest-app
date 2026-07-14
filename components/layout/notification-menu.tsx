"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Bell, Cloud, Database, FileSpreadsheet } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { DataSource } from "@/lib/types/data-source";

const REASON_COPY: Record<NonNullable<DataSource["reason"]>, string> = {
  not_connected: "Salesforce not connected — using fallback",
  empty_report: "Salesforce report returned no rows — using fallback",
  fetch_error: "Salesforce fetch failed — using fallback",
  report_not_configured: "Salesforce report not configured — using fallback",
};

const KIND_META: Record<
  DataSource["kind"],
  {
    Icon: typeof Cloud;
    accent: string;
    dot: string;
    summary: string;
  }
> = {
  salesforce: {
    Icon: Cloud,
    accent: "bg-emerald-50 text-emerald-800",
    dot: "bg-uplight-green",
    summary: "Live sandbox report data",
  },
  csv: {
    Icon: FileSpreadsheet,
    accent: "bg-amber-50 text-amber-900",
    dot: "bg-amber-500",
    summary: "Using backup CSV file",
  },
  mock: {
    Icon: Database,
    accent: "bg-surface text-muted",
    dot: "bg-muted",
    summary: "Using demo mock data",
  },
};

type NotificationMenuProps = {
  source?: DataSource;
};

export function NotificationMenu({ source }: NotificationMenuProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const panelId = useId();

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const meta = source ? KIND_META[source.kind] : null;
  const Icon = meta?.Icon ?? Bell;
  const showDot = Boolean(source);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        className={cn(
          "relative rounded-xl border border-border p-3 text-muted transition-colors hover:bg-surface hover:text-uplight-black",
          open && "bg-surface text-uplight-black"
        )}
        aria-label="Notifications"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((value) => !value)}
      >
        <Bell className="h-5 w-5" />
        {showDot && (
          <span
            className={cn(
              "absolute right-2 top-2 h-2.5 w-2.5 rounded-full",
              meta?.dot ?? "bg-uplight-green"
            )}
          />
        )}
      </button>

      {open && (
        <div
          id={panelId}
          role="dialog"
          aria-label="Notifications"
          className="absolute right-0 z-50 mt-2 w-[22rem] overflow-hidden rounded-xl border border-border bg-white shadow-lg"
        >
          <div className="border-b border-border px-4 py-3">
            <p className="text-sm font-semibold">Notifications</p>
            <p className="text-xs text-muted">Data feed and connection status</p>
          </div>

          {source && meta ? (
            <div className="p-3">
              <div className={cn("rounded-lg p-3", meta.accent)}>
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/70">
                    <Icon className="h-4 w-4" aria-hidden />
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-wide opacity-80">
                      Data source
                    </p>
                    <p className="mt-0.5 text-sm font-semibold">{source.label}</p>
                    <p className="mt-1 text-xs opacity-90">{meta.summary}</p>
                    <p className="mt-2 break-all text-xs opacity-80">{source.detail}</p>
                    {source.reason && (
                      <p className="mt-2 text-xs opacity-80">
                        {REASON_COPY[source.reason]}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="px-4 py-6 text-sm text-muted">
              No data-source updates on this page.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
