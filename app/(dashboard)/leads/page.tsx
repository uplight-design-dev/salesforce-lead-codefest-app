import { LeadTable } from "@/components/leads/lead-table";
import { Header } from "@/components/layout/header";
import { PageContent } from "@/components/layout/page-content";
import { getLeadsResult } from "@/lib/salesforce/reports";

export default async function LeadsPage() {
  const { leads, source } = await getLeadsResult();

  return (
    <>
      <Header
        title="Leads"
        description="Engaged contacts from the SDR Lead Tracker — live Salesforce sync when connected."
        dataSource={source}
      />
      <PageContent>
        <LeadTable leads={leads} />
      </PageContent>
    </>
  );
}
