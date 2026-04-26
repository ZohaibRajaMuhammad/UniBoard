import Link from "next/link";
import type { Doc } from "../../../convex/_generated/dataModel";
import { formatRelativeTime } from "@/lib/utils";

export function RoomCard({ room }: { room: Doc<"rooms"> }) {
  return (
    <Link href={`/rooms/${room._id}`} className="spotlight-ring glass-panel block rounded-[30px] p-5 transition hover:-translate-y-0.5 hover:border-brand-400/30">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-2xl">{room.emoji}</div>
          <h3 className="text-xl font-semibold text-white">{room.name}</h3>
          <p className="mt-1 text-sm text-gray-400">{room.subject}</p>
        </div>
        <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-gray-400">{room.batch}</span>
      </div>
      {room.description ? <p className="mt-4 line-clamp-2 text-sm text-gray-400">{room.description}</p> : null}
      <div className="mt-6 flex items-center justify-between text-xs text-gray-500">
        <span>{room.memberCount} members</span>
        <span>{room.lastPostAt ? formatRelativeTime(room.lastPostAt) : "No posts yet"}</span>
      </div>
    </Link>
  );
}
