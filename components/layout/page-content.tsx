import { cn } from "@/lib/utils/cn";

type PageContentProps = {
  children: React.ReactNode;
  className?: string;
};

/** Scrollable main content area that fills the viewport below any page header. */
export function PageContent({ children, className }: PageContentProps) {
  return (
    <div className={cn("flex-1 overflow-y-auto px-8 py-7", className)}>
      {children}
    </div>
  );
}
