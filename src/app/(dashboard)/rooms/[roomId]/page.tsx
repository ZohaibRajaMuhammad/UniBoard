"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { PlusSquare, Sparkles } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { api } from "../../../../../convex/_generated/api";
import type { Id } from "../../../../../convex/_generated/dataModel";
import { PinnedPostsBanner } from "@/components/feed/PinnedPostsBanner";
import { PostComposer } from "@/components/feed/PostComposer";
import { PostFeed } from "@/components/feed/PostFeed";
import { PresenceBar } from "@/components/rooms/PresenceBar";
import { RoomHeader } from "@/components/rooms/RoomHeader";
import { TeacherPanel } from "@/components/teacher/TeacherPanel";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { postAi } from "@/lib/ai/client";
import type { AiEnvelope, RoomSummary } from "@/lib/ai/contracts";
import { POST_TYPE_CONFIG, POST_TYPES } from "@/lib/constants";
import { getPostTypeIcon } from "@/lib/ui-icons";
import { cn } from "@/lib/utils";

const FEED_FILTERS = ["all", ...POST_TYPES] as const;

export default function RoomPage({ params }: { params: { roomId: string } }) {
  const roomId = params.roomId as Id<"rooms">;
  const searchParams = useSearchParams();
  const currentUser = useCurrentUser();
  const [activeFilter, setActiveFilter] = useState<(typeof FEED_FILTERS)[number]>("all");
  const room = useQuery(api.rooms.getById, { roomId });
  const posts = useQuery(api.posts.getByRoom, {
    roomId,
    postType: activeFilter === "all" ? undefined : activeFilter
  });
  const pinnedPosts = useQuery(api.posts.getPinnedPosts, { roomId });
  const markSeen = useMutation(api.rooms.markSeen);
  const highlightedPostId = searchParams.get("post") as Id<"posts"> | null;
  const [summary, setSummary] = useState<AiEnvelope<RoomSummary> | null>(null);
  const [summaryError, setSummaryError] = useState("");

  useEffect(() => {
    void markSeen({ roomId });
  }, [markSeen, roomId]);

  useEffect(() => {
    if (!highlightedPostId || posts === undefined) {
      return;
    }

    const timeout = window.setTimeout(() => {
      document.getElementById(`post-${highlightedPostId}`)?.scrollIntoView({
        behavior: "smooth",
        block: "center"
      });
    }, 120);

    return () => window.clearTimeout(timeout);
  }, [highlightedPostId, posts]);

  useEffect(() => {
    if (!room?.aiEnabled) {
      setSummary(null);
      setSummaryError("");
      return;
    }

    let cancelled = false;
    void postAi<RoomSummary>("/api/v1/ai/room-summary", { roomId })
      .then((payload) => {
        if (!cancelled) {
          setSummary(payload);
          setSummaryError("");
        }
      })
      .catch((error) => {
        if (!cancelled) {
          setSummaryError(error instanceof Error ? error.message : "Unable to load room summary.");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [room?.aiEnabled, roomId]);

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

        <div className="border-b border-[var(--app-line)] bg-white/5 backdrop-blur">
          <div className="page-wrap py-4">
            <div className="grid gap-3 sm:grid-cols-3">
              {roomStats.map((item) => (
                <div key={item.label} className="stat-card">
                  <p className="text-[11px] uppercase tracking-[0.24em] text-[var(--app-text-muted)]">{item.label}</p>
                  <p className="mt-2 text-lg font-semibold text-white">{item.value}</p>
                </div>
              ))}
            </div>

            {room.aiEnabled ? (
              <div className="mt-4 rounded-[24px] border border-[rgba(154,140,255,0.18)] bg-[rgba(154,140,255,0.08)] p-4">
                <div className="flex items-center gap-2">
                  <Sparkles size={15} className="text-[var(--app-violet)]" />
                  <p className="text-xs uppercase tracking-[0.2em] text-[var(--app-text-soft)]">AI room summary</p>
                </div>
                {summaryError ? (
                  <p className="mt-3 text-sm text-red-200">{summaryError}</p>
                ) : summary === null ? (
                  <div className="mt-3 h-16 animate-pulse rounded-2xl bg-white/5" />
                ) : (
                  <>
                    <p className="mt-3 text-sm leading-7 text-[var(--app-text-soft)]">{summary.data?.summary}</p>
                    {(summary.data?.keyPoints?.length ?? 0) > 0 ? (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {summary.data?.keyPoints.slice(0, 4).map((item) => (
                          <span key={item} className="panel-chip rounded-2xl px-3 py-2 text-xs">{item}</span>
                        ))}
                      </div>
                    ) : null}
                  </>
                )}
              </div>
            ) : null}

            <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-[0.24em] text-[var(--app-text-muted)]">Feed controls</p>
                <h2 className="mt-1 text-lg font-semibold text-white">Filter the conversation by signal</h2>
              </div>
              <div className="flex flex-wrap gap-2 lg:justify-end">
                <button
                  onClick={() => document.getElementById("room-composer")?.scrollIntoView({ behavior: "smooth", block: "center" })}
                  className="inline-flex items-center gap-2 rounded-full border border-[rgba(109,140,255,0.32)] bg-[rgba(77,117,255,0.12)] px-4 py-2 text-sm font-medium text-[var(--app-text-soft)] transition hover:bg-[rgba(77,117,255,0.18)]"
                >
                  <PlusSquare size={14} />
                  Compose
                </button>
                {FEED_FILTERS.map((filter) => {
                  const FilterIcon = filter === "all" ? null : getPostTypeIcon(filter);
                  return (
                    <button
                      key={filter}
                      onClick={() => setActiveFilter(filter)}
                      className={cn(
                        "rounded-full border px-4 py-2 text-sm font-medium transition",
                        activeFilter === filter
                          ? "border-[rgba(109,140,255,0.28)] bg-[rgba(77,117,255,0.14)] text-white"
                          : "border-[var(--app-line)] bg-white/5 text-[var(--app-text-soft)] hover:bg-white/10"
                      )}
                    >
                      <span className="inline-flex items-center gap-2">
                        {FilterIcon ? <FilterIcon size={14} /> : null}
                        {filter === "all" ? "All posts" : POST_TYPE_CONFIG[filter].label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {pinnedPosts && pinnedPosts.length > 0 ? <PinnedPostsBanner posts={pinnedPosts} /> : null}

        <div className="min-h-0 overflow-y-auto overscroll-contain pb-4">
          <PostFeed
            posts={posts}
            roomId={roomId}
            emptyStateLabel={activeFilter === "all" ? "No posts yet" : `No ${activeFilter} posts yet`}
            highlightedPostId={highlightedPostId ?? undefined}
          />
        </div>

        <div id="room-composer" className="sticky bottom-0 border-t border-white/10 bg-[var(--app-panel-strong)] backdrop-blur">
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
