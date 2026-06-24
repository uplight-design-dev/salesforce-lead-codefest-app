import { Bell } from "lucide-react";

type HeaderProps = {
  title: string;
  description?: string;
};

export function Header({ title, description }: HeaderProps) {
  return (
    <header className="flex shrink-0 items-start justify-between border-b border-border bg-white px-8 py-6">
      <div>
        <h2 className="text-[1.65rem] font-bold tracking-tight">{title}</h2>
        {description && (
          <p className="mt-1.5 text-base text-muted">{description}</p>
        )}
      </div>
      <button
        type="button"
        className="relative rounded-xl border border-border p-3 text-muted transition-colors hover:bg-surface hover:text-uplight-black"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-uplight-green" />
      </button>
    </header>
  );
}
