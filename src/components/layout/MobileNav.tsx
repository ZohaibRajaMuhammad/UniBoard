"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, BookOpen, Home, Search, User } from "lucide-react";
import { useUnreadCounts } from "@/hooks/useUnreadCounts";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { cn } from "@/lib/utils";

export function MobileNav() {
  useCurrentUser();
  const pathname = usePathname();
  const { totalUnread, unreadNotifications } = useUnreadCounts();

  return (
    <nav className="fixed inset-x-3 bottom-3 z-40 md:hidden">
      <div className="mx-auto max-w-xl rounded-[1.75rem] border border-white/10 bg-[rgba(8,16,28,0.94)] px-2 pt-2 shadow-[0_20px_50px_rgba(4,8,18,0.45)] backdrop-blur">
        <div className="flex min-h-[4.25rem] items-center justify-around pb-[max(0.5rem,env(safe-area-inset-bottom))]">
          <MobileNavItem href="/dashboard" label="Home" icon={<Home size={20} />} active={pathname === "/dashboard"} />
          <MobileNavItem href="/rooms" label="Rooms" icon={<BookOpen size={20} />} active={pathname.startsWith("/rooms")} badge={totalUnread} />
          <MobileNavItem href="/search" label="Search" icon={<Search size={20} />} active={pathname === "/search"} />
          <MobileNavItem href="/notifications" label="Alerts" icon={<Bell size={20} />} active={pathname === "/notifications"} badge={unreadNotifications} />
          <MobileNavItem href="/profile" label="Profile" icon={<User size={20} />} active={pathname === "/profile"} />
        </div>
      </div>
    </nav>
  );
}

function MobileNavItem({
  href,
  label,
  icon,
  active,
  badge
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
  active: boolean;
  badge?: number;
}) {
  return (
    <Link href={href} className="relative flex min-w-[4.25rem] flex-col items-center gap-1 px-2 py-1">
      <div
        className={cn(
          "touch-target relative flex items-center justify-center rounded-2xl px-3 py-2.5 transition",
          active ? "bg-brand-500/15 text-brand-300" : "text-gray-500"
        )}
      >
        {icon}
        {badge ? (
          <span className="absolute -right-1 -top-1 rounded-full bg-red-500 px-1.5 py-0.5 text-[9px] font-bold text-white">
            {badge > 9 ? "9+" : badge}
          </span>
        ) : null}
      </div>
      <span className={cn("text-[10px] font-medium", active ? "text-brand-300" : "text-gray-500")}>{label}</span>
    </Link>
  );
}
