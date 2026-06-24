import { Bell } from "lucide-react";
import Link from "next/link";
import type { HighIntentAlert } from "@/lib/types/lead";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type HighIntentAlertsProps = {
  alerts: HighIntentAlert[];
};

export function HighIntentAlerts({ alerts }: HighIntentAlertsProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4 text-uplight-blue" />
          <CardTitle>High-Intent Lead Alerts</CardTitle>
        </div>
        <Badge className="bg-uplight-green/20 text-emerald-800">
          {alerts.length} active
        </Badge>
      </CardHeader>

      <ul className="space-y-3">
        {alerts.map((alert) => (
          <li
            key={alert.id}
            className="rounded-lg border border-border bg-surface p-4"
          >
            <div className="mb-2 flex items-center justify-between gap-2">
              <Link
                href={`/leads/${alert.leadId}`}
                className="font-medium text-uplight-blue hover:underline"
              >
                {alert.leadName}
              </Link>
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
            <p className="mt-2 text-xs text-muted">{alert.reason}</p>
          </li>
        ))}
      </ul>
    </Card>
  );
}
