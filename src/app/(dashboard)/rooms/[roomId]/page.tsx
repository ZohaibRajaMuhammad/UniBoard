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
  X
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import { api } from "../../../../../convex/_generated/api";
import type { Id } from "../../../../../convex/_generated/dataModel";
import { PinnedPostsBanner } from "@/components/feed/PinnedPostsBanner";
import { AssignmentSubmissionPanel } from "@/components/rooms/AssignmentSubmissionPanel";
import { PostComposer } from "@/components/feed/PostComposer";
import { PostFeed } from "@/components/feed/PostFeed";
import { useNotifier } from "@/components/providers/NotificationProvider";
import { PresenceBar } from "@/components/rooms/PresenceBar";
import { RoomHeader } from "@/components/rooms/RoomHeader";
import { ThemeToggle } from "@/components/system/ThemeToggle";
import { TeacherPanel } from "@/components/teacher/TeacherPanel";
import { Skeleton } from "@/components/ui/Skeleton";
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
    if (currentUser === undefined) {
      return;
    }

    void markSeen({ roomId });
  }, [currentUser, markSeen, roomId]);

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
      { label: "Members", value: `${room.memberCount} Active` },
      { label: "Posts", value: `${room.postCount} Published` },
      { label: "Format", value: room.isPublic ? "Public Workspace" : "Private Workspace" }
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
    return <Skeleton className="m-4 h-48 rounded-[28px] sm:m-6" />;
  }

  if (!room) {
    return <div className="flex flex-1 items-center justify-center text-[var(--app-text-muted)]">Room not found.</div>;
  }

  return (
    <div className="app-scroll relative flex min-h-full flex-1 overflow-y-auto">
      <div className="grid min-h-full flex-1 grid-rows-[auto_auto_auto_1fr]">
        <RoomHeader room={room} />
        <PresenceBar roomId={roomId} />

        <div className="border-b border-[var(--app-line)] bg-[var(--app-panel)] backdrop-blur-xl">
          <div className="page-wrap py-3">
            <div className="mx-auto flex w-full max-w-[90rem] flex-col gap-3">
            <div className="glass-panel w-full rounded-[18px] p-3 sm:p-3.5">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Sparkles size={14} className="text-[var(--app-violet)]" />
                    <p className="text-[11px] uppercase tracking-[0.2em] text-[var(--app-text-muted)]">Room intelligence</p>
                  </div>
                  <h2 className="mt-1 text-sm font-semibold text-white sm:text-base">Workspace overview</h2>
                </div>
                <ThemeToggle className="min-h-[2.35rem] shrink-0 rounded-full px-2 py-1.5" />
              </div>

              <div className="mt-2 rounded-[14px] border border-[var(--app-line)] bg-white/[0.04] px-3 py-2">
                <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-[var(--app-text-muted)]">
                  {room.aiEnabled ? (summaryError ? "AI status" : "AI enabled") : "AI disabled"}
                </p>
                <p className="mt-1 line-clamp-2 text-[11px] leading-4 text-[var(--app-text-soft)]">
                  {room.aiEnabled
                    ? summaryError
                      ? summaryError
                      : summary?.data?.summary ?? "Automated room assistance is currently active."
                    : "Manual room moderation is active."}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <span className={summary?.meta.mode === "fallback" ? "app-chip py-1 px-2 text-[10px] border-amber-400/20 bg-amber-500/10 text-[var(--app-text)]" : "app-chip py-1 px-2 text-[10px]"}>
                    {room.aiEnabled ? (summary?.meta.mode === "fallback" ? "Deterministic mode" : "AI grounded") : "AI disabled"}
                  </span>
                  {hasPinnedPosts ? <span className="app-chip py-1 px-2 text-[10px]">{pinnedPosts?.length} pinned</span> : null}
                </div>
              </div>

              <div className="mt-2">
                <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-[var(--app-text-muted)]">Metrics</p>
                <div className="mt-2 grid gap-2 sm:grid-cols-3">
                  {roomStats.map((item) => (
                    <div key={item.label} className="stat-card px-3 py-2">
                      <p className="text-[9px] uppercase tracking-[0.22em] text-[var(--app-text-muted)]">{item.label}</p>
                      <p className="mt-1 text-xs font-semibold text-[var(--app-text)]">{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-3">
                <AssignmentSubmissionPanel roomId={roomId} roomName={room.name} canReview={canModerateRoom} />
              </div>

              <div className="mt-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--app-text-muted)]">Feed navigation</p>
                <div className="mt-2 grid gap-2">
                  {ROOM_VIEWS.map((view) => (
                    <button
                      key={view}
                      type="button"
                      onClick={() => (view === "overview" ? setActiveView(view) : openFeed(view))}
                      className={cn(
                        "app-segmented-button w-full justify-start",
                        activeView === view ? "app-segmented-button-active" : ""
                      )}
                      aria-pressed={activeView === view}
                    >
                      <LayoutPanelTop size={14} />
                      {view === "overview" ? "Overview" : view === "split" ? "Split Feed" : "Full Feed"}
                    </button>
                  ))}
                  {canModerateRoom ? (
                    <button
                      type="button"
                      onClick={() => setTeacherPanelOpen((current) => !current)}
                      className={cn("app-segmented-button shrink-0", teacherPanelOpen ? "app-segmented-button-active" : "")}
                      aria-expanded={teacherPanelOpen}
                      aria-controls="teacher-panel"
                    >
                      <ShieldCheck size={14} />
                      {teacherPanelOpen ? "Hide Teacher" : "Teacher"}
                      {teacherPanelOpen ? <PanelRightClose size={14} /> : <PanelRightOpen size={14} />}
                    </button>
                  ) : null}
                </div>
              </div>

                <div className="mt-3">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--app-text-muted)]">Primary actions</p>
                <div className="mt-2 grid gap-2">
                  <button type="button" onClick={() => setComposerOpen(true)} className="app-button app-button-primary min-h-[2.75rem] w-full justify-start rounded-2xl px-4 py-2 text-sm">
                    <PlusSquare size={14} />
                    New post
                  </button>
                  {showFeed ? (
                    <Link href="#room-post-list" className="app-button app-button-secondary min-h-[2.75rem] w-full justify-between rounded-2xl px-4 py-2 text-sm">
                      Jump into posts
                      <ArrowDown size={14} />
                    </Link>
                  ) : null}
                </div>
              </div>

              <div className="mt-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--app-text-muted)]">Feed filters</p>
                <div className="smooth-x-scroll mt-2 flex gap-2 pb-0.5">
                  {FEED_FILTERS.map((filter) => {
                    const FilterIcon = filter === "all" ? null : getPostTypeIcon(filter);
                    return (
                      <button
                        key={filter}
                        type="button"
                        onClick={() => setActiveFilter(filter)}
                        className={cn("app-filter-pill min-h-[2.1rem] text-xs", activeFilter === filter ? "app-filter-pill-active" : "")}
                      >
                        {FilterIcon ? <FilterIcon size={13} /> : null}
                        {filter === "all" ? "All" : POST_TYPE_CONFIG[filter].label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
            </div>
          </div>
        </div>

        {showFeed ? (
          <div className="flex flex-col">
            <div
              className={cn(
                "mx-auto grid w-full flex-1 max-w-[90rem] gap-5 px-0",
                activeView === "split" ? "xl:grid-cols-[minmax(0,1fr)_18.5rem]" : ""
              )}
            >
              <div ref={feedSectionRef} className="min-w-0">
                <div className="px-1 pb-8">
                  <section id="room-post-list" className="mx-auto w-full max-w-none scroll-mt-4 px-4 pt-3 sm:px-6">
                    <div className="sticky top-0 z-10 -mx-1 px-1 pb-3">
                      <div className="glass-panel rounded-[26px] border border-[var(--app-line)] bg-[var(--app-panel-strong)]/88 p-3 shadow-[0_18px_40px_rgba(8,16,30,0.18)] backdrop-blur-xl sm:p-4">
                        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                          <div>
                          <p className="text-[11px] uppercase tracking-[0.24em] text-[var(--app-text-muted)]">Live discussion</p>
                          <h3 className="mt-1 text-lg font-semibold text-white">Posts, comments, and uploads</h3>
                          <p className="mt-1 text-sm leading-6 text-[var(--app-text-soft)]">
                            {activeView === "split"
                              ? "The discussion stream stays primary while room context remains visible on the right."
                              : "Full feed mode keeps attention on continuous reading, comments, and posting."}
                          </p>
                            <div className="mt-2 flex flex-wrap gap-2">
                              <span className="app-chip">{activeFilterLabel}</span>
                              <span className="app-chip">{posts?.length ?? 0} visible posts</span>
                              {hasPinnedPosts ? <span className="app-chip">{pinnedPosts?.length} pinned references</span> : null}
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <button type="button" onClick={() => setComposerOpen(true)} className="app-button app-button-primary min-h-[2.6rem] rounded-2xl px-4 py-2 text-sm">
                              <PlusSquare size={14} />
                              New post
                            </button>
                            {activeView === "split" ? (
                              <button type="button" onClick={() => setActiveView("feed")} className="app-button app-button-secondary min-h-[2.6rem] rounded-2xl px-4 py-2 text-sm">
                                Full feed
                              </button>
                            ) : (
                              <button type="button" onClick={() => openFeed("split")} className="app-button app-button-secondary min-h-[2.6rem] rounded-2xl px-4 py-2 text-sm">
                                Split feed
                              </button>
                            )}
                            <button type="button" onClick={() => setActiveView("overview")} className="app-button app-button-secondary min-h-[2.6rem] rounded-2xl px-4 py-2 text-sm">
                              Room overview
                            </button>
                          </div>
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

              {activeView === "split" ? (
                <aside className="hidden border-l border-[var(--app-line)] bg-[var(--app-bg-strong)]/55 xl:block xl:-ml-3">
                  <div className="px-3 py-5">
                    <div className="sticky top-4 grid gap-4">
                        <section className="glass-panel rounded-[28px] p-5">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-[11px] uppercase tracking-[0.24em] text-[var(--app-text-muted)]">Room summary</p>
                              <h3 className="mt-2 text-lg font-semibold text-white">Keep orientation while reading</h3>
                            </div>
                            <Sparkles size={16} className="text-[var(--app-violet)]" />
                          </div>
                          {hasSummary ? (
                            summaryError ? (
                              <p className="mt-4 text-sm text-[var(--app-danger)]">{summaryError}</p>
                            ) : (
                              <p className="mt-4 text-sm leading-7 text-[var(--app-text-soft)]">{summary?.data?.summary}</p>
                            )
                          ) : (
                            <p className="mt-4 text-sm leading-7 text-[var(--app-text-soft)]">
                              Use this panel to keep room context visible while the main feed stays in focus.
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
                        </section>

                        {(summary?.data?.openQuestions?.length ?? 0) > 0 ? (
                          <section className="glass-panel rounded-[28px] p-5">
                            <div className="flex items-center gap-2">
                              <MessageSquareText size={15} className="text-[var(--app-primary-strong)]" />
                              <p className="text-[11px] uppercase tracking-[0.24em] text-[var(--app-text-muted)]">Open questions</p>
                            </div>
                            <div className="mt-3 grid gap-2">
                              {summary?.data?.openQuestions?.slice(0, 3).map((item) => (
                                <div key={item} className="app-surface-soft flex items-start gap-2 rounded-[20px] px-3 py-3 text-sm leading-6 text-[var(--app-text-soft)]">
                                  <span className="mt-[0.45rem] h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--app-primary-strong)]" />
                                  <p>{item}</p>
                                </div>
                              ))}
                            </div>
                          </section>
                        ) : null}

                        <section className="glass-panel rounded-[28px] p-5">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-[11px] uppercase tracking-[0.24em] text-[var(--app-text-muted)]">Context controls</p>
                              <h3 className="mt-2 text-lg font-semibold text-white">Feed controls</h3>
                            </div>
                            <ListFilter size={18} className="text-[var(--app-primary-strong)]" />
                          </div>
                          <div className="mt-4 rounded-[22px] border border-[var(--app-line)] bg-white/5 px-4 py-3 text-sm text-[var(--app-text-soft)]">
                            Active filter: <span className="font-semibold text-white">{activeFilterLabel}</span>
                          </div>
                        </section>

                        {hasPinnedPosts ? (
                          <section className="glass-panel rounded-[28px] p-4">
                            <p className="text-[11px] uppercase tracking-[0.24em] text-[var(--app-text-muted)]">Pinned context</p>
                            <div className="mt-3">
                              <PinnedPostsBanner posts={pinnedPosts ?? []} />
                            </div>
                          </section>
                        ) : null}
                    </div>
                  </div>
                </aside>
              ) : null}
            </div>
          </div>
        ) : (
          <div className="app-scroll">
            <div className="page-wrap py-5">
            <div className="mx-auto grid w-full max-w-[90rem] gap-4 xl:grid-cols-[minmax(0,1.28fr)_22rem]">
                <section className="glass-panel rounded-[30px] p-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.24em] text-[var(--app-text-muted)]">Overview mode</p>
                      <h3 className="mt-2 text-lg font-semibold text-white">Room context first, feed one step away</h3>
                      <p className="mt-2 max-w-3xl text-sm leading-7 text-[var(--app-text-soft)]">
                        Use overview when you need a fast room read. Open split or full feed mode as soon as you want continuous post reading.
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

                  <div className="mt-5 grid gap-3 lg:grid-cols-[minmax(0,1.08fr)_minmax(17rem,0.92fr)]">
                    <div className="app-surface-muted rounded-[24px] p-5">
                      <p className="text-[11px] uppercase tracking-[0.24em] text-[var(--app-text-muted)]">What matters now</p>
                      <p className="mt-3 text-sm leading-7 text-[var(--app-text-soft)]">
                        {room.aiEnabled
                          ? summary?.data?.summary ?? "Preparing the grounded summary for this room."
                          : "Room AI is disabled. Use posts, pinned guidance, and filters directly."}
                      </p>
                    </div>
                    <div className="grid gap-3">
                      {roomStats.map((item) => (
                        <div key={item.label} className="stat-card">
                          <p className="text-[11px] uppercase tracking-[0.24em] text-[var(--app-text-muted)]">{item.label}</p>
                          <p className="mt-2 text-lg font-semibold text-[var(--app-text)]">{item.value}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-5 grid gap-3">
                    {posts === undefined ? (
                      Array.from({ length: 3 }).map((_, index) => (
                        <Skeleton key={index} className="h-24 rounded-[22px]" />
                      ))
                    ) : previewPosts.length > 0 ? (
                      previewPosts.map((post) => (
                        <button key={post._id} type="button" onClick={() => openFeed("feed")} className="text-left">
                          <div className="app-surface-soft rounded-[24px] px-4 py-4 transition hover:bg-white/[0.08]">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="app-chip">{POST_TYPE_CONFIG[post.type as keyof typeof POST_TYPE_CONFIG]?.label ?? post.type}</span>
                              <span className="text-xs text-[var(--app-text-muted)]">{post.commentCount ?? 0} comments</span>
                              {post.isPinned ? <span className="app-chip">Pinned</span> : null}
                            </div>
                            <p className="mt-3 line-clamp-3 text-sm leading-7 text-[var(--app-text-soft)]">{post.content}</p>
                          </div>
                        </button>
                      ))
                    ) : (
                      <div className="app-surface-soft rounded-[24px] px-4 py-5 text-[var(--app-text-soft)]">
                        No visible posts yet. Open the composer to start the room feed.
                      </div>
                    )}
                  </div>
                </section>

                <aside className="grid gap-4">
                  <section className="glass-panel rounded-[30px] p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-[11px] uppercase tracking-[0.24em] text-[var(--app-text-muted)]">How scrolling works</p>
                        <h3 className="mt-2 text-lg font-semibold text-white">Make the feed obvious</h3>
                      </div>
                      <Eye size={18} className="text-[var(--app-primary-strong)]" />
                    </div>
                    <div className="mt-4 space-y-3 text-sm leading-7 text-[var(--app-text-soft)]">
                      <p>Use <span className="font-semibold text-white">split view</span> to read posts while keeping room context visible.</p>
                      <p>Use <span className="font-semibold text-white">full feed</span> when you want uninterrupted scrolling through posts and comments.</p>
                      <p>The preview cards on the left open the feed directly.</p>
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
            </div>
          </div>
        )}
      </div>

      <Dialog.Root open={composerOpen} onOpenChange={setComposerOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="app-dialog-overlay fixed inset-0 z-40 bg-[rgba(7,17,26,0.36)] backdrop-blur-[2px]" />
          <Dialog.Content className="app-dialog-content fixed inset-x-4 top-1/2 z-50 max-h-[calc(100dvh-2rem)] w-auto overflow-y-auto rounded-[1.75rem] sm:left-1/2 sm:w-[min(68rem,calc(100vw-2rem))]">
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
              "fixed inset-y-0 right-0 z-40 flex w-full max-w-[24rem] shrink-0 border-l border-[var(--app-line)] bg-[var(--app-panel-strong)] shadow-[0_28px_80px_rgba(8,16,30,0.34)] transition-transform duration-300 xl:absolute 2xl:relative 2xl:inset-auto 2xl:max-w-[23rem] 2xl:shadow-none",
              teacherPanelOpen ? "translate-x-0" : "translate-x-full 2xl:hidden"
            )}
          >
            <TeacherPanel roomId={roomId} onClose={() => setTeacherPanelOpen(false)} />
          </aside>

          {!teacherPanelOpen ? (
            <button
              type="button"
              onClick={() => setTeacherPanelOpen(true)}
              className="fixed bottom-28 right-6 z-20 hidden items-center gap-2 rounded-full border border-[rgba(49,92,243,0.16)] bg-[var(--app-panel-strong)] px-4 py-3 text-sm font-semibold text-[var(--app-primary-strong)] shadow-[0_18px_44px_rgba(8,16,30,0.24)] backdrop-blur xl:inline-flex"
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
