"use client";

import { useState } from "react";
import { UserButton } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { Bell, Home, Plus, Search, Settings } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
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
    <div className="flex h-full w-full flex-col border-r border-white/10 bg-[linear-gradient(180deg,rgba(8,16,28,0.98),rgba(7,12,22,0.98))] backdrop-blur">
      <div className="flex h-20 items-center gap-3 border-b border-white/10 px-5">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-brand-300/20 bg-brand-500/15 text-2xl shadow-[0_0_30px_rgba(63,115,255,0.18)]">📋</div>
        <div>
          <p className="text-lg font-bold text-white">UniBoard</p>
          <p className="text-xs uppercase tracking-[0.25em] text-gray-500">Academic command center</p>
        </div>
        {totalUnread ? (
          <span className="ml-auto rounded-full bg-brand-500 px-2 py-1 text-xs font-bold text-white">
            {totalUnread > 99 ? "99+" : totalUnread}
          </span>
        ) : null}
      </div>

      <div className="border-b border-white/10 p-4">
        <Link
          href="/search"
          className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-gray-400 transition hover:bg-white/10"
        >
          <Search size={16} />
          Search posts
        </Link>
      </div>

      <nav className="space-y-1 px-3 py-3">
        <NavItem href="/dashboard" active={pathname === "/dashboard"} icon={<Home size={16} />} label="Dashboard" />
        <NavItem
          href="/notifications"
          active={pathname === "/notifications"}
          icon={<Bell size={16} />}
          label="Notifications"
          badge={unreadNotifications ?? 0}
        />
      </nav>

      <div className="flex items-center justify-between px-5 pt-3">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gray-500">Rooms</p>
        <button
          onClick={() => setShowCreateRoom(true)}
          className="rounded-xl border border-white/10 bg-white/5 p-2 text-gray-300 transition hover:bg-white/10"
          aria-label="Create room"
        >
          <Plus size={16} />
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
        {rooms === undefined ? (
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="h-12 animate-pulse rounded-2xl bg-white/5" />
            ))}
          </div>
        ) : rooms.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-white/10 bg-white/[0.02] p-4 text-sm text-gray-500">No rooms joined yet.</div>
        ) : (
          <div className="space-y-2">
            {(rooms as Room[]).map((room) => (
              <SidebarRoomItem key={room._id} roomId={room._id} name={room.name} emoji={room.emoji} active={pathname === `/rooms/${room._id}`} />
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center gap-3 border-t border-white/10 px-4 py-4">
        <UserButton afterSignOutUrl="/" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">Your account</p>
          <p className="truncate text-xs text-gray-500">Managed by Clerk</p>
        </div>
        <Link href="/settings" className="rounded-xl border border-white/10 bg-white/5 p-2 text-gray-300 transition hover:bg-white/10">
          <Settings size={16} />
        </Link>
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
    <Link href={href} className={cn("flex items-center gap-3 rounded-2xl px-4 py-3 text-sm transition", active ? "bg-brand-500/20 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]" : "text-gray-400 hover:bg-white/5 hover:text-white")}>
      {icon}
      <span className="flex-1">{label}</span>
      {badge ? <span className="rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-bold text-white">{badge}</span> : null}
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
    <Link href={`/rooms/${roomId}`} className={cn("flex items-center gap-3 rounded-2xl px-4 py-3 text-sm transition", active ? "bg-white/10 text-white" : "text-gray-400 hover:bg-white/5 hover:text-white")}>
      <span className="text-lg">{emoji}</span>
      <span className="min-w-0 flex-1 truncate">{name}</span>
      {unreadCount ? <span className="rounded-full bg-brand-500 px-2 py-0.5 text-[10px] font-bold text-white">{unreadCount}</span> : null}
    </Link>
  );
}
