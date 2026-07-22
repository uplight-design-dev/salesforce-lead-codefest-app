import type { Lead } from "@/lib/types/lead";

/**
 * Brand-new leads float to the top so SDRs can engage them first.
 * Within each group, higher engagement score wins.
 */
export function sortLeadsForDisplay(leads: Lead[]): Lead[] {
  return [...leads].sort((a, b) => {
    const aIsNew = a.status === "new" ? 0 : 1;
    const bIsNew = b.status === "new" ? 0 : 1;
    if (aIsNew !== bIsNew) return aIsNew - bIsNew;
    return b.engagementScore - a.engagementScore;
  });
}
