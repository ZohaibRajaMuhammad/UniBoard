"use client";

import { useState } from "react";
import { UserButton } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import {
  BarChart3,
  Bell,
  BookOpen,
  Bookmark,
  BrainCircuit,
  Crown,
  Home,
  Plus,
  Settings,
  Search,
  Trophy
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { UniBoardLogo } from "@/components/brand/UniBoardLogo";
import { CreateRoomModal } from "@/components/rooms/CreateRoomModal";
import { ProfileAvatar } from "@/components/ui/ProfileAvatar";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { getRoomIcon } from "@/lib/ui-icons";
import { cn } from "@/lib/utils";
import type { Room } from "@/types";

type SidebarNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  badgeKey?: "notifications";
};

const navGroups: ReadonlyArray<{ label: string; items: ReadonlyArray<SidebarNavItem> }> = [
  {
    label: "Workspace",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: Home },
      { href: "/search", label: "Search", icon: Search },
      { href: "/notifications", label: "Notifications", icon: Bell, badgeKey: "notifications" as const },
      { href: "/saved", label: "Saved", icon: Bookmark }
    ]
  },
  {
    label: "Planning and AI",
    items: [
      { href: "/knowledge-base", label: "Knowledge base", icon: BookOpen },
      { href: "/planner", label: "Planner", icon: BrainCircuit },
      { href: "/analytics", label: "Analytics", icon: BarChart3 }
    ]
  },
  {
    label: "Standing",
    items: [
      { href: "/leaderboard", label: "Leaderboard", icon: Crown },
      { href: "/reputation", label: "Reputation", icon: Trophy }
    ]
  }
];

