"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useQuery } from "convex/react";
import { FolderOpen, Plus, Sparkles } from "lucide-react";
import { api } from "../../../../convex/_generated/api";
import { DeadlineWidget } from "@/components/feed/DeadlineWidget";
import { RoomCard } from "@/components/rooms/RoomCard";
import { Skeleton } from "@/components/ui/Skeleton";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useTimedLoadState } from "@/hooks/useTimedLoadState";
import { getAi } from "@/lib/ai/client";
import type { AiBriefing, AiEnvelope } from "@/lib/ai/contracts";
import type { Post, Room } from "@/types";

function buildDashboardFallbackBriefing(rooms: Room[], deadlines: Post[]) {
  const topDeadlines = deadlines
    .slice(0, 3)
    .map((deadline) => deadline.deadlineTitle?.trim() || deadline.content.trim().slice(0, 80))
    .filter(Boolean);
  const roomNames = rooms.slice(0, 3).map((room) => room.name).filter(Boolean);

  return {
    summary:
      topDeadlines.length > 0
        ? `The current live focus is on ${topDeadlines.join(", ")}. ${rooms.length} room${rooms.length === 1 ? "" : "s"} are active, and the next best move is to review the nearest deadline first.`
        : roomNames.length > 0
          ? `You are active in ${roomNames.join(", ")}. Open a room to review the latest posts or create a deadline if you want the briefing to become more specific.`
          : "No room activity is visible yet. Join a room or add a deadline and the briefing will start reflecting live academic work.",
    priorities: [
      ...(topDeadlines.length > 0 ? topDeadlines.map((item) => `Review ${item}`) : []),
      ...(roomNames.length > 0 ? roomNames.map((item) => `Check ${item}`) : [])
    ].slice(0, 3),
    warnings:
      deadlines.length > 0
        ? deadlines
            .slice(0, 2)
            .map((deadline) => `Deadline signal: ${deadline.deadlineTitle?.trim() || deadline.content.trim().slice(0, 80)}.`)
        : []
  };
}

