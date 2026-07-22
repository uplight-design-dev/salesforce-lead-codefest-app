"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { FileUp, Loader2, Lock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { CsvSourceMeta } from "@/lib/data/csv-leads";
import { cn } from "@/lib/utils/cn";

type SettingsCsvUploadProps = {
  initialMeta: CsvSourceMeta;
  initiallyAuthenticated: boolean;
};

const SOURCE_LABELS: Record<CsvSourceMeta["source"], string> = {
  upload: "Uploaded",
  bundled: "Bundled export",
  env: "Env path",
  missing: "Missing",
};

function formatUploadedAt(value: string | null): string {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString();
}

export function SettingsCsvUpload({
  initialMeta,
  initiallyAuthenticated,
}: SettingsCsvUploadProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const [meta, setMeta] = useState(initialMeta);
  const [authenticated, setAuthenticated] = useState(initiallyAuthenticated);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loggingIn, setLoggingIn] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedName, setSelectedName] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleLogin(event: React.FormEvent) {
    event.preventDefault();
    setLoggingIn(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        setError(data.error ?? "Invalid username or password.");
        return;
      }

      setAuthenticated(true);
      setPassword("");
      setMessage("Admin authenticated — you can upload a CSV.");
    } catch {
      setError("Could not sign in. Try again.");
    } finally {
      setLoggingIn(false);
    }
  }

  async function handleUpload(event: React.FormEvent) {
    event.preventDefault();
    const file = inputRef.current?.files?.[0];
    if (!file) {
      setError("Choose a CSV file first.");
      return;
    }

    setUploading(true);
    setError(null);
    setMessage(null);

    try {
      const body = new FormData();
      body.append("file", file);

      const response = await fetch("/api/admin/csv", {
        method: "POST",
        body,
      });
      const data = (await response.json()) as {
        error?: string;
        meta?: CsvSourceMeta;
        missingOptionalColumns?: string[];
      };

      if (response.status === 401) {
        setAuthenticated(false);
        setError("Admin session expired. Sign in again to upload.");
        return;
      }

      if (!response.ok || !data.meta) {
        setError(data.error ?? "Upload failed.");
        return;
      }

      setMeta(data.meta);
      setSelectedName(null);
      if (inputRef.current) inputRef.current.value = "";

      const optionalNote =
        data.missingOptionalColumns && data.missingOptionalColumns.length > 0
          ? ` Optional columns missing: ${data.missingOptionalColumns.join(", ")}.`
          : "";

      setMessage(
        `Loaded ${data.meta.leadCount.toLocaleString()} leads from ${data.meta.rowCount.toLocaleString()} rows.${optionalNote}`
      );
      router.refresh();
    } catch {
      setError("Could not upload the CSV. Try again.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <Card>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold">Lead Tracker CSV</h3>
          <p className="mt-1 text-sm text-muted">
            Upload a fresh SDR Lead Tracker export when Salesforce sandbox data
            is incomplete. The dashboard will use this file until a full
            Salesforce sync is available.
          </p>
        </div>
        <Badge
          className={
            meta.source === "missing"
              ? "bg-surface text-muted"
              : "bg-uplight-green/20 text-emerald-800"
          }
        >
          {SOURCE_LABELS[meta.source]}
        </Badge>
      </div>

      <div className="mt-4 grid gap-3 rounded-lg border border-border bg-surface/60 p-4 text-sm sm:grid-cols-2">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted">
            Active file
          </p>
          <p className="mt-1 break-all font-medium">{meta.filename}</p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted">
            Last upload
          </p>
          <p className="mt-1 font-medium">{formatUploadedAt(meta.uploadedAt)}</p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted">
            Rows
          </p>
          <p className="mt-1 font-medium tabular-nums">
            {meta.rowCount.toLocaleString()}
          </p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted">
            Unique leads
          </p>
          <p className="mt-1 font-medium tabular-nums">
            {meta.leadCount.toLocaleString()}
          </p>
        </div>
      </div>

      {!authenticated ? (
        <form onSubmit={handleLogin} className="mt-4 space-y-3">
          <div className="flex items-center gap-2 text-sm text-muted">
            <Lock className="h-4 w-4" />
            Admin sign-in required to replace the CSV.
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              type="text"
              name="username"
              autoComplete="username"
              placeholder="Username or email"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-[15px] outline-none ring-uplight-blue/30 focus:ring-2"
              required
            />
            <input
              type="password"
              name="password"
              autoComplete="current-password"
              placeholder="Password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-[15px] outline-none ring-uplight-blue/30 focus:ring-2"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loggingIn}
            className="inline-flex items-center gap-2 rounded-lg bg-uplight-blue px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-uplight-navy disabled:opacity-60"
          >
            {loggingIn ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Sign in to upload
          </button>
        </form>
      ) : (
        <form onSubmit={handleUpload} className="mt-4 space-y-3">
          <label
            className={cn(
              "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-white px-4 py-8 text-center transition",
              "hover:border-uplight-blue/40 hover:bg-uplight-blue/[0.02]"
            )}
          >
            <FileUp className="h-6 w-6 text-uplight-blue" />
            <span className="text-sm font-medium">
              {selectedName ?? "Choose Lead Tracker CSV"}
            </span>
            <span className="text-xs text-muted">
              Required columns: Email, Company, Full Name, Lead Status
            </span>
            <input
              ref={inputRef}
              type="file"
              accept=".csv,text/csv"
              className="sr-only"
              onChange={(event) => {
                const file = event.target.files?.[0] ?? null;
                setSelectedName(file?.name ?? null);
                setError(null);
                setMessage(null);
              }}
            />
          </label>

          <button
            type="submit"
            disabled={uploading || !selectedName}
            className="inline-flex items-center gap-2 rounded-lg bg-uplight-blue px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-uplight-navy disabled:opacity-60"
          >
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {uploading ? "Uploading…" : "Upload & refresh dashboard"}
          </button>
        </form>
      )}

      {message && (
        <p className="mt-3 rounded-lg border border-uplight-green/30 bg-uplight-green/10 px-3 py-2 text-sm text-emerald-800">
          {message}
        </p>
      )}
      {error && (
        <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {error}
        </p>
      )}
    </Card>
  );
}
