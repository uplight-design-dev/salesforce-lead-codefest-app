"use client";

import { useId, useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils/cn";

type CollapsibleCardProps = {
  title: string;
  summary: ReactNode;
  badge?: ReactNode;
  children: ReactNode;
  defaultOpen?: boolean;
};

export function CollapsibleCard({
  title,
  summary,
  badge,
  children,
  defaultOpen = false,
}: CollapsibleCardProps) {
  const [open, setOpen] = useState(defaultOpen);
  const contentId = useId();

  return (
    <Card className="overflow-hidden p-0">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={contentId}
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-start gap-3 px-5 py-4 text-left transition hover:bg-surface/70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-uplight-blue"
      >
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-semibold">{title}</h3>
            {badge}
          </div>
          <div className="mt-2">{summary}</div>
        </div>
        <ChevronDown
          className={cn(
            "mt-0.5 h-5 w-5 shrink-0 text-muted transition-transform duration-200",
            open && "rotate-180"
          )}
        />
      </button>

      <div
        id={contentId}
        hidden={!open}
        className="border-t border-border px-5 py-4"
      >
        {children}
      </div>
    </Card>
  );
}
