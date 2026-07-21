import { NextResponse } from "next/server";
import { hasAdminSession } from "@/lib/admin/session";
import { LEAD_STATUSES } from "@/lib/constants/status";
import { setStatusOverrides } from "@/lib/data/lead-status-overrides";
import { getLeadsResult } from "@/lib/salesforce/reports";
import type { LeadStatus } from "@/lib/types/lead";

function isLeadStatus(value: unknown): value is LeadStatus {
  return (
    typeof value === "string" &&
    (LEAD_STATUSES as string[]).includes(value)
  );
}

export async function GET() {
  if (!(await hasAdminSession())) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { leads } = await getLeadsResult();

  return NextResponse.json({
    leads: leads.map((lead) => ({
      id: lead.id,
      name: lead.name,
      company: lead.company,
      email: lead.email,
      status: lead.status,
    })),
  });
}

export async function PUT(request: Request) {
  if (!(await hasAdminSession())) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  let body: { updates?: { id?: string; status?: string }[] };

  try {
    body = (await request.json()) as {
      updates?: { id?: string; status?: string }[];
    };
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (!Array.isArray(body.updates)) {
    return NextResponse.json(
      { error: "Expected an updates array." },
      { status: 400 }
    );
  }

  const overrides: Record<string, LeadStatus> = {};

  for (const update of body.updates) {
    if (!update?.id || typeof update.id !== "string") {
      return NextResponse.json(
        { error: "Each update needs a lead id." },
        { status: 400 }
      );
    }
    if (!isLeadStatus(update.status)) {
      return NextResponse.json(
        { error: `Invalid status for lead ${update.id}.` },
        { status: 400 }
      );
    }
    overrides[update.id] = update.status;
  }

  setStatusOverrides(overrides);

  return NextResponse.json({ ok: true, updated: Object.keys(overrides).length });
}
