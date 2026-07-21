"use client";

import { useEffect, useId, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Lock, X } from "lucide-react";
import { LEAD_STATUSES, STATUS_LABELS } from "@/lib/constants/status";
import type { LeadStatus } from "@/lib/types/lead";
import { cn } from "@/lib/utils/cn";

type AdminLead = {
  id: string;
  name: string;
  company: string;
  email: string;
  status: LeadStatus;
};

type AdminLightboxProps = {
  open: boolean;
  onClose: () => void;
};

export function AdminLightbox({ open, onClose }: AdminLightboxProps) {
  const router = useRouter();
  const titleId = useId();
  const [authenticated, setAuthenticated] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [leads, setLeads] = useState<AdminLead[]>([]);
  const [draftStatuses, setDraftStatuses] = useState<Record<string, LeadStatus>>(
    {}
  );
  const [loadingLeads, setLoadingLeads] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loggingIn, setLoggingIn] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

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

  useEffect(() => {
    if (!open) {
      setUsername("");
      setPassword("");
      setLoginError(null);
      setFormError(null);
      setAuthenticated(false);
      setLeads([]);
      setDraftStatuses({});
    }
  }, [open]);

  async function loadLeads() {
    setLoadingLeads(true);
    setFormError(null);

    try {
      const response = await fetch("/api/admin/leads");
      if (response.status === 401) {
        setAuthenticated(false);
        return;
      }
      if (!response.ok) {
        throw new Error("Could not load leads.");
      }

      const data = (await response.json()) as { leads: AdminLead[] };
      setLeads(data.leads);
      setDraftStatuses(
        Object.fromEntries(data.leads.map((lead) => [lead.id, lead.status]))
      );
      setAuthenticated(true);
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : "Could not load leads."
      );
    } finally {
      setLoadingLeads(false);
    }
  }

  async function handleLogin(event: React.FormEvent) {
    event.preventDefault();
    setLoggingIn(true);
    setLoginError(null);

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        setLoginError(data?.error ?? "Invalid username or password.");
        return;
      }

      setPassword("");
      await loadLeads();
    } catch {
      setLoginError("Could not sign in. Try again.");
    } finally {
      setLoggingIn(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    setFormError(null);

    const updates = leads
      .filter((lead) => draftStatuses[lead.id] !== lead.status)
      .map((lead) => ({
        id: lead.id,
        status: draftStatuses[lead.id],
      }));

    try {
      const response = await fetch("/api/admin/leads", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ updates }),
      });

      if (response.status === 401) {
        setAuthenticated(false);
        return;
      }
      if (!response.ok) {
        throw new Error("Could not save status updates.");
      }

      router.refresh();
      onClose();
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : "Could not save status updates."
      );
    } finally {
      setSaving(false);
    }
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-uplight-black/45 p-4"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="flex max-h-[min(40rem,90vh)] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-border bg-white shadow-2xl"
      >
        <div className="flex items-start justify-between gap-4 border-b border-border px-6 py-5">
          <div>
            <h2 id={titleId} className="text-lg font-semibold">
              {authenticated ? "Update lead status" : "Admin sign in"}
            </h2>
            <p className="mt-1 text-sm text-muted">
              {authenticated
                ? "Change pipeline status for each lead, then save."
                : "Sign in to edit lead statuses."}
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

        {!authenticated ? (
          <form onSubmit={handleLogin} className="space-y-4 px-6 py-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-uplight-blue/8 text-uplight-blue">
              <Lock className="h-5 w-5" />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="admin-username" className="text-sm font-medium">
                Username
              </label>
              <input
                id="admin-username"
                name="username"
                autoComplete="username"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-[15px] outline-none ring-uplight-blue/30 focus:ring-2"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="admin-password" className="text-sm font-medium">
                Password
              </label>
              <input
                id="admin-password"
                name="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-[15px] outline-none ring-uplight-blue/30 focus:ring-2"
                required
              />
            </div>

            {loginError && (
              <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
                {loginError}
              </p>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg px-4 py-2.5 text-sm font-medium text-muted transition-colors hover:bg-surface hover:text-uplight-black"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loggingIn}
                className="inline-flex items-center gap-2 rounded-lg bg-uplight-blue px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-uplight-navy disabled:opacity-60"
              >
                {loggingIn && <Loader2 className="h-4 w-4 animate-spin" />}
                Sign in
              </button>
            </div>
          </form>
        ) : (
          <>
            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
              {loadingLeads ? (
                <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading leads…
                </div>
              ) : (
                <ul className="divide-y divide-border">
                  {leads.map((lead) => (
                    <li
                      key={lead.id}
                      className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-medium">{lead.name}</p>
                        <p className="truncate text-sm text-muted">
                          {lead.company}
                          {lead.email ? ` · ${lead.email}` : ""}
                        </p>
                      </div>
                      <label className="sr-only" htmlFor={`status-${lead.id}`}>
                        Status for {lead.name}
                      </label>
                      <select
                        id={`status-${lead.id}`}
                        value={draftStatuses[lead.id] ?? lead.status}
                        onChange={(event) =>
                          setDraftStatuses((current) => ({
                            ...current,
                            [lead.id]: event.target.value as LeadStatus,
                          }))
                        }
                        className={cn(
                          "w-full shrink-0 rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none ring-uplight-blue/30 focus:ring-2 sm:w-48"
                        )}
                      >
                        {LEAD_STATUSES.map((status) => (
                          <option key={status} value={status}>
                            {STATUS_LABELS[status]}
                          </option>
                        ))}
                      </select>
                    </li>
                  ))}
                </ul>
              )}

              {formError && (
                <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
                  {formError}
                </p>
              )}
            </div>

            <div className="flex justify-end gap-3 border-t border-border px-6 py-4">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg px-4 py-2.5 text-sm font-medium text-muted transition-colors hover:bg-surface hover:text-uplight-black"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving || loadingLeads}
                className="inline-flex items-center gap-2 rounded-lg bg-uplight-blue px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-uplight-navy disabled:opacity-60"
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                Save
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
