"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../../../convex/_generated/api";
import type { Id } from "../../../../../../convex/_generated/dataModel";

export default function RoomSettingsPage({ params }: { params: { roomId: string } }) {
  const roomId = params.roomId as Id<"rooms">;
  const room = useQuery(api.rooms.getById, { roomId });

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-6">
      <div className="mx-auto max-w-4xl">
        <div className="glass-panel rounded-[28px] p-6">
          <h1 className="text-2xl font-bold">Room settings</h1>
          <p className="mt-2 text-sm text-gray-400">Operational overview for room maintainers.</p>
          {room ? (
            <dl className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <dt className="text-xs uppercase tracking-[0.2em] text-gray-500">Name</dt>
                <dd className="mt-2 text-lg font-semibold">{room.name}</dd>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <dt className="text-xs uppercase tracking-[0.2em] text-gray-500">Subject</dt>
                <dd className="mt-2 text-lg font-semibold">{room.subject}</dd>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <dt className="text-xs uppercase tracking-[0.2em] text-gray-500">Batch</dt>
                <dd className="mt-2 text-lg font-semibold">{room.batch}</dd>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <dt className="text-xs uppercase tracking-[0.2em] text-gray-500">Members / Posts</dt>
                <dd className="mt-2 text-lg font-semibold">{room.memberCount} / {room.postCount}</dd>
              </div>
            </dl>
          ) : null}
        </div>
      </div>
    </div>
  );
}
