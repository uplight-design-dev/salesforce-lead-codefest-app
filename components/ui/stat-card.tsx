import { cn } from "@/lib/utils/cn";
import { Card } from "./card";

type StatCardProps = {
  label: string;
  value: string | number;
  subtext?: string;
  trend?: { value: string; positive?: boolean };
  accent?: "green" | "blue" | "navy" | "default";
  className?: string;
};

export function StatCard({
  label,
  value,
  subtext,
  trend,
  accent = "default",
  className,
}: StatCardProps) {
  return (
    <Card className={cn("flex flex-col justify-between py-5", className)}>
      <p className="text-[15px] font-medium text-muted">{label}</p>
      <p className="mt-3 text-[2.25rem] font-bold leading-none tracking-tight">
        {value}
      </p>
      {trend && (
        <p
          className={cn(
            "mt-2 text-sm font-medium",
            trend.positive ? "text-emerald-600" : "text-red-500"
          )}
        >
          {trend.value}
        </p>
      )}
      {subtext && !trend && (
        <p className="mt-2 text-sm text-muted">{subtext}</p>
      )}
      {subtext && trend && (
        <p className="mt-1 text-sm text-muted">{subtext}</p>
      )}
    </Card>
  );
}
