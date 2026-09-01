/**
 * Dashboard viewing timeline presets.
 * Anchored to `asOf` (typically latest activity in the export) so CSV-relative
 * windows stay meaningful when the tracker is not "today".
 */

export type PeriodKey = "year" | "quarter" | "month" | "14d";

export type PeriodDefinition = {
  key: PeriodKey;
  label: string;
};

export const DASHBOARD_PERIODS: PeriodDefinition[] = [
  { key: "year", label: "This Year" },
  { key: "quarter", label: "This Quarter" },
  { key: "month", label: "This Month" },
  { key: "14d", label: "Last 14 Days" },
];

export const DEFAULT_PERIOD: PeriodKey = "14d";

export function parsePeriodKey(value: string | string[] | undefined): PeriodKey {
  const raw = Array.isArray(value) ? value[0] : value;
  if (raw === "year" || raw === "quarter" || raw === "month" || raw === "14d") {
    return raw;
  }
  return DEFAULT_PERIOD;
}

export function periodLabel(key: PeriodKey): string {
  return DASHBOARD_PERIODS.find((period) => period.key === key)?.label ?? "Last 14 Days";
}

export function getPeriodRange(
  key: PeriodKey,
  asOf: Date = new Date()
): { start: Date; end: Date } {
  const end = new Date(asOf.getFullYear(), asOf.getMonth(), asOf.getDate(), 23, 59, 59, 999);

  if (key === "14d") {
    const start = new Date(end);
    start.setDate(start.getDate() - 13);
    start.setHours(0, 0, 0, 0);
    return { start, end };
  }

  if (key === "month") {
    const start = new Date(end.getFullYear(), end.getMonth(), 1);
    return { start, end };
  }

  if (key === "quarter") {
    const quarterStartMonth = Math.floor(end.getMonth() / 3) * 3;
    const start = new Date(end.getFullYear(), quarterStartMonth, 1);
    return { start, end };
  }

  // This Year
  const start = new Date(end.getFullYear(), 0, 1);
  return { start, end };
}

export function isDateInPeriod(
  isoDate: string,
  key: PeriodKey,
  asOf: Date = new Date()
): boolean {
  if (!isoDate || isoDate === "—") return false;
  const parsed = new Date(isoDate);
  if (Number.isNaN(parsed.getTime())) return false;
  const { start, end } = getPeriodRange(key, asOf);
  const t = parsed.getTime();
  return t >= start.getTime() && t <= end.getTime();
}

export function filterLeadsByPeriod<T extends { lastActivity: string }>(
  leads: T[],
  key: PeriodKey,
  asOf: Date = new Date()
): T[] {
  return leads.filter((lead) => isDateInPeriod(lead.lastActivity, key, asOf));
}

/** Prefer latest lead activity as the as-of anchor when available. */
export function resolveAsOfFromLeads(
  leads: { lastActivity: string }[],
  fallback: Date = new Date()
): Date {
  let latest = 0;
  for (const lead of leads) {
    const t = new Date(lead.lastActivity).getTime();
    if (!Number.isNaN(t) && t > latest) latest = t;
  }
  return latest > 0 ? new Date(latest) : fallback;
}
