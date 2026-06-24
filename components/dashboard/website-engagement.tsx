import { Globe } from "lucide-react";
import type { WebsiteEngagement } from "@/lib/types/lead";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";

type WebsiteEngagementProps = {
  pages: WebsiteEngagement[];
};

export function WebsiteEngagementPanel({ pages }: WebsiteEngagementProps) {
  const maxSessions = pages[0]?.sessions ?? 1;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Globe className="h-4 w-4 text-uplight-blue" />
          <CardTitle>uplight.com Engagement</CardTitle>
        </div>
        <span className="text-xs text-muted">Last 7 days · via Google Analytics</span>
      </CardHeader>

      <div className="space-y-3">
        {pages.slice(0, 6).map((page) => (
          <div key={page.pagePath}>
            <div className="mb-1 flex items-center justify-between gap-2 text-sm">
              <span className="truncate font-medium">{page.pagePath}</span>
              <span className="shrink-0 tabular-nums text-muted">
                {page.sessions} sessions
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-surface">
              <div
                className="h-full rounded-full bg-uplight-green"
                style={{ width: `${(page.sessions / maxSessions) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
