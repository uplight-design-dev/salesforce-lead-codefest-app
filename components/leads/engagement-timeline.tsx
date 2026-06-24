import type { EngagementActivity } from "@/lib/types/lead";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";

const sourceColors: Record<EngagementActivity["source"], string> = {
  marketing: "bg-uplight-blue",
  sales: "bg-uplight-navy",
  website: "bg-uplight-green",
  webinar: "bg-emerald-600",
};

type EngagementTimelineProps = {
  activities: EngagementActivity[];
};

export function EngagementTimeline({ activities }: EngagementTimelineProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Lead Engagement Timeline</CardTitle>
      </CardHeader>

      <div className="relative space-y-0">
        {activities.map((activity, index) => (
          <div key={activity.id} className="relative flex gap-4 pb-6 last:pb-0">
            {index < activities.length - 1 && (
              <span className="absolute left-[7px] top-4 h-full w-px bg-border" />
            )}
            <span
              className={`relative z-10 mt-1.5 h-3.5 w-3.5 shrink-0 rounded-full ${sourceColors[activity.source]}`}
            />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-muted">{activity.date}</p>
              <p className="mt-0.5 font-medium">{activity.activity}</p>
              <p className="mt-0.5 text-xs capitalize text-muted">
                {activity.source}
              </p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
