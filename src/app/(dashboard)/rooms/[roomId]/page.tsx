"use client";

import * as Dialog from "@radix-ui/react-dialog";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import {
  ArrowDown,
  ChevronRight,
  Eye,
  LayoutPanelTop,
  ListFilter,
  MessageSquareText,
  PanelRightClose,
  PanelRightOpen,
  PlusSquare,
  ShieldCheck,
  Sparkles,
  Users2,
  X
} from "lucide-react";
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
const ROOM_VIEWS = ["overview", "split", "feed"] as const;

export default function RoomPage({ params }: { params: { roomId: string } }) {
  const { notify } = useNotifier();
  const roomId = params.roomId as Id<"rooms">;
  const searchParams = useSearchParams();
  const currentUser = useCurrentUser();
  const [activeFilter, setActiveFilter] = useState<(typeof FEED_FILTERS)[number]>("all");
  const [activeView, setActiveView] = useState<(typeof ROOM_VIEWS)[number]>("split");
  const [teacherPanelOpen, setTeacherPanelOpen] = useState(false);
  const [composerOpen, setComposerOpen] = useState(false);
  const feedSectionRef = useRef<HTMLDivElement | null>(null);
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

    setActiveView("feed");

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
  const hasPinnedPosts = (pinnedPosts?.length ?? 0) > 0;
  const hasSummary = (room?.aiEnabled ?? false) && (summary !== null || Boolean(summaryError));
  const showFeed = activeView !== "overview";
  const activeFilterLabel = activeFilter === "all" ? "All posts" : POST_TYPE_CONFIG[activeFilter].label;
  const previewPosts = (posts ?? []).slice(0, 3);

  function openFeed(view: (typeof ROOM_VIEWS)[number] = "split") {
    setActiveView(view);

    window.setTimeout(() => {
      feedSectionRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    }, 80);
  }

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
            <div className="grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(18rem,0.8fr)]">
              <section className="rounded-[32px] border border-[rgba(109,140,255,0.18)] bg-[linear-gradient(135deg,rgba(255,255,255,0.94),rgba(246,248,252,0.9))] p-5 shadow-[0_18px_36px_rgba(79,96,151,0.08)] dark:bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))]">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="max-w-2xl">
                    <div className="flex items-center gap-2">
                      <Sparkles size={15} className="text-[var(--app-violet)]" />
                      <p className="text-xs uppercase tracking-[0.2em] text-[var(--app-text-soft)]">Room intelligence</p>
                    </div>
                    <h2 className="mt-2 text-2xl font-semibold text-[var(--app-text)] dark:text-white">See the room state fast, then move straight into the feed.</h2>
                    <p className="mt-2 text-sm leading-7 text-[var(--app-text-soft)]">
                      Uniboard keeps the room summary and controls visible, but the post stream remains the main working surface for reading, commenting, and collaboration.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <span className={summary?.meta.mode === "fallback" ? "app-chip border-amber-400/20 bg-amber-500/10 text-[var(--app-text)]" : "app-chip"}>
                      {room.aiEnabled ? (summary?.meta.mode === "fallback" ? "Deterministic mode" : "AI grounded") : "AI disabled"}
                    </span>
                    {hasPinnedPosts ? <span className="app-chip">{pinnedPosts?.length} pinned</span> : null}
                  </div>
                </div>

                <div className="mt-5 grid gap-3 lg:grid-cols-[minmax(0,1.1fr)_minmax(18rem,0.9fr)]">
                  <div className="rounded-[26px] border border-[var(--app-line)] bg-white/50 p-5 dark:bg-white/[0.03]">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--app-text-muted)]">AI-generated summary</p>
                        <h3 className="mt-2 text-lg font-semibold text-[var(--app-text)] dark:text-white">What matters here right now</h3>
                      </div>
                      {room.aiEnabled ? null : <span className="app-chip">Manual mode</span>}
                    </div>

                    {room.aiEnabled ? (
                      summaryError ? (
                        <p className="mt-4 text-sm text-red-200">{summaryError}</p>
                      ) : summary === null ? (
                        <div className="mt-4 h-24 animate-pulse rounded-[22px] bg-white/5" />
                      ) : (
                        <>
                          <p className="mt-4 text-sm leading-7 text-[var(--app-text)] dark:text-[var(--app-text-soft)]">{summary.data?.summary}</p>
                          {(summary.data?.keyPoints?.length ?? 0) > 0 ? (
                            <div className="mt-4 flex flex-wrap gap-2">
                              {summary.data?.keyPoints.slice(0, 5).map((item) => (
                                <span key={item} className="panel-chip rounded-2xl px-3 py-2 text-xs">
                                  {item}
                                </span>
                              ))}
                            </div>
                          ) : null}
                        </>
                      )
                    ) : (
                      <p className="mt-4 text-sm leading-7 text-[var(--app-text-soft)]">
                        Room AI is disabled, so the overview relies on visible room metadata, presence, and manual filters.
                      </p>
                    )}
                  </div>

                  <div className="grid gap-3">
                    <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
                      {roomStats.map((item) => (
                        <div key={item.label} className="stat-card">
                          <p className="text-[11px] uppercase tracking-[0.24em] text-[var(--app-text-muted)]">{item.label}</p>
                          <p className="mt-2 text-lg font-semibold text-[var(--app-text)]">{item.value}</p>
                        </div>
                      ))}
                    </div>

                    <div className="rounded-[26px] border border-[var(--app-line)] bg-white/50 p-4 dark:bg-white/[0.03]">
                      <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--app-text-muted)]">
                        <Users2 size={14} />
                        Presence and tools
                      </div>
                      <p className="mt-3 text-sm leading-7 text-[var(--app-text-soft)]">
                        Use this side of the room to stay oriented while the discussion feed remains the primary reading and action surface.
                      </p>
                    </div>
                  </div>
                </div>

                {(summary?.data?.openQuestions?.length ?? 0) > 0 ? (
                  <div className="mt-4 rounded-[24px] border border-[var(--app-line)] bg-white/50 p-4 dark:bg-white/[0.03]">
                    <div className="flex items-center gap-2">
                      <MessageSquareText size={15} className="text-[var(--app-primary-strong)]" />
                      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--app-text-muted)]">Open questions</p>
                    </div>
                    <div className="mt-3 grid gap-2">
                      {summary?.data?.openQuestions?.slice(0, 3).map((item) => (
                        <div key={item} className="flex items-start gap-2 rounded-[20px] border border-[var(--app-line)] bg-white/45 px-3 py-3 text-sm leading-6 text-[var(--app-text-soft)] dark:bg-white/[0.03]">
                          <span className="mt-[0.45rem] h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--app-primary-strong)]" />
                          <p>{item}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </section>

              <aside className="grid gap-4">
                <section className="glass-panel rounded-[30px] p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.24em] text-[var(--app-text-muted)]">View mode</p>
                      <h3 className="mt-2 text-lg font-semibold text-white">Control room depth</h3>
                    </div>
                    <LayoutPanelTop size={18} className="text-[var(--app-primary-strong)]" />
                  </div>
                  <div className="mt-4 grid gap-2">
                    {ROOM_VIEWS.map((view) => (
                      <button
                        key={view}
                        type="button"
                        onClick={() => setActiveView(view)}
                        className={cn("flex items-center justify-between rounded-[20px] border px-4 py-3 text-left transition", activeView === view ? "border-[rgba(77,117,255,0.48)] bg-[rgba(77,117,255,0.14)] text-white" : "border-[var(--app-line)] bg-white/5 text-[var(--app-text-soft)] hover:bg-white/10")}
                        aria-pressed={activeView === view}
                      >
                        <div>
                          <p className="text-sm font-semibold capitalize">{view}</p>
                          <p className="mt-1 text-xs text-[var(--app-text-muted)]">
                            {view === "overview"
                              ? "Summary, presence, and filters only"
                              : view === "split"
                                ? "Keep context visible while opening the feed"
                                : "Focus directly on posts and comments"}
                          </p>
                        </div>
                        <ChevronRight size={16} />
                      </button>
                    ))}
                  </div>
                </section>

                <section className="glass-panel rounded-[30px] p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.24em] text-[var(--app-text-muted)]">Context controls</p>
                      <h3 className="mt-2 text-lg font-semibold text-white">Filter before opening the feed</h3>
                    </div>
                    <ListFilter size={18} className="text-[var(--app-primary-strong)]" />
                  </div>
                  <div className="mt-4 smooth-x-scroll flex gap-2 pb-1">
                    {canModerateRoom ? (
                      <button
                        type="button"
                        onClick={() => setTeacherPanelOpen((current) => !current)}
                        className={cn("app-segmented-button shrink-0", teacherPanelOpen ? "app-segmented-button-active" : "")}
                        aria-expanded={teacherPanelOpen}
                        aria-controls="teacher-panel"
                      >
                        <ShieldCheck size={14} />
                        {teacherPanelOpen ? "Hide teacher panel" : "Teacher panel"}
                        {teacherPanelOpen ? <PanelRightClose size={14} /> : <PanelRightOpen size={14} />}
                      </button>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => setComposerOpen(true)}
                      className="app-segmented-button app-segmented-button-active shrink-0"
                    >
                      <PlusSquare size={14} />
                      Compose
                    </button>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {FEED_FILTERS.map((filter) => {
                      const FilterIcon = filter === "all" ? null : getPostTypeIcon(filter);
                      return (
                        <button
                          key={filter}
                          type="button"
                          onClick={() => setActiveFilter(filter)}
                          className={cn("app-filter-pill", activeFilter === filter ? "app-filter-pill-active" : "")}
                        >
                          {FilterIcon ? <FilterIcon size={14} /> : null}
                          {filter === "all" ? "All posts" : POST_TYPE_CONFIG[filter].label}
                        </button>
                      );
                    })}
                  </div>
                  <div className="mt-4 rounded-[22px] border border-[var(--app-line)] bg-white/5 px-4 py-3 text-sm text-[var(--app-text-soft)]">
                    Active filter: <span className="font-semibold text-white">{activeFilterLabel}</span>
                  </div>
                </section>

                {hasPinnedPosts ? (
                  <section className="glass-panel rounded-[30px] p-4">
                    <p className="text-[11px] uppercase tracking-[0.24em] text-[var(--app-text-muted)]">Pinned context</p>
                    <div className="mt-3">
                      <PinnedPostsBanner posts={pinnedPosts ?? []} />
                    </div>
                  </section>
                ) : null}
              </aside>
            </div>

            {!showFeed ? (
              <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1.25fr)_minmax(18rem,0.75fr)]">
                <section className="rounded-[30px] border border-dashed border-[var(--app-line-strong)] bg-white/40 px-5 py-5 text-sm text-[var(--app-text-soft)] dark:bg-white/[0.03]">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.24em] text-[var(--app-text-muted)]">Feed preview</p>
                      <p className="mt-2 max-w-3xl leading-7">
                        The room opens in overview mode to reduce cognitive load, but the post stream stays one action away. Preview the latest activity here, then expand into a scrollable feed when you need full discussion detail.
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button type="button" onClick={() => openFeed("split")} className="app-button app-button-secondary self-start">
                        Open split view
                        <ChevronRight size={15} />
                      </button>
                      <button type="button" onClick={() => openFeed("feed")} className="app-button app-button-primary self-start">
                        Full feed
                        <ArrowDown size={15} />
                      </button>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-3">
                    {posts === undefined ? (
                      Array.from({ length: 3 }).map((_, index) => (
                        <div key={index} className="h-24 animate-pulse rounded-[22px] bg-white/10" />
                      ))
                    ) : previewPosts.length > 0 ? (
                      previewPosts.map((post) => (
                        <button
                          key={post._id}
                          type="button"
                          onClick={() => openFeed("feed")}
                          className="text-left"
                        >
                          <div className="rounded-[24px] border border-[var(--app-line)] bg-white/60 px-4 py-4 transition hover:bg-white/80 dark:bg-white/[0.04] dark:hover:bg-white/[0.06]">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="app-chip">{POST_TYPE_CONFIG[post.type as keyof typeof POST_TYPE_CONFIG]?.label ?? post.type}</span>
                              <span className="text-xs text-[var(--app-text-muted)]">{post.commentCount ?? 0} comments</span>
                              {post.isPinned ? <span className="app-chip">Pinned</span> : null}
                            </div>
                            <p className="mt-3 line-clamp-3 text-sm leading-7 text-[var(--app-text)] dark:text-[var(--app-text-soft)]">{post.content}</p>
                          </div>
                        </button>
                      ))
                    ) : (
                      <div className="rounded-[24px] border border-[var(--app-line)] bg-white/50 px-4 py-5 text-[var(--app-text-soft)] dark:bg-white/[0.03]">
                        No visible posts yet. Open the composer to start the room feed.
                      </div>
                    )}
                  </div>
                </section>

                <aside className="glass-panel rounded-[30px] p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.24em] text-[var(--app-text-muted)]">How scrolling works</p>
                      <h3 className="mt-2 text-lg font-semibold text-white">Make the feed obvious</h3>
                    </div>
                    <Eye size={18} className="text-[var(--app-primary-strong)]" />
                  </div>
                  <div className="mt-4 space-y-3 text-sm leading-7 text-[var(--app-text-soft)]">
                    <p>Use <span className="font-semibold text-white">split view</span> to keep the summary visible while scrolling posts.</p>
                    <p>Use <span className="font-semibold text-white">full feed</span> when you want continuous reading through posts and comments.</p>
                    <p>The latest activity preview above is clickable and takes you directly into the feed section.</p>
                  </div>
                  <div className="mt-4 rounded-[22px] border border-[var(--app-line)] bg-white/5 px-4 py-3 text-sm text-[var(--app-text-soft)]">
                    Current room activity: <span className="font-semibold text-white">{room.postCount} posts</span>
                  </div>
                </aside>
              </div>
            ) : (
              <div
                ref={feedSectionRef}
                className="room-feed-anchor mt-4 rounded-[26px] border border-[var(--app-line)] bg-white/45 px-5 py-4 dark:bg-white/[0.03]"
              >
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.24em] text-[var(--app-text-muted)]">Room feed</p>
                    <h3 className="mt-1 text-lg font-semibold text-[var(--app-text)] dark:text-white">
                      The post stream is the main workspace here
                    </h3>
                    <p className="mt-2 text-sm leading-7 text-[var(--app-text-soft)]">
                      {activeView === "split"
                        ? "You are in split view. Posts remain the primary surface while room context stays available beside them."
                        : "You are in full feed mode. Scroll continuously through posts, comments, and uploads."}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={() => setActiveView("overview")} className="app-button app-button-secondary">
                      Back to overview
                    </button>
                    {activeView === "split" ? (
                      <button type="button" onClick={() => setActiveView("feed")} className="app-button app-button-primary">
                        Full feed mode
                      </button>
                    ) : (
                      <button type="button" onClick={() => setActiveView("split")} className="app-button app-button-primary">
                        Split view mode
                      </button>
                    )}
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-[var(--app-line)] pt-4">
                  <span className="app-chip">{activeFilterLabel}</span>
                  <span className="app-chip">{room.postCount} posts in room</span>
                  <span className="app-chip">{room.memberCount} members</span>
                  {hasPinnedPosts ? <span className="app-chip">{pinnedPosts?.length} pinned</span> : null}
                  <Link href="#room-post-list" className="app-button app-button-secondary ml-auto min-h-[2.5rem] rounded-2xl px-3 py-2 text-sm">
                    Jump into posts
                    <ArrowDown size={14} />
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>

        {showFeed ? (
          <div className="flex min-h-0 flex-col overflow-hidden">
            <div className={cn("grid min-h-0 flex-1 gap-0", activeView === "split" ? "xl:grid-cols-[minmax(20rem,0.72fr)_minmax(0,1.45fr)]" : "")}>
              {activeView === "split" ? (
                <aside className="hidden border-r border-[var(--app-line)] bg-[rgba(255,255,255,0.42)] xl:block">
                  <div className="app-scroll h-full">
                    <div className="page-wrap py-5">
                      <div className="glass-panel sticky top-5 rounded-[28px] p-5">
                        <p className="text-[11px] uppercase tracking-[0.24em] text-[var(--app-text-muted)]">Split view context</p>
                        <h3 className="mt-2 text-lg font-semibold text-white">Keep orientation while reviewing posts</h3>
                        {hasSummary ? (
                          summaryError ? (
                            <p className="mt-4 text-sm text-red-200">{summaryError}</p>
                          ) : (
                            <p className="mt-4 text-sm leading-7 text-[var(--app-text-soft)]">{summary?.data?.summary}</p>
                          )
                        ) : (
                          <p className="mt-4 text-sm leading-7 text-[var(--app-text-soft)]">
                            Use the feed to inspect details while this panel preserves room-level context and the active filter.
                          </p>
                        )}
                        {(summary?.data?.keyPoints?.length ?? 0) > 0 ? (
                          <div className="mt-4 flex flex-wrap gap-2">
                            {summary?.data?.keyPoints?.slice(0, 4).map((item) => (
                              <span key={item} className="panel-chip rounded-2xl px-3 py-2 text-xs">
                                {item}
                              </span>
                            ))}
                          </div>
                        ) : null}
                        <div className="mt-5 rounded-[22px] border border-[var(--app-line)] bg-white/5 px-4 py-3 text-sm text-[var(--app-text-soft)]">
                          Current feed filter: <span className="font-semibold text-white">{activeFilterLabel}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </aside>
              ) : null}

              <div className="min-h-0 overflow-hidden">
                <div className="app-scroll min-h-0 h-full px-1 pb-8">
                  <section id="room-post-list" className="mx-auto w-full max-w-[62rem] px-4 pt-5 sm:px-6">
                    <div className="rounded-[26px] border border-[var(--app-line)] bg-white/45 px-4 py-4 dark:bg-white/[0.03]">
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                          <p className="text-[11px] uppercase tracking-[0.24em] text-[var(--app-text-muted)]">Live discussion</p>
                          <h4 className="mt-1 text-lg font-semibold text-[var(--app-text)] dark:text-white">Posts, comments, and uploads</h4>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <button type="button" onClick={() => setComposerOpen(true)} className="app-button app-button-primary min-h-[2.6rem] rounded-2xl px-4 py-2 text-sm">
                            <PlusSquare size={14} />
                            New post
                          </button>
                          <button type="button" onClick={() => setActiveView("overview")} className="app-button app-button-secondary min-h-[2.6rem] rounded-2xl px-4 py-2 text-sm">
                            Room overview
                          </button>
                        </div>
                      </div>
                    </div>
                  </section>
                  <PostFeed
                    posts={posts}
                    roomId={roomId}
                    emptyStateLabel={activeFilter === "all" ? "No posts yet" : `No ${activeFilter} posts yet`}
                    highlightedPostId={highlightedPostId ?? undefined}
                  />
                </div>
              </div>
            </div>
          </div>
        ) : null}
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
