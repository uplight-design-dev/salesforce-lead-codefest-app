import { Megaphone } from "lucide-react";
import type { CampaignAlert } from "@/lib/data/alerts";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type NewCampaignAlertsProps = {
  alerts: CampaignAlert[];
};

export function NewCampaignAlerts({ alerts }: NewCampaignAlertsProps) {
  return (
    <Card className="flex h-full flex-col">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Megaphone className="h-4 w-4 text-uplight-blue" />
          <CardTitle>New Campaign Alerts</CardTitle>
        </div>
        <Badge className="bg-uplight-blue/10 text-uplight-blue">
          {alerts.length} active
        </Badge>
      </CardHeader>

      {alerts.length === 0 ? (
        <p className="text-sm text-muted">No recent campaign alerts.</p>
      ) : (
        <ul className="flex-1 space-y-3">
          {alerts.map((alert) => (
            <li
              key={alert.id}
              className="rounded-lg border border-border bg-surface p-4"
            >
              <div className="mb-2 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate font-medium text-uplight-black">
                    {alert.campaignName}
                  </p>
                  <p className="mt-0.5 text-xs text-muted">{alert.campaignType}</p>
                </div>
                <Badge
                  className={
                    alert.priority === "high"
                      ? "bg-red-50 text-red-700"
                      : "bg-amber-50 text-amber-700"
                  }
                >
                  {alert.priority}
                </Badge>
              </div>
              <p className="text-sm leading-relaxed text-uplight-black/80">
                {alert.message}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
                <span>{alert.reason}</span>
                <span className="tabular-nums">
                  {alert.engagementCount} engagements
                </span>
                <span className="tabular-nums">{alert.uniqueLeads} leads</span>
                <span>{alert.createdAt}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
