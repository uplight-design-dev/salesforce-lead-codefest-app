import { CopilotChat } from "@/components/copilot/copilot-chat";
import { Header } from "@/components/layout/header";
import { PageContent } from "@/components/layout/page-content";

export default function CopilotPage() {
  return (
    <>
      <Header
        title="AI Deal Copilot"
        description="Ask natural-language questions about leads, pipeline health, and conversion probability."
      />
      <PageContent className="flex flex-col">
        <CopilotChat />
      </PageContent>
    </>
  );
}
