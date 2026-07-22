import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { SettingsCsvUpload } from "@/components/settings/settings-csv-upload";
import type { CsvSourceMeta } from "@/lib/data/csv-leads";
import type {
  ProbeCheck,
  ProbeCheckStatus,
  SalesforceProbeResult,
} from "@/lib/salesforce/probe";

type SettingsIntegrationsProps = {
  salesforceConnected: boolean;
  googleAnalyticsConfigured: boolean;
  salesforceReportsConfigured: boolean;
  salesforceRedirectUri: string;
  salesforceLoginUrl: string;
  salesforceProbe?: SalesforceProbeResult | null;
  connected?: boolean;
  error?: string;
  warning?: string;
  csvMeta: CsvSourceMeta;
  csvAdminAuthenticated: boolean;
};

const STATUS_STYLES: Record<ProbeCheckStatus, string> = {
  ok: "bg-uplight-green/20 text-emerald-800",
  empty: "bg-amber-100 text-amber-900",
  missing: "bg-amber-100 text-amber-900",
  forbidden: "bg-red-100 text-red-800",
  error: "bg-red-100 text-red-800",
  not_configured: "bg-surface text-muted",
};

const STATUS_LABELS: Record<ProbeCheckStatus, string> = {
  ok: "Pulled",
  empty: "Empty",
  missing: "Not in sandbox",
  forbidden: "No access",
  error: "Failed",
  not_configured: "Not configured",
};

function ProbeRow({ check }: { check: ProbeCheck }) {
  return (
    <div className="rounded-lg border border-border bg-white px-3 py-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium">{check.label}</p>
          <p className="mt-1 text-xs text-muted">{check.detail}</p>
        </div>
        <Badge className={`shrink-0 ${STATUS_STYLES[check.status]}`}>
          {STATUS_LABELS[check.status]}
          {typeof check.count === "number" ? ` · ${check.count}` : ""}
        </Badge>
      </div>
    </div>
  );
}

