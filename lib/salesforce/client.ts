/**
 * Server-side Salesforce API client.
 *
 * Handles OAuth token exchange and authenticated REST API calls.
 * The client secret is only used here — never in client components or browser code.
 */

import { getSalesforceConfig } from "./config";
import { getTokens, saveTokens, type SalesforceTokens } from "./token-store";

export type TokenResponse = {
  access_token: string;
  refresh_token: string;
  instance_url: string;
  issued_at: string;
  expires_in: number;
  token_type: string;
};

export type SalesforceQueryResult<T = Record<string, unknown>> = {
  totalSize: number;
  done: boolean;
  records: T[];
};

type SalesforceClientOptions = {
  accessToken: string;
  instanceUrl: string;
};

/**
 * Step 1 of OAuth: exchange the authorization code for access + refresh tokens.
 * Called from the callback route after the user approves access in Salesforce.
 */
export async function exchangeCodeForTokens(
  code: string,
  codeVerifier: string
): Promise<SalesforceTokens> {
  const config = getSalesforceConfig();

  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    client_id: config.clientId,
    client_secret: config.clientSecret,
    redirect_uri: config.redirectUri,
    code_verifier: codeVerifier,
  });

  const response = await fetch(
    `${config.loginUrl}/services/oauth2/token`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    }
  );

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `Salesforce token exchange failed (${response.status}): ${errorBody}`
    );
  }

  const data = (await response.json()) as TokenResponse;

  const tokens: SalesforceTokens = {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    instanceUrl: data.instance_url,
    issuedAt: Number(data.issued_at),
    expiresIn: data.expires_in,
  };

  await saveTokens(tokens);
  return tokens;
}

/**
 * Step 2 (future): refresh an expired access token using the stored refresh token.
 * TODO: Call this automatically before API requests when access token is near expiry.
 */
export async function refreshAccessToken(): Promise<SalesforceTokens> {
  const existing = await getTokens();
  if (!existing?.refreshToken) {
    throw new Error("No refresh token available. User must reconnect Salesforce.");
  }

  const config = getSalesforceConfig();

  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: existing.refreshToken,
    client_id: config.clientId,
    client_secret: config.clientSecret,
  });

  const response = await fetch(
    `${config.loginUrl}/services/oauth2/token`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    }
  );

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `Salesforce token refresh failed (${response.status}): ${errorBody}`
    );
  }

  const data = (await response.json()) as TokenResponse;

  const tokens: SalesforceTokens = {
    accessToken: data.access_token,
    refreshToken: data.refresh_token ?? existing.refreshToken,
    instanceUrl: data.instance_url ?? existing.instanceUrl,
    issuedAt: Number(data.issued_at),
    expiresIn: data.expires_in,
  };

  await saveTokens(tokens);
  return tokens;
}

/** Returns an authenticated client using stored tokens, or null if not connected. */
export async function getSalesforceClient(): Promise<SalesforceClient | null> {
  const tokens = await getTokens();
  if (!tokens) return null;

  return new SalesforceClient({
    accessToken: tokens.accessToken,
    instanceUrl: tokens.instanceUrl,
  });
}

/**
 * Thin wrapper around the Salesforce REST API for SOQL queries.
 */
export class SalesforceClient {
  private accessToken: string;
  private instanceUrl: string;

  constructor(options: SalesforceClientOptions) {
    this.accessToken = options.accessToken;
    this.instanceUrl = options.instanceUrl.replace(/\/$/, "");
  }

  /**
   * Executes a SOQL query against the Salesforce REST API.
   * GET /services/data/v59.0/query?q={encoded SOQL}
   */
  async query<T = Record<string, unknown>>(
    soql: string
  ): Promise<SalesforceQueryResult<T>> {
    const url = new URL(`${this.instanceUrl}/services/data/v59.0/query`);
    url.searchParams.set("q", soql);

    const response = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(
        `Salesforce query failed (${response.status}): ${errorBody}`
      );
    }

    return (await response.json()) as SalesforceQueryResult<T>;
  }

  /**
   * Fetches a Salesforce report via the Analytics REST API.
   * GET /services/data/v59.0/analytics/reports/{reportId}
   */
  async fetchReport<T = SalesforceReportResponse>(
    reportId: string
  ): Promise<T> {
    const response = await fetch(
      `${this.instanceUrl}/services/data/v59.0/analytics/reports/${reportId}`,
      {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(
        `Salesforce report fetch failed (${response.status}): ${errorBody}`
      );
    }

    return (await response.json()) as T;
  }
}

export type SalesforceReportDataCell = {
  label: string;
  value?: string | number | null;
};

export type SalesforceReportRow = {
  dataCells: SalesforceReportDataCell[];
};

export type SalesforceReportResponse = {
  attributes?: {
    reportName?: string;
    reportId?: string;
  };
  reportMetadata?: {
    detailColumns?: Array<{ name?: string; label?: string }>;
  };
  factMap?: Record<
    string,
    {
      rows?: SalesforceReportRow[];
    }
  >;
};
