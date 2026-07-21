import type { LeadStatus, Momentum } from "@/lib/types/lead";

export const LEAD_STATUSES: LeadStatus[] = [
  "new",
  "engaged",
  "mql",
  "assigned",
  "contacted",
  "sql",
  "opportunity",
  "nurturing",
  "stalled",
  "closed_won",
  "closed_lost",
];

export const STATUS_LABELS: Record<LeadStatus, string> = {
  new: "New Lead",
  engaged: "Engaged",
  mql: "MQL",
  assigned: "Assigned",
  contacted: "Contacted",
  sql: "SQL",
  opportunity: "Opportunity",
  nurturing: "Nurturing",
  stalled: "Stalled / At Risk",
  closed_won: "Closed Won",
  closed_lost: "Closed Lost",
};

export const STATUS_STYLES: Record<LeadStatus, string> = {
  new: "bg-slate-100 text-slate-700",
  engaged: "bg-blue-50 text-uplight-blue",
  mql: "bg-emerald-50 text-emerald-700",
  assigned: "bg-violet-50 text-violet-700",
  contacted: "bg-sky-50 text-sky-700",
  sql: "bg-uplight-navy/10 text-uplight-navy",
  opportunity: "bg-uplight-blue/10 text-uplight-blue",
  nurturing: "bg-amber-50 text-amber-700",
  stalled: "bg-red-50 text-red-700",
  closed_won: "bg-uplight-green/20 text-emerald-800",
  closed_lost: "bg-gray-100 text-gray-500",
};

export const MOMENTUM_LABELS: Record<Momentum, string> = {
  accelerating: "Accelerating",
  stalled: "Stalled",
  at_risk: "At Risk",
};

export const MOMENTUM_STYLES: Record<Momentum, string> = {
  accelerating: "text-emerald-600",
  stalled: "text-amber-600",
  at_risk: "text-red-600",
};

export const MOMENTUM_DOTS: Record<Momentum, string> = {
  accelerating: "bg-emerald-500",
  stalled: "bg-amber-500",
  at_risk: "bg-red-500",
};