export default function DashboardRoutePage() {
  const user = useCurrentUser();
  const rooms = useQuery(api.rooms.getMyRooms);
  const deadlines = useQuery(api.posts.getUpcomingDeadlines, {});
  const roomsLoadState = useTimedLoadState(rooms);
  const deadlinesLoadState = useTimedLoadState(deadlines);
  const roomList = (rooms as Room[] | undefined) ?? [];
  const deadlineList = (deadlines as Post[] | undefined) ?? [];
  const fallbackBriefing = buildDashboardFallbackBriefing(roomList, deadlineList);
  const [briefing, setBriefing] = useState<AiEnvelope<AiBriefing> | null>(null);
  const [briefingError, setBriefingError] = useState("");
  const displayedBriefing = briefing?.data ?? fallbackBriefing;

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 2000);

    void getAi<AiBriefing>("/api/v1/ai/briefing", { signal: controller.signal })
      .then((payload) => {
        if (!cancelled) {
          setBriefing(payload);
          setBriefingError("");
        }
      })
      .catch((error) => {
        if (!cancelled) {
          const message =
            error instanceof DOMException && error.name === "AbortError"
              ? "AI briefing is taking longer than 2 seconds. Try again from the assistant panel."
              : error instanceof Error
                ? error.message
                : "Unable to load AI briefing.";
          setBriefingError(message);
        }
      })
      .finally(() => {
        window.clearTimeout(timeout);
      });

    return () => {
      cancelled = true;
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, []);

  return (
    <div className="app-scroll">
      <div className="page-wrap page-stack shell-content-column">
        <div className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
          <div className="spotlight-ring glass-panel page-hero">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="section-eyebrow text-[var(--app-primary-strong)]">Dashboard</p>
                <h1 className="fluid-title mt-2 font-bold text-white">
                  {user?.name ? `Welcome back, ${user.name.split(" ")[0]}` : "Your live academic workspace"}
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--app-text-soft)]">
                  Monitor rooms, catch deadlines early, and move between classes without losing context.
                </p>
              </div>
              <Link href="/rooms" className="app-button app-button-primary w-full sm:w-auto">
                <Plus size={16} />
                {user?.role === "pending" ? "Complete access setup" : "Create or join room"}
              </Link>
            </div>
            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              <StatCard label="Rooms" value={String(rooms?.length ?? 0)} detail="Active academic spaces" />
              <StatCard label="Deadlines" value={String(deadlines?.length ?? 0)} detail="Upcoming time-sensitive posts" />
              <StatCard label="Momentum" value={rooms && rooms.length > 0 ? "Live" : "Idle"} detail="Workspace engagement status" />
            </div>
            {user?.role === "pending" ? (
              <div className="mt-6 rounded-[24px] border border-amber-400/20 bg-amber-500/10 p-4 text-sm leading-7 text-[var(--app-text)]">
                Your account is still in pending access mode. Open Profile to finish student setup or request teacher approval before using governed workspace actions.
              </div>
            ) : null}
          </div>

          <div className="glass-panel ai-glow rounded-[var(--radius-panel)] p-6">
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-[var(--app-violet)]" />
              <p className="section-eyebrow">AI briefing</p>
            </div>
            {briefingError ? (
              <div className="mt-4 rounded-2xl border border-amber-400/20 bg-amber-500/10 p-4 text-sm text-[var(--app-text)]">
                <p className="font-medium text-white">Briefing fallback active</p>
                <p className="mt-1 text-sm leading-7 text-[var(--app-text-soft)]">{briefingError}</p>
              </div>
            ) : (
              <>
                <h2 className="mt-4 text-2xl font-bold text-white">
                  {displayedBriefing.summary?.trim() || fallbackBriefing.summary}
                </h2>
                <div className="mt-5 space-y-3">
                  {(displayedBriefing.priorities?.length ? displayedBriefing.priorities : fallbackBriefing.priorities).slice(0, 3).map((item) => (
                    <div key={item} className="panel-chip w-full justify-start rounded-2xl px-4 py-3 text-sm text-[var(--app-text-soft)]">
                      {item}
                    </div>
                  ))}
                </div>
                {(displayedBriefing.warnings?.length ?? 0) > 0 ? (
                  <div className="mt-5 rounded-2xl border border-amber-400/20 bg-amber-500/10 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-[var(--app-text)]">Warnings</p>
                    <div className="mt-2 space-y-2">
                      {displayedBriefing.warnings.map((item) => (
                        <p key={item} className="text-sm text-[var(--app-text-soft)]">
                          {item}
                        </p>
                      ))}
                    </div>
                  </div>
                ) : fallbackBriefing.warnings.length > 0 ? (
                  <div className="mt-5 rounded-2xl border border-amber-400/20 bg-amber-500/10 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-[var(--app-text)]">Warnings</p>
                    <div className="mt-2 space-y-2">
                      {fallbackBriefing.warnings.map((item) => (
                        <p key={item} className="text-sm text-[var(--app-text-soft)]">{item}</p>
                      ))}
                    </div>
                  </div>
                ) : null}
              </>
            )}
          </div>
        </div>

        {deadlinesLoadState.timedOut ? (
          <section className="glass-panel rounded-[var(--radius-panel)] p-6 text-sm text-[var(--app-text-soft)]">
            Deadline data is taking longer than expected. Refresh the page if this continues.
          </section>
        ) : deadlines && deadlines.length > 0 ? (
          <section className="page-stack">
            <div className="section-heading">
              <h2 className="section-eyebrow">Upcoming deadlines</h2>
            </div>
            <div className="smooth-x-scroll flex gap-4 pb-3">
              {(deadlines as Post[]).slice(0, 6).map((deadline) => (
                <DeadlineWidget key={deadline._id} post={deadline} />
              ))}
            </div>
          </section>
        ) : null}

        <section className="page-stack">
          <div className="section-heading">
            <h2 className="section-eyebrow">Your rooms</h2>
            <span className="text-sm text-[var(--app-text-muted)]">{rooms?.length ?? 0} active</span>
          </div>
          {roomsLoadState.isLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <Skeleton key={index} className="h-40 rounded-3xl" />
              ))}
            </div>
          ) : roomsLoadState.timedOut ? (
            <div className="glass-panel rounded-[var(--radius-panel)] p-8 text-sm text-[var(--app-text-soft)]">
              Room data is taking longer than expected. Refresh the page or open Rooms from the sidebar.
            </div>
          ) : roomList.length === 0 ? (
            <div className="glass-panel rounded-[var(--radius-panel)] p-8 text-center sm:p-10">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl border border-[var(--app-line)] bg-white/5 text-[var(--app-primary-strong)]">
                <FolderOpen size={26} />
              </div>
              <h3 className="mt-4 text-xl font-semibold text-white">No rooms yet</h3>
              <p className="mt-2 text-sm text-[var(--app-text-muted)]">
                Create a room for a subject or join a public room to start receiving live posts.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {roomList.map((room) => (
                <RoomCard key={room._id} room={room} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function StatCard({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="stat-card">
      <p className="text-xs uppercase tracking-[0.25em] text-[var(--app-text-muted)]">{label}</p>
      <p className="mt-4 text-3xl font-black text-[var(--app-text)]">{value}</p>
      <p className="mt-2 text-sm text-[var(--app-text-muted)]">{detail}</p>
    </div>
  );
}
