import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

type SettingsIntegrationsProps = {
  salesforceConnected: boolean;
  googleAnalyticsConfigured: boolean;
  salesforceReportsConfigured: boolean;
  salesforceRedirectUri: string;
  salesforceLoginUrl: string;
  connected?: boolean;
  error?: string;
  warning?: string;
};

export function SettingsIntegrations({
  salesforceConnected,
  googleAnalyticsConfigured,
  salesforceReportsConfigured,
  salesforceRedirectUri,
  salesforceLoginUrl,
  connected,
  error,
  warning,
}: SettingsIntegrationsProps) {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {connected && (
        <div className="rounded-lg border border-uplight-green/30 bg-uplight-green/10 px-4 py-3 text-sm text-emerald-800">
          Salesforce connected successfully.
          {warning && <p className="mt-2 text-amber-700">{warning}</p>}
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
                Connect Salesforce
              </a>
              {salesforceReportsConfigured && (
                <span className="text-xs text-uplight-green">
                  [SDR] 2026-Engaged Contacts report configured
                </span>
              )}
            </div>

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
    </div>
  );
}
