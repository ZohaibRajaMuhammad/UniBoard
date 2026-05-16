import Link from "next/link";
import type { Doc } from "../../../convex/_generated/dataModel";
import { getRoomIcon } from "@/lib/ui-icons";
import { formatRelativeTime } from "@/lib/utils";

export function RoomCard({ room }: { room: Doc<"rooms"> }) {
  const RoomIcon = getRoomIcon(room.emoji);

  return (
    <Link
      href={`/rooms/${room._id}`}
      className="lift-on-hover spotlight-ring glass-panel block rounded-[var(--radius-panel)] p-5 transition hover:border-[rgba(109,140,255,0.24)] hover:bg-white/[0.04] sm:p-6"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-[var(--app-line)] bg-white/5 text-[var(--app-primary-strong)]">
            <RoomIcon size={22} />
          </div>
          <h3 className="text-lg font-semibold text-white sm:text-xl">{room.name}</h3>
          <p className="mt-1 text-sm text-[var(--app-text-muted)]">{room.subject}</p>
        </div>
        <span className="shrink-0 rounded-full border border-[var(--app-line)] bg-white/[0.04] px-3 py-1 text-xs text-[var(--app-text-muted)]">
          {room.batch}
        </span>
      </div>
      {room.description ? <p className="mt-4 line-clamp-2 text-sm leading-6 text-[var(--app-text-muted)]">{room.description}</p> : null}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--app-text-muted)]">
        <span>{room.memberCount} members</span>
        <span>{room.lastPostAt ? formatRelativeTime(room.lastPostAt) : "No posts yet"}</span>
      </div>
    </Link>
  );
}
