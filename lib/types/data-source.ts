/** Where dashboard lead/pipeline rows are currently coming from. */
export type DataSourceKind = "salesforce" | "csv" | "mock";

export type DataSource = {
  kind: DataSourceKind;
  /** Short label for UI badges. */
  label: string;
  /** Extra detail (report name, filename, or fallback reason). */
  detail: string;
  /** Why fallback was used, when not live Salesforce. */
  reason?:
    | "not_connected"
    | "empty_report"
    | "fetch_error"
    | "report_not_configured";
};
