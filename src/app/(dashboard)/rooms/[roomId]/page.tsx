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
import { useNotifier } from "@/components/providers/NotificationProvider";
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
  const { notify } = useNotifier();
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
  const summaryRefreshKey = useMemo(
    () => (posts ?? []).slice(0, 12).map((post) => `${post._id}:${post.createdAt}:${post.commentCount ?? 0}`).join("|"),
    [posts]
  );

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
          if (payload.meta.mode === "fallback") {
            notify({
              title: "Room summary updated",
              message: "The summary was generated from live room activity while the model service was unavailable.",
              tone: "warning",
              desktop: false,
              priority: "low",
              tag: "room-summary-fallback"
            });
          }
        }
      })
      .catch((error) => {
        if (!cancelled) {
          const message = error instanceof Error ? error.message : "Unable to load room summary.";
          setSummaryError(message);
          notify({
            title: "Room summary failed",
            message,
            tone: "error",
            priority: "high",
            tag: "room-summary-error"
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [notify, room?.aiEnabled, roomId, summaryRefreshKey]);

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
    <div className="relative flex h-full min-h-0 flex-1 overflow-hidden">
      <div className="grid h-full min-h-0 flex-1 grid-rows-[auto_auto_auto_minmax(0,1fr)] overflow-hidden">
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

            {pinnedPosts && pinnedPosts.length > 0 ? (
              <div className="mt-4">
                <PinnedPostsBanner posts={pinnedPosts} />
              </div>
            ) : null}

            {room.aiEnabled ? (
              <div className="mt-4 rounded-[28px] border border-[rgba(109,140,255,0.18)] bg-[linear-gradient(135deg,rgba(255,255,255,0.92),rgba(246,248,252,0.88))] p-5 shadow-[0_18px_36px_rgba(79,96,151,0.08)] dark:bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))]">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <Sparkles size={15} className="text-[var(--app-violet)]" />
                      <p className="text-xs uppercase tracking-[0.2em] text-[var(--app-text-soft)]">AI room summary</p>
                    </div>
                    <h3 className="mt-2 text-lg font-semibold text-[var(--app-text)] dark:text-white">Live room intelligence</h3>
                  </div>
                  <span className={summary?.meta.mode === "fallback" ? "app-chip border-amber-400/20 bg-amber-500/10 text-[var(--app-text)]" : "app-chip"}>
                    {summary?.meta.mode === "fallback" ? "Deterministic mode" : "AI grounded"}
                  </span>
                </div>
                {summaryError ? (
                  <p className="mt-3 text-sm text-red-200">{summaryError}</p>
                ) : summary === null ? (
                  <div className="mt-3 h-16 animate-pulse rounded-2xl bg-white/5" />
                ) : (
                  <>
                    <p className="mt-4 text-sm leading-7 text-[var(--app-text)] dark:text-[var(--app-text-soft)]">{summary.data?.summary}</p>
                    {(summary.data?.keyPoints?.length ?? 0) > 0 ? (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {summary.data?.keyPoints.slice(0, 4).map((item) => (
                          <span key={item} className="panel-chip rounded-2xl px-3 py-2 text-xs">
                            {item}
                          </span>
                        ))}
                      </div>
                    ) : null}
                    {(summary.data?.openQuestions?.length ?? 0) > 0 ? (
                      <div className="mt-4 rounded-[22px] border border-[var(--app-line)] bg-white/50 p-4 dark:bg-white/[0.03]">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--app-text-muted)]">Open questions</p>
                        <div className="mt-3 space-y-2">
                          {summary.data?.openQuestions.slice(0, 3).map((item) => (
                            <div key={item} className="flex items-start gap-2 text-sm leading-6 text-[var(--app-text-soft)]">
                              <span className="mt-[0.45rem] h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--app-primary-strong)]" />
                              <p>{item}</p>
                            </div>
                          ))}
                        </div>
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
                    className={cn("app-segmented-button shrink-0", teacherPanelOpen ? "app-segmented-button-active" : "")}
                    aria-expanded={teacherPanelOpen}
                    aria-controls="teacher-panel"
                  >
                    <ShieldCheck size={14} />
                    {teacherPanelOpen ? "Hide teacher panel" : "Open teacher panel"}
                    {teacherPanelOpen ? <PanelRightClose size={14} /> : <PanelRightOpen size={14} />}
                  </button>
                ) : null}
                <button type="button" onClick={() => setComposerOpen(true)} className="app-segmented-button app-segmented-button-active shrink-0">
                  <PlusSquare size={14} />
                  Compose
                </button>
                {FEED_FILTERS.map((filter) => {
                  const FilterIcon = filter === "all" ? null : getPostTypeIcon(filter);
                  return (
                    <button
                      key={filter}
                      onClick={() => setActiveFilter(filter)}
                      className={cn("app-segmented-button shrink-0", activeFilter === filter ? "app-segmented-button-active" : "")}
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

        <div className="flex min-h-0 flex-col overflow-hidden">
          <div className="app-scroll min-h-0 flex-1 px-1 pb-8">
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
