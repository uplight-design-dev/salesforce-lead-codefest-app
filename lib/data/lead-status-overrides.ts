/**
 * Persists lead status edits from the admin lightbox.
 * In-memory + JSON file so changes survive local restarts.
 */

import fs from "fs";
import path from "path";
import type { Lead, LeadStatus } from "@/lib/types/lead";

const OVERRIDES_FILENAME = "lead-status-overrides.json";

export type StatusOverrides = Record<string, LeadStatus>;

let memoryOverrides: StatusOverrides | null = null;

function getOverridesPath(): string {
  return path.join(process.cwd(), ".data", OVERRIDES_FILENAME);
}

function readFromDisk(): StatusOverrides {
  try {
    const filePath = getOverridesPath();
    if (!fs.existsSync(filePath)) return {};
    const raw = fs.readFileSync(filePath, "utf8");
    const parsed = JSON.parse(raw) as StatusOverrides;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeToDisk(overrides: StatusOverrides): void {
  try {
    const filePath = getOverridesPath();
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify(overrides, null, 2), "utf8");
  } catch (error) {
    console.warn("[lead-status-overrides] Could not persist to disk:", error);
  }
}

export function getStatusOverrides(): StatusOverrides {
  if (!memoryOverrides) {
    memoryOverrides = readFromDisk();
  }
  return { ...memoryOverrides };
}

export function setStatusOverrides(updates: StatusOverrides): StatusOverrides {
  const next = { ...getStatusOverrides(), ...updates };
  memoryOverrides = next;
  writeToDisk(next);
  return next;
}

export function applyStatusOverrides(leads: Lead[]): Lead[] {
  const overrides = getStatusOverrides();
  if (Object.keys(overrides).length === 0) return leads;

  return leads.map((lead) => {
    const status = overrides[lead.id];
    return status && status !== lead.status ? { ...lead, status } : lead;
  });
}
