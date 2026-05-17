"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { PanelRightClose, PanelRightOpen, PlusSquare, ShieldCheck, Sparkles, X } from "lucide-react";
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
  const [teacherPanelOpen, setTeacherPanelOpen] = useState(false);
  const [composerOpen, setComposerOpen] = useState(false);
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

  const canModerateRoom = currentUser?.role === "teacher" || currentUser?.role === "super_admin";

  if (room === undefined) {
    return <div className="m-4 h-48 animate-pulse rounded-[28px] bg-white/5 sm:m-6" />;
  }

  if (!room) {
    return <div className="flex flex-1 items-center justify-center text-gray-400">Room not found.</div>;
  }

  return (
    <div className="relative flex min-h-0 flex-1 overflow-hidden">
      <div className="grid min-h-0 flex-1 grid-rows-[auto_auto_auto_auto_minmax(0,1fr)] overflow-hidden">
        <RoomHeader room={room} />
        <PresenceBar roomId={roomId} />

        <div className="border-b border-[var(--app-line)] bg-[rgba(255,255,255,0.56)] backdrop-blur">
          <div className="page-wrap py-4">
            <div className="grid gap-3 sm:grid-cols-3">
              {roomStats.map((item) => (
                <div key={item.label} className="stat-card">
                  <p className="text-[11px] uppercase tracking-[0.24em] text-[var(--app-text-muted)]">{item.label}</p>
                  <p className="mt-2 text-lg font-semibold text-[var(--app-text)]">{item.value}</p>
                </div>
              ))}
            </div>

            {room.aiEnabled ? (
              <div className="mt-4 rounded-[24px] border border-[rgba(154,140,255,0.16)] bg-[linear-gradient(180deg,rgba(255,255,255,0.8),rgba(245,241,255,0.9))] p-4 shadow-[0_18px_36px_rgba(112,88,214,0.08)]">
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
                    <p className="mt-3 text-sm leading-7 text-[var(--app-text)]">{summary.data?.summary}</p>
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
                <h2 className="mt-1 text-lg font-semibold text-[var(--app-text)]">Filter the conversation by signal</h2>
              </div>
              <div className="smooth-x-scroll flex gap-2 pb-1 lg:flex-wrap lg:justify-end lg:pb-0">
                {canModerateRoom ? (
                  <button
                    type="button"
                    onClick={() => setTeacherPanelOpen((current) => !current)}
                    className={cn(
                      "inline-flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition",
                      teacherPanelOpen
                        ? "border-[rgba(49,92,243,0.18)] bg-[rgba(49,92,243,0.12)] text-[var(--app-primary-strong)]"
                        : "border-[var(--app-line)] bg-white/70 text-[var(--app-text-soft)] hover:border-[var(--app-line-strong)] hover:bg-white"
                    )}
                    aria-expanded={teacherPanelOpen}
                    aria-controls="teacher-panel"
                  >
                    <ShieldCheck size={14} />
                    {teacherPanelOpen ? "Hide teacher panel" : "Open teacher panel"}
                    {teacherPanelOpen ? <PanelRightClose size={14} /> : <PanelRightOpen size={14} />}
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={() => setComposerOpen(true)}
                  className="inline-flex shrink-0 items-center gap-2 rounded-full border border-[rgba(109,140,255,0.32)] bg-[rgba(77,117,255,0.12)] px-4 py-2 text-sm font-medium text-[var(--app-text-soft)] transition hover:bg-[rgba(77,117,255,0.18)]"
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
                        "shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition",
                        activeFilter === filter
                          ? "border-[rgba(109,140,255,0.28)] bg-[rgba(77,117,255,0.14)] text-[var(--app-primary-strong)]"
                          : "border-[var(--app-line)] bg-white/70 text-[var(--app-text-soft)] hover:bg-white"
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

        <div className="flex min-h-0 flex-col overflow-hidden">
          <div className="app-scroll min-h-0 flex-1 px-1">
            <PostFeed
              posts={posts}
              roomId={roomId}
              emptyStateLabel={activeFilter === "all" ? "No posts yet" : `No ${activeFilter} posts yet`}
              highlightedPostId={highlightedPostId ?? undefined}
            />
          </div>
        </div>
      </div>

      <Dialog.Root open={composerOpen} onOpenChange={setComposerOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-40 bg-[rgba(7,17,26,0.36)] backdrop-blur-[2px]" />
          <Dialog.Content className="fixed inset-x-4 top-1/2 z-50 max-h-[calc(100dvh-2rem)] w-auto -translate-y-1/2 overflow-y-auto rounded-[1.75rem] sm:left-1/2 sm:w-[min(68rem,calc(100vw-2rem))] sm:-translate-x-1/2">
            <div className="glass-panel overflow-hidden rounded-[1.75rem]">
              <div className="flex items-center justify-between border-b border-[var(--app-line)] px-5 py-4">
                <div>
                  <Dialog.Title className="text-lg font-semibold text-white">Compose update</Dialog.Title>
                  <Dialog.Description className="mt-1 text-sm text-[var(--app-text-muted)]">
                    Create a new room post without covering the feed.
                  </Dialog.Description>
                </div>
                <Dialog.Close className="touch-target rounded-2xl border border-[var(--app-line)] bg-white/5 p-2 text-[var(--app-text-muted)] transition hover:bg-white/10">
                  <X size={16} />
                </Dialog.Close>
              </div>
              <PostComposer roomId={roomId} onSubmitted={() => setComposerOpen(false)} />
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {canModerateRoom ? (
        <>
          {teacherPanelOpen ? (
            <button
              type="button"
              className="fixed inset-0 z-30 bg-[rgba(7,17,26,0.18)] backdrop-blur-[2px] xl:hidden"
              onClick={() => setTeacherPanelOpen(false)}
              aria-label="Close teacher panel backdrop"
            />
          ) : null}

          <aside
            id="teacher-panel"
            className={cn(
              "fixed inset-y-0 right-0 z-40 flex w-full max-w-[24rem] shrink-0 border-l border-[var(--app-line)] bg-white shadow-[0_28px_80px_rgba(41,57,90,0.18)] transition-transform duration-300 xl:absolute 2xl:relative 2xl:inset-auto 2xl:max-w-[23rem] 2xl:shadow-none",
              teacherPanelOpen ? "translate-x-0" : "translate-x-full 2xl:hidden"
            )}
          >
            <TeacherPanel roomId={roomId} onClose={() => setTeacherPanelOpen(false)} />
          </aside>

          {!teacherPanelOpen ? (
            <button
              type="button"
              onClick={() => setTeacherPanelOpen(true)}
              className="fixed bottom-28 right-6 z-20 hidden items-center gap-2 rounded-full border border-[rgba(49,92,243,0.16)] bg-white/92 px-4 py-3 text-sm font-semibold text-[var(--app-primary-strong)] shadow-[0_18px_44px_rgba(37,76,227,0.16)] backdrop-blur xl:inline-flex"
            >
              <ShieldCheck size={16} />
              Teacher tools
            </button>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
