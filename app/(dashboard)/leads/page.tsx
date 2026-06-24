import { LeadTable } from "@/components/leads/lead-table";
import { Header } from "@/components/layout/header";
import { PageContent } from "@/components/layout/page-content";
import { getLeads } from "@/lib/salesforce/reports";

export default async function LeadsPage() {
  const leads = await getLeads();

  return (
    <>
      <Header
        title="Leads"
        description="Engaged contacts synced from the Salesforce report [SDR] 2026-Engaged Contacts."
      />
      <PageContent>
        <LeadTable leads={leads} />
      </PageContent>
    </>
  );
}
