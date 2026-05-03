"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { PlusSquare } from "lucide-react";
import { api } from "../../../../../convex/_generated/api";
import type { Id } from "../../../../../convex/_generated/dataModel";
import { PinnedPostsBanner } from "@/components/feed/PinnedPostsBanner";
import { PostComposer } from "@/components/feed/PostComposer";
import { PostFeed } from "@/components/feed/PostFeed";
import { PresenceBar } from "@/components/rooms/PresenceBar";
import { RoomHeader } from "@/components/rooms/RoomHeader";
import { TeacherPanel } from "@/components/teacher/TeacherPanel";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { POST_TYPE_CONFIG, POST_TYPES } from "@/lib/constants";
import { cn } from "@/lib/utils";

const FEED_FILTERS = ["all", ...POST_TYPES] as const;

export default function RoomPage({ params }: { params: { roomId: string } }) {
  const roomId = params.roomId as Id<"rooms">;
  const currentUser = useCurrentUser();
  const [activeFilter, setActiveFilter] = useState<(typeof FEED_FILTERS)[number]>("all");
  const room = useQuery(api.rooms.getById, { roomId });
  const posts = useQuery(api.posts.getByRoom, {
    roomId,
    postType: activeFilter === "all" ? undefined : activeFilter
  });
  const pinnedPosts = useQuery(api.posts.getPinnedPosts, { roomId });
  const markSeen = useMutation(api.rooms.markSeen);

  useEffect(() => {
    void markSeen({ roomId });
  }, [markSeen, roomId]);

  const roomStats = useMemo(() => {
    if (!room) {
      return [];
    }

    return [
      { label: "Members", value: String(room.memberCount) },
      { label: "Posts", value: String(room.postCount) },
      { label: "Format", value: room.isPublic ? "Public" : "Private" }
    ];
  }, [room]);

  if (room === undefined) {
    return <div className="m-4 h-48 animate-pulse rounded-[28px] bg-white/5 sm:m-6" />;
  }

  if (!room) {
    return <div className="flex flex-1 items-center justify-center text-gray-400">Room not found.</div>;
  }

  return (
    <div className="flex min-h-0 flex-1 overflow-hidden">
      <div className="grid min-h-0 flex-1 grid-rows-[auto_auto_auto_auto_minmax(0,1fr)_auto] overflow-hidden">
        <RoomHeader room={room} />
        <PresenceBar roomId={roomId} />

        <div className="border-b border-white/10 bg-black/10 backdrop-blur">
          <div className="page-wrap py-4">
            <div className="grid gap-3 sm:grid-cols-3">
              {roomStats.map((item) => (
                <div key={item.label} className="stat-card">
                  <p className="text-[11px] uppercase tracking-[0.24em] text-gray-500">{item.label}</p>
                  <p className="mt-2 text-lg font-semibold text-white">{item.value}</p>
                </div>
              ))}
            </div>

            <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-[0.24em] text-gray-500">Feed controls</p>
                <h2 className="mt-1 text-lg font-semibold text-white">Filter the conversation by signal</h2>
              </div>
              <div className="flex flex-wrap gap-2 lg:justify-end">
                <button
                  onClick={() => document.getElementById("room-composer")?.scrollIntoView({ behavior: "smooth", block: "center" })}
                  className="inline-flex items-center gap-2 rounded-full border border-brand-400/40 bg-brand-500/10 px-4 py-2 text-sm font-medium text-brand-100 transition hover:bg-brand-500/20"
                >
                  <PlusSquare size={14} />
                  Compose
                </button>
                {FEED_FILTERS.map((filter) => {
                  const filterLabel = filter === "all" ? "All posts" : `${POST_TYPE_CONFIG[filter].emoji} ${POST_TYPE_CONFIG[filter].label}`;
                  return (
                    <button
                      key={filter}
                      onClick={() => setActiveFilter(filter)}
                      className={cn(
                        "rounded-full border px-4 py-2 text-sm font-medium transition",
                        activeFilter === filter
                          ? "border-brand-400/50 bg-brand-500/15 text-white"
                          : "border-white/10 bg-white/5 text-gray-300 hover:bg-white/10"
                      )}
                    >
                      {filterLabel}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {pinnedPosts && pinnedPosts.length > 0 ? <PinnedPostsBanner posts={pinnedPosts} /> : null}

        <div className="min-h-0 overflow-y-auto overscroll-contain pb-4">
          <PostFeed posts={posts} roomId={roomId} emptyStateLabel={activeFilter === "all" ? "No posts yet" : `No ${activeFilter} posts yet`} />
        </div>

        <div id="room-composer" className="sticky bottom-0 border-t border-white/10 bg-gray-950/95 backdrop-blur">
          <PostComposer roomId={roomId} />
        </div>
      </div>

      {currentUser?.role === "teacher" || currentUser?.role === "super_admin" ? (
        <aside className="hidden w-[20rem] 2xl:flex">
          <TeacherPanel roomId={roomId} />
        </aside>
      ) : null}
    </div>
  );
}
