import Link from "next/link";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type Insight = {
  id: string;
  title: string;
  summary: string;
  tags: string[];
  time: string;
};

type IntelligencePulseProps = {
  insights: Insight[];
};

export function IntelligencePulse({ insights }: IntelligencePulseProps) {
  return (
    <Card className="flex h-full flex-col">
      <CardHeader>
        <CardTitle>Intelligence Pulse</CardTitle>
      </CardHeader>

      <ul className="flex-1 space-y-5">
        {insights.map((insight) => (
          <li key={insight.id} className="border-b border-border pb-5 last:border-0 last:pb-0">
            <div className="flex items-start justify-between gap-4">
              <p className="text-base font-semibold leading-snug">{insight.title}</p>
              <span className="shrink-0 text-sm text-muted">{insight.time}</span>
            </div>
            <p className="mt-2 text-[15px] leading-relaxed text-muted">
              {insight.summary}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {insight.tags.map((tag) => (
                <Badge
                  key={tag}
                  className="border border-border bg-surface px-2.5 py-1 text-xs font-medium text-uplight-black"
                >
                  {tag}
                </Badge>
              ))}
            </div>
          </li>
        ))}
      </ul>

      <Link
        href="/copilot"
        className="mt-6 text-sm font-medium text-uplight-blue hover:underline"
      >
        View all insights →
      </Link>
    </Card>
  );
}
