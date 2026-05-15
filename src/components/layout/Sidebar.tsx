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
  Search,
  Settings,
  Trophy
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { UniBoardLogo } from "@/components/brand/UniBoardLogo";
import { CreateRoomModal } from "@/components/rooms/CreateRoomModal";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { cn } from "@/lib/utils";
import type { Room } from "@/types";

export function Sidebar() {
  useCurrentUser();
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

      <nav className="space-y-1 px-3 py-3">
        <NavItem href="/dashboard" active={pathname === "/dashboard"} icon={<Home size={17} />} label="Dashboard" />
        <NavItem href="/search" active={pathname === "/search"} icon={<Search size={17} />} label="Search" />
        <NavItem
          href="/notifications"
          active={pathname === "/notifications"}
          icon={<Bell size={17} />}
          label="Notifications"
          badge={unreadNotifications ?? 0}
        />
        <NavItem href="/saved" active={pathname === "/saved"} icon={<Bookmark size={17} />} label="Saved" />
        <NavItem href="/knowledge-base" active={pathname === "/knowledge-base"} icon={<BookOpen size={17} />} label="Knowledge base" />
        <NavItem href="/planner" active={pathname === "/planner"} icon={<BrainCircuit size={17} />} label="Planner" />
        <NavItem href="/analytics" active={pathname === "/analytics"} icon={<BarChart3 size={17} />} label="Analytics" />
        <NavItem href="/leaderboard" active={pathname === "/leaderboard"} icon={<Crown size={17} />} label="Leaderboard" />
        <NavItem href="/reputation" active={pathname === "/reputation"} icon={<Trophy size={17} />} label="Reputation" />
      </nav>

      <div className="flex items-center justify-between px-5 pt-2">
        <p className="section-eyebrow">Rooms</p>
        <button
          onClick={() => setShowCreateRoom(true)}
          className="touch-target rounded-2xl border border-[var(--app-line)] bg-white/5 p-2 text-[var(--app-text-soft)] transition hover:bg-white/10"
          aria-label="Create room"
        >
          <Plus size={16} />
        </button>
      </div>

      <div className="app-scroll px-3 py-3">
        {rooms === undefined ? (
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="h-12 animate-pulse rounded-2xl bg-white/5" />
            ))}
          </div>
        ) : rooms.length === 0 ? (
          <div className="rounded-[1.25rem] border border-dashed border-[var(--app-line)] bg-white/[0.02] p-4 text-sm leading-6 text-[var(--app-text-muted)]">
            No rooms joined yet.
          </div>
        ) : (
          <div className="space-y-2">
            {(rooms as Room[]).map((room) => (
              <SidebarRoomItem key={room._id} roomId={room._id} name={room.name} emoji={room.emoji} active={pathname === `/rooms/${room._id}`} />
            ))}
          </div>
        )}
      </div>

      <div className="border-t border-[var(--app-line)] px-5 py-4">
        <div className="flex items-center gap-3 rounded-[1.25rem] border border-[var(--app-line)] bg-white/[0.03] p-3">
          <UserButton afterSignOutUrl="/" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-white">Your account</p>
            <p className="truncate text-xs text-[var(--app-text-muted)]">Managed by Clerk</p>
          </div>
          <Link href="/settings" className="touch-target rounded-2xl border border-[var(--app-line)] bg-white/5 p-2 text-[var(--app-text-soft)] transition hover:bg-white/10">
            <Settings size={16} />
          </Link>
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
          : "text-[var(--app-text-muted)] hover:bg-white/5 hover:text-white"
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
      <span className="text-lg">{emoji}</span>
      <span className="min-w-0 flex-1 truncate">{name}</span>
      {unreadCount ? <span className="rounded-full bg-[var(--app-primary)] px-2 py-0.5 text-[10px] font-bold text-white">{unreadCount}</span> : null}
    </Link>
  );
}
