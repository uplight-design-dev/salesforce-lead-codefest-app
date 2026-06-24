import Link from "next/link";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";

type Campaign = {
  id: string;
  name: string;
  type: string;
  metric: string;
};

type TopCampaignsProps = {
  campaigns: Campaign[];
};

export function TopCampaigns({ campaigns }: TopCampaignsProps) {
  return (
    <Card className="flex h-full flex-col">
      <CardHeader>
        <CardTitle>Top Performing Campaigns</CardTitle>
      </CardHeader>

      <ul className="flex-1 space-y-5">
        {campaigns.map((campaign) => (
          <li key={campaign.id} className="border-b border-border pb-5 last:border-0 last:pb-0">
            <p className="text-base font-semibold">{campaign.name}</p>
            <div className="mt-1.5 flex flex-wrap items-center gap-2 text-sm text-muted">
              <span>{campaign.type}</span>
              <span>·</span>
              <span className="font-medium text-uplight-green">{campaign.metric}</span>
            </div>
          </li>
        ))}
      </ul>

      <Link
        href="/pipeline"
        className="mt-6 text-sm font-medium text-uplight-blue hover:underline"
      >
        View all campaigns →
      </Link>
    </Card>
  );
}
