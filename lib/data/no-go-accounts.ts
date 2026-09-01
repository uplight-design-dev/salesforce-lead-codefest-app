/**
 * Do Not Prospect / No-Go Accounts list.
 * Used as the SQL gate: MQL-qualified leads at these accounts are not SQL-eligible.
 * Sales Dev may extend this list or add more SQL parameters later.
 */

export type NoGoAccount = {
  utility: string;
  salesDirector: string;
  reason: string;
  /** Normalized match tokens (company name variants). */
  aliases: string[];
};

export const NO_GO_ACCOUNTS: NoGoAccount[] = [
  {
    utility: "AES Indiana",
    salesDirector: "Devin Sorgi",
    reason: "",
    aliases: ["aes indiana", "aes ind"],
  },
  {
    utility: "AES Ohio",
    salesDirector: "Devin Sorgi",
    reason: "",
    aliases: ["aes ohio"],
  },
  {
    utility: "Consumers Energy",
    salesDirector: "Chad Ihrig",
    reason: "",
    aliases: ["consumers energy"],
  },
  {
    utility: "HECO",
    salesDirector: "Scot MacPherson",
    reason: "",
    aliases: ["heco", "hawaiian electric"],
  },
  {
    utility: "Xcel",
    salesDirector: "Scot MacPherson",
    reason: "",
    aliases: ["xcel energy", "xcel"],
  },
];

function normalizeCompany(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[.,]/g, " ")
    .replace(/\s+/g, " ");
}

export function matchNoGoAccount(company: string): NoGoAccount | null {
  const normalized = normalizeCompany(company);
  if (!normalized) return null;

  for (const account of NO_GO_ACCOUNTS) {
    for (const alias of account.aliases) {
      if (normalized === alias || normalized.includes(alias)) {
        return account;
      }
    }
  }

  return null;
}

export function isNoGoAccount(company: string): boolean {
  return matchNoGoAccount(company) !== null;
}

export function getNoGoAccounts(): NoGoAccount[] {
  return NO_GO_ACCOUNTS;
}
