import { NotificationMenu } from "@/components/layout/notification-menu";
import type { DataSource } from "@/lib/types/data-source";

type HeaderProps = {
  title: string;
  description?: string;
  /** When provided, the notification bell shows where this page’s data comes from. */
  dataSource?: DataSource;
};

export function Header({ title, description, dataSource }: HeaderProps) {
  return (
    <header className="flex shrink-0 items-start justify-between gap-4 border-b border-border bg-white px-8 py-6">
      <div className="min-w-0">
        <h2 className="text-[1.65rem] font-bold tracking-tight">{title}</h2>
        {description && (
          <p className="mt-1.5 text-base text-muted">{description}</p>
        )}
      </div>
      <NotificationMenu source={dataSource} />
    </header>
  );
}
