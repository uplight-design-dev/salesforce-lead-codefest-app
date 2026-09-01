"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  DASHBOARD_PERIODS,
  type PeriodKey,
} from "@/lib/leads/period";

type PeriodSelectorProps = {
  active: PeriodKey;
};

export function PeriodSelector({ active }: PeriodSelectorProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  return (
    <div
      className="inline-flex flex-wrap items-center gap-1 rounded-lg border border-border bg-white p-1"
      role="group"
      aria-label="Dashboard timeline"
    >
      {DASHBOARD_PERIODS.map((period) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set("period", period.key);
        const href = `${pathname}?${params.toString()}`;
        const isActive = active === period.key;

        return (
          <Link
            key={period.key}
            href={href}
            className={
              isActive
                ? "rounded-md bg-uplight-navy px-3 py-1.5 text-sm font-medium text-white"
                : "rounded-md px-3 py-1.5 text-sm font-medium text-muted hover:bg-black/5 hover:text-uplight-black"
            }
            aria-current={isActive ? "page" : undefined}
          >
            {period.label}
          </Link>
        );
      })}
    </div>
  );
}
