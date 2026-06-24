/**
 * Placeholder SOQL queries for Salesforce objects used by the lead dashboard.
 *
 * These queries are executed server-side via the Salesforce REST API.
 * Field selections can be expanded as the dashboard requirements grow.
 */

export const LEAD_QUERY = `
  SELECT Id, Name, Email, Company, Status, LeadSource, Owner.Name, LastModifiedDate
  FROM Lead
  LIMIT 100
`.trim();

export const ACCOUNT_QUERY = `
  SELECT Id, Name, Industry, Type, Owner.Name, LastModifiedDate
  FROM Account
  LIMIT 100
`.trim();

export const CAMPAIGN_QUERY = `
  SELECT Id, Name, Status, Type, StartDate, EndDate, Owner.Name, LastModifiedDate
  FROM Campaign
  LIMIT 100
`.trim();

export const CAMPAIGN_MEMBER_QUERY = `
  SELECT Id, CampaignId, LeadId, ContactId, Status, HasResponded, LastModifiedDate
  FROM CampaignMember
  LIMIT 100
`.trim();

export const OPPORTUNITY_QUERY = `
  SELECT Id, Name, StageName, Amount, CloseDate, AccountId, Owner.Name, LastModifiedDate
  FROM Opportunity
  LIMIT 100
`.trim();

export const TASK_QUERY = `
  SELECT Id, Subject, Status, Priority, ActivityDate, WhoId, WhatId, Owner.Name, LastModifiedDate
  FROM Task
  LIMIT 100
`.trim();

/** All sync queries keyed by Salesforce object name. */
export const SALESFORCE_QUERIES = {
  Lead: LEAD_QUERY,
  Account: ACCOUNT_QUERY,
  Campaign: CAMPAIGN_QUERY,
  CampaignMember: CAMPAIGN_MEMBER_QUERY,
  Opportunity: OPPORTUNITY_QUERY,
  Task: TASK_QUERY,
} as const;

export type SalesforceObjectName = keyof typeof SALESFORCE_QUERIES;
