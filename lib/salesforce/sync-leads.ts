/**
 * Syncs Salesforce records into the app database.
 *
 * For now this fetches records via SOQL and logs them.
 * TODO: Persist each object type to Supabase tables for fast dashboard reads.
 */

import { getSalesforceClient } from "./client";
import {
  LEAD_QUERY,
  SALESFORCE_QUERIES,
  type SalesforceObjectName,
} from "./queries";

export type SyncResult = {
  object: SalesforceObjectName;
  recordCount: number;
};

/**
 * Fetches leads from Salesforce and logs the results.
 * Entry point for lead sync — expand to upsert into Supabase when schema is ready.
 */
export async function syncLeads(): Promise<SyncResult> {
  const client = await getSalesforceClient();
  if (!client) {
    throw new Error(
      "Salesforce is not connected. Complete OAuth before syncing leads."
    );
  }

  const result = await client.query(LEAD_QUERY);

  console.log(
    `[salesforce/sync-leads] Fetched ${result.records.length} Lead records`
  );
  console.log("[salesforce/sync-leads] Records:", JSON.stringify(result.records, null, 2));

  // TODO: Upsert leads into Supabase `leads` table.
  // Example mapping:
  //   salesforce_id  -> record.Id
  //   name           -> record.Name
  //   email          -> record.Email
  //   company        -> record.Company
  //   status         -> record.Status
  //   lead_source    -> record.LeadSource
  //   owner_name     -> record.Owner?.Name
  //   last_modified  -> record.LastModifiedDate
  //   synced_at      -> new Date().toISOString()

  return { object: "Lead", recordCount: result.records.length };
}

/**
 * Syncs all placeholder Salesforce objects (Lead, Account, Campaign, etc.).
 * Called after OAuth callback or on a scheduled job.
 */
export async function syncAllObjects(): Promise<SyncResult[]> {
  const client = await getSalesforceClient();
  if (!client) {
    throw new Error(
      "Salesforce is not connected. Complete OAuth before syncing."
    );
  }

  const results: SyncResult[] = [];

  for (const [objectName, soql] of Object.entries(SALESFORCE_QUERIES)) {
    const result = await client.query(soql);

    console.log(
      `[salesforce/sync] Fetched ${result.records.length} ${objectName} records`
    );
    console.log(
      `[salesforce/sync] ${objectName} records:`,
      JSON.stringify(result.records, null, 2)
    );

    // TODO: Upsert ${objectName} records into the matching Supabase table.
    // Create tables: leads, accounts, campaigns, campaign_members, opportunities, tasks

    results.push({
      object: objectName as SalesforceObjectName,
      recordCount: result.records.length,
    });
  }

  return results;
}