export function SettingsIntegrations({
  salesforceConnected,
  googleAnalyticsConfigured,
  salesforceReportsConfigured,
  salesforceRedirectUri,
  salesforceLoginUrl,
  salesforceProbe,
  connected,
  error,
  warning,
  csvMeta,
  csvAdminAuthenticated,
}: SettingsIntegrationsProps) {
  const bannerTone =
    salesforceProbe && !salesforceProbe.dashboardReady
      ? "border-amber-200 bg-amber-50 text-amber-950"
      : "border-uplight-green/30 bg-uplight-green/10 text-emerald-800";

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {connected && (
        <div className={`rounded-lg border px-4 py-3 text-sm ${bannerTone}`}>
          <p className="font-medium">Salesforce connected successfully.</p>
          {salesforceProbe ? (
            <div className="mt-2 space-y-1 text-sm opacity-90">
              <p>
                Dashboard report:{" "}
                <strong>{STATUS_LABELS[salesforceProbe.report.status]}</strong>
                {" — "}
                {salesforceProbe.report.detail}
              </p>
              <p>
                Lead API:{" "}
                <strong>{STATUS_LABELS[salesforceProbe.leads.status]}</strong>
                {" — "}
                {salesforceProbe.leads.detail}
              </p>
              {!salesforceProbe.dashboardReady && (
                <p className="mt-2">
                  OAuth works, but the app cannot load live dashboard rows yet —
                  overview/leads will keep using the backup CSV until the
                  engaged-contacts report is available in this sandbox.
                </p>
              )}
            </div>
          ) : (
            <p className="mt-1 opacity-90">
              Checking what this connection can read from the sandbox…
            </p>
          )}
          {warning && <p className="mt-2 text-amber-800">{warning}</p>}
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}

      <section>
        <h2 className="mb-1 text-lg font-semibold">Integrations</h2>
        <p className="mb-5 text-sm text-muted">
          All OAuth and API credentials are stored server-side. Secrets never reach the browser.
        </p>

        <div className="space-y-4">
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">Salesforce</h3>
                <p className="mt-1 text-sm text-muted">
                  OAuth connection for leads, opportunities, and report data.
                </p>
              </div>
              <Badge
                className={
                  salesforceConnected
                    ? "bg-uplight-green/20 text-emerald-800"
                    : "bg-surface text-muted"
                }
              >
                {salesforceConnected ? "Connected" : "Not connected"}
              </Badge>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <a
                href="/api/salesforce/connect"
                className="inline-flex rounded-lg bg-uplight-blue px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-uplight-navy"
              >
                {salesforceConnected ? "Reconnect Salesforce" : "Connect Salesforce"}
              </a>
              {salesforceReportsConfigured && (
                <span className="text-xs text-uplight-green">
                  [SDR] 2026-Engaged Contacts report configured
                </span>
              )}
            </div>

            {salesforceConnected && salesforceProbe && (
              <div className="mt-4 rounded-lg border border-border bg-surface/60 p-4">
                <p className="text-sm font-medium">What this connection can pull</p>
                <p className="mt-1 text-xs text-muted break-all">
                  Instance: {salesforceProbe.instanceUrl}
                </p>
                <div className="mt-3 space-y-2">
                  <ProbeRow check={salesforceProbe.report} />
                  <ProbeRow check={salesforceProbe.leads} />
                </div>
                {!salesforceProbe.dashboardReady && (
                  <p className="mt-3 text-xs text-amber-800">
                    Tip: open the report in the partial2 sandbox UI. If it 404s
                    there too, clone/share it into this org and update{" "}
                    <code className="rounded bg-white px-1">
                      SALESFORCE_ENGAGED_CONTACTS_REPORT_ID
                    </code>{" "}
                    to the sandbox report ID.
                  </p>
                )}
              </div>
            )}

            <div className="mt-4 rounded-lg border border-border bg-surface/60 p-4 text-sm">
              <p className="font-medium">Connected App callback URL</p>
              <p className="mt-1 text-muted">
                If you see{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-xs">
                  redirect_uri_mismatch
                </code>
                , add this exact URL to your Salesforce Connected App under{" "}
                <strong>OAuth Settings → Callback URL</strong>:
              </p>
              <code className="mt-2 block break-all rounded bg-surface px-2 py-1.5 text-xs">
                {salesforceRedirectUri}
              </code>
              <p className="mt-2 text-xs text-muted">
                OAuth uses your org login URL:{" "}
                <code className="rounded bg-surface px-1 py-0.5 break-all">{salesforceLoginUrl}</code>
                . External Client Apps may require org My Domain instead of test.salesforce.com.
              </p>
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">Google Analytics</h3>
                <p className="mt-1 text-sm text-muted">
                  uplight.com page views, sessions, and engagement for lead scoring.
                </p>
              </div>
              <Badge
                className={
                  googleAnalyticsConfigured
                    ? "bg-uplight-green/20 text-emerald-800"
                    : "bg-surface text-muted"
                }
              >
                {googleAnalyticsConfigured ? "Configured" : "Not configured"}
              </Badge>
            </div>

            <p className="mt-4 text-sm text-muted">
              Set{" "}
              <code className="rounded bg-surface px-1.5 py-0.5 text-xs">
                GOOGLE_ANALYTICS_PROPERTY_ID
              </code>
              ,{" "}
              <code className="rounded bg-surface px-1.5 py-0.5 text-xs">
                GOOGLE_ANALYTICS_CLIENT_EMAIL
              </code>
              , and{" "}
              <code className="rounded bg-surface px-1.5 py-0.5 text-xs">
                GOOGLE_ANALYTICS_PRIVATE_KEY
              </code>{" "}
              in your environment. The dashboard uses mock data until credentials are added.
            </p>
          </Card>
        </div>
      </section>

      <section>
        <h2 className="mb-1 text-lg font-semibold">Data refresh</h2>
        <p className="mb-5 text-sm text-muted">
          Until Salesforce sandbox holds enough data, refresh the dashboard from
          a Lead Tracker CSV export.
        </p>
        <SettingsCsvUpload
          initialMeta={csvMeta}
          initiallyAuthenticated={csvAdminAuthenticated}
        />
      </section>
    </div>
  );
}