export function Sidebar() {
  const currentUser = useCurrentUser();
  const pathname = usePathname();
  const rooms = useQuery(api.rooms.getMyRooms);
  const unreadNotifications = useQuery(api.notifications.getUnreadNotificationCount);
  const totalUnread = useQuery(api.rooms.getTotalUnreadCount);
  const [showCreateRoom, setShowCreateRoom] = useState(false);

  return (
    <div className="sidebar-theme-surface flex h-full w-full flex-col border-r border-[var(--app-line)] backdrop-blur">
      <div className="flex min-h-[5.5rem] items-center gap-3 border-b border-[var(--app-line)] px-5">
        <UniBoardLogo subtitle="Academic command center" className="min-w-0 flex-1" />
        {totalUnread ? (
          <span className="rounded-full bg-[var(--app-primary)] px-2 py-1 text-xs font-bold text-white">
            {totalUnread > 99 ? "99+" : totalUnread}
          </span>
        ) : null}
      </div>

      <div className="border-b border-[var(--app-line)] px-5 py-4">
        <Link
          href="/search"
          className="app-input flex min-h-[3.1rem] items-center gap-3 text-sm text-[var(--app-text-soft)] transition hover:bg-white/10"
        >
          <Search size={16} className="shrink-0 text-[var(--app-text-muted)]" />
          <span className="truncate text-[var(--app-text-muted)]">Search posts, deadlines, or rooms</span>
        </Link>
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="app-scroll min-h-0 flex-1 px-3 py-3">
          <nav className="space-y-4">
            {navGroups.map((group) => (
              <section key={group.label} className="space-y-1.5">
                <div className="px-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--app-text-muted)]">{group.label}</p>
                </div>
                <div className="space-y-1">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const badge = item.badgeKey === "notifications" ? unreadNotifications ?? 0 : undefined;
                    return (
                      <NavItem
                        key={item.href}
                        href={item.href}
                        active={pathname === item.href}
                        icon={<Icon size={17} />}
                        label={item.label}
                        badge={badge}
                      />
                    );
                  })}
                </div>
              </section>
            ))}
          </nav>

          <div className="mt-5 flex items-center justify-between px-2">
            <p className="section-eyebrow">Rooms</p>
            <button
              onClick={() => setShowCreateRoom(true)}
              className="touch-target rounded-2xl border border-[var(--app-line)] bg-white/5 p-2 text-[var(--app-text-soft)] transition hover:bg-white/10"
              aria-label="Create room"
            >
              <Plus size={16} />
            </button>
          </div>

          {rooms === undefined ? (
            <div className="mt-3 space-y-2">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="h-12 animate-pulse rounded-2xl bg-white/5" />
              ))}
            </div>
          ) : rooms.length === 0 ? (
            <div className="mt-3 rounded-[1.25rem] border border-dashed border-[var(--app-line)] bg-white/[0.02] p-4 text-sm leading-6 text-[var(--app-text-muted)]">
              No rooms joined yet.
            </div>
          ) : (
            <div className="mt-3 space-y-2">
              {(rooms as Room[]).map((room) => (
                <SidebarRoomItem key={room._id} roomId={room._id} name={room.name} emoji={room.emoji} active={pathname === `/rooms/${room._id}`} />
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="border-t border-[var(--app-line)] px-5 py-4">
        <div className="flex items-center gap-3 rounded-[1.25rem] border border-[var(--app-line)] bg-white/[0.03] p-3">
          <div className="relative">
            <ProfileAvatar
              name={currentUser?.name ?? "UniBoard User"}
              imageUrl={currentUser?.imageUrl ?? null}
            />
            <div className="absolute -bottom-0.5 -right-0.5 rounded-full border border-[var(--app-line)] bg-[var(--app-panel-strong)] p-0.5">
              <UserButton afterSignOutUrl="/" />
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <Link href="/profile" className="truncate text-sm font-semibold text-white transition hover:text-[var(--app-primary-strong)]">
              Your profile
            </Link>
            <p className="truncate text-xs text-[var(--app-text-muted)]">Personal workspace controls</p>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/profile" className="icon-frame touch-target transition hover:bg-white/10 hover:text-white" aria-label="Open profile">
              <Crown size={16} />
            </Link>
            <Link href="/settings" className="icon-frame touch-target transition hover:bg-white/10 hover:text-white" aria-label="Open settings">
              <Settings size={16} />
            </Link>
          </div>
        </div>
      </div>

      {showCreateRoom ? <CreateRoomModal onClose={() => setShowCreateRoom(false)} /> : null}
    </div>
  );
}

function NavItem({
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
    <Link
      href={href}
      className={cn(
        "flex min-h-[3rem] items-center gap-3 rounded-[18px] px-4 py-3 text-sm transition",
        active
          ? "border border-[rgba(109,140,255,0.18)] bg-[rgba(77,117,255,0.14)] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]"
          : "text-[var(--app-text-muted)] hover:bg-white/5 hover:text-[var(--app-text)]"
      )}
    >
      {icon}
      <span className="flex-1 truncate">{label}</span>
      {badge ? <span className="rounded-full bg-[var(--app-danger)] px-2 py-0.5 text-[10px] font-bold text-white">{badge}</span> : null}
    </Link>
  );
}

function SidebarRoomItem({
  roomId,
  name,
  emoji,
  active
}: {
  roomId: string;
  name: string;
  emoji: string;
  active: boolean;
}) {
  const unreadCount = useQuery(api.rooms.getUnreadCount, { roomId: roomId as Id<"rooms"> });
  const RoomIcon = getRoomIcon(emoji);

  return (
    <Link
      href={`/rooms/${roomId}`}
      className={cn(
        "flex min-h-[3rem] items-center gap-3 rounded-[18px] border px-4 py-3 text-sm transition",
        active
          ? "border-[rgba(213,178,122,0.2)] bg-[rgba(213,178,122,0.08)] text-white"
          : "border-transparent text-[var(--app-text-muted)] hover:bg-white/5 hover:text-white"
      )}
      >
      <span className="icon-frame h-8 w-8 rounded-2xl text-[var(--app-primary-strong)]">
        <RoomIcon size={15} />
      </span>
      <span className="min-w-0 flex-1 truncate">{name}</span>
      {unreadCount ? <span className="rounded-full bg-[var(--app-primary)] px-2 py-0.5 text-[10px] font-bold text-white">{unreadCount}</span> : null}
    </Link>
  );
}
