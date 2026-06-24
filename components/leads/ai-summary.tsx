import { Sparkles } from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";

type AiSummaryProps = {
  summary: string;
  conversionProbability?: number;
};

export function AiSummary({ summary, conversionProbability }: AiSummaryProps) {
  return (
    <Card className="border-uplight-green/30 bg-gradient-to-br from-uplight-green/5 to-transparent">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-uplight-green" />
          <CardTitle>AI Lead Summary</CardTitle>
        </div>
        {conversionProbability !== undefined && (
          <span className="text-sm font-semibold text-uplight-green">
            {conversionProbability}% likely to convert
          </span>
        )}
      </CardHeader>
      <p className="text-sm leading-relaxed text-uplight-black/80">{summary}</p>
    </Card>
  );
}
