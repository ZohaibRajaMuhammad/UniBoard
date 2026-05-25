"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Doc, Id } from "../../../convex/_generated/dataModel";
import { initials } from "@/lib/utils";

export function PresenceBar({ roomId }: { roomId: Id<"rooms"> }) {
  const onlineUsers = useQuery(api.users.getOnlineInRoom, { roomId });

  if (!onlineUsers || onlineUsers.length === 0) {
    return (
      <div className="border-b border-[var(--app-line)] bg-white/[0.02] px-4 py-2 sm:px-6">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 rounded-[18px] border border-[var(--app-line)] bg-white/5 px-4 py-2.5">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--app-text-muted)]">Presence</p>
            <p className="mt-1 text-sm leading-5 text-[var(--app-text-soft)]">No one is actively viewing this room right now.</p>
          </div>
          <span className="app-chip">Quiet room</span>
        </div>
      </div>
    );
  }

  return (
    <div className="border-b border-white/10 bg-white/[0.02] px-4 py-2 sm:px-6">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 rounded-[18px] border border-[var(--app-line)] bg-white/5 px-4 py-2.5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--app-text-muted)]">Active in room</p>
          <p className="mt-1 text-sm leading-5 text-[var(--app-text-soft)]">
            {onlineUsers.length} {onlineUsers.length === 1 ? "person is" : "people are"} reviewing this room right now.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {(onlineUsers as Doc<"users">[]).map((user) => (
            <div
              key={user._id}
              title={user.name}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-[var(--app-text-soft)]"
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-500/25 text-[11px] font-semibold text-brand-100">
                {initials(user.name)}
              </div>
              <span className="max-w-[10rem] truncate">{user.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
