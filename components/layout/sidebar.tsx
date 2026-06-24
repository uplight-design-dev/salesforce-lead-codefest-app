"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Bot,
  GitBranch,
  LayoutDashboard,
  Leaf,
  Settings,
  Users,
  UsersRound,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

const navItems = [
  { href: "/", label: "Overview", icon: LayoutDashboard },
  { href: "/leads", label: "Leads", icon: Users },
  { href: "/pipeline", label: "Pipeline", icon: GitBranch },
  { href: "/team", label: "Team", icon: UsersRound },
  { href: "/alignment", label: "Alignment", icon: BarChart3 },
  { href: "/copilot", label: "AI Copilot", icon: Bot },
  { href: "/sustainability", label: "Sustainability", icon: Leaf },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-[260px] shrink-0 flex-col border-r border-sidebar-border bg-white">
      <div className="px-6 py-7">
        <Link href="/" className="inline-block">
          <Image
            src="/logo/uplight-iq.png"
            alt="uplight IQ"
            width={180}
            height={40}
            className="h-10 w-auto object-contain object-left"
            priority
          />
        </Link>
      </div>

      <nav className="flex-1 space-y-0.5 px-4">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive =
            href === "/" ? pathname === "/" : pathname.startsWith(href);

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-4 py-3 text-[15px] font-medium transition-colors",
                isActive
                  ? "bg-uplight-blue/8 text-uplight-blue"
                  : "text-uplight-black/70 hover:bg-surface hover:text-uplight-black"
              )}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
