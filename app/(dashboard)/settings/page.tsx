import { hasActiveConnection } from "@/lib/salesforce/token-store";
import { isGoogleAnalyticsConfigured } from "@/lib/google-analytics/config";
import { getReportConfig } from "@/lib/salesforce/reports";
import { getSalesforceClient } from "@/lib/salesforce/client";
import { getSalesforceLoginUrl, getSalesforceRedirectUri } from "@/lib/salesforce/config";
import { probeSalesforceAccess } from "@/lib/salesforce/probe";
import { SettingsIntegrations } from "@/components/settings/settings-integrations";
import { Header } from "@/components/layout/header";
import { PageContent } from "@/components/layout/page-content";

type SettingsPageProps = {
  searchParams: Promise<{
    connected?: string;
    error?: string;
    warning?: string;
  }>;
};

export default async function SettingsPage({ searchParams }: SettingsPageProps) {
  const params = await searchParams;
  const oauthSucceeded = params.connected === "true";
  const salesforceConnected = oauthSucceeded || (await hasActiveConnection());

  let salesforceProbe = null;
  if (salesforceConnected) {
    try {
      const client = await getSalesforceClient();
      if (client) {
        salesforceProbe = await probeSalesforceAccess(client);
      }
    } catch (error) {
      console.error("[settings] Salesforce probe failed:", error);
    }
  }

  return (
    <>
      <Header
        title="Settings"
        description="Connect data sources — Salesforce reports and Google Analytics for uplight.com."
      />

      <PageContent>
        <SettingsIntegrations
          salesforceConnected={salesforceConnected}
          googleAnalyticsConfigured={isGoogleAnalyticsConfigured()}
          salesforceReportsConfigured={Boolean(getReportConfig())}
          salesforceRedirectUri={getSalesforceRedirectUri()}
          salesforceLoginUrl={getSalesforceLoginUrl()}
          salesforceProbe={salesforceProbe}
          connected={oauthSucceeded}
          error={params.error ? decodeURIComponent(params.error) : undefined}
          warning={params.warning}
        />
      </PageContent>
    </>
  );
}
