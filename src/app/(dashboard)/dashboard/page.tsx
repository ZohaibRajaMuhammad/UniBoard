"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useQuery } from "convex/react";
import { FolderOpen, Plus, Sparkles } from "lucide-react";
import { api } from "../../../../convex/_generated/api";
import { DeadlineWidget } from "@/components/feed/DeadlineWidget";
import { RoomCard } from "@/components/rooms/RoomCard";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { getAi } from "@/lib/ai/client";
import type { AiBriefing, AiEnvelope } from "@/lib/ai/contracts";
import type { Post, Room } from "@/types";

export default function DashboardRoutePage() {
  const user = useCurrentUser();
  const rooms = useQuery(api.rooms.getMyRooms);
  const deadlines = useQuery(api.posts.getUpcomingDeadlines, {});
  const [briefing, setBriefing] = useState<AiEnvelope<AiBriefing> | null>(null);
  const [briefingError, setBriefingError] = useState("");

  useEffect(() => {
    let cancelled = false;
    void getAi<AiBriefing>("/api/v1/ai/briefing")
      .then((payload) => {
        if (!cancelled) {
          setBriefing(payload);
          setBriefingError("");
        }
      })
      .catch((error) => {
        if (!cancelled) {
          setBriefingError(error instanceof Error ? error.message : "Unable to load AI briefing.");
        }
      });

    return () => {
      cancelled = true;
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
              <div className="mt-6 rounded-[24px] border border-amber-400/20 bg-amber-500/10 p-4 text-sm leading-7 text-amber-100">
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
              <div className="mt-4 rounded-2xl border border-red-400/20 bg-red-500/10 p-4 text-sm text-red-100">{briefingError}</div>
            ) : briefing === null ? (
              <div className="mt-4 h-40 animate-pulse rounded-2xl bg-white/5" />
            ) : (
              <>
                <h2 className="mt-4 text-2xl font-bold text-white">
                  {briefing.data?.summary?.trim() || "No briefing is available yet. Add deadlines or room activity to generate grounded guidance."}
                </h2>
                <div className="mt-5 space-y-3">
                  {(briefing.data?.priorities ?? []).slice(0, 3).map((item) => (
                    <div key={item} className="panel-chip w-full justify-start rounded-2xl px-4 py-3 text-sm text-[var(--app-text-soft)]">
                      {item}
                    </div>
                  ))}
                </div>
                {(briefing.data?.warnings?.length ?? 0) > 0 ? (
                  <div className="mt-5 rounded-2xl border border-amber-400/20 bg-amber-500/10 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-amber-100">Warnings</p>
                    <div className="mt-2 space-y-2">
                      {briefing.data?.warnings.map((item) => (
                        <p key={item} className="text-sm text-amber-50">
                          {item}
                        </p>
                      ))}
                    </div>
                  </div>
                ) : null}
              </>
            )}
          </div>
        </div>

        {deadlines && deadlines.length > 0 ? (
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
          {rooms === undefined ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="h-40 animate-pulse rounded-3xl bg-white/5" />
              ))}
            </div>
          ) : rooms.length === 0 ? (
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
              {(rooms as Room[]).map((room) => (
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
      <p className="mt-4 text-3xl font-black text-white">{value}</p>
      <p className="mt-2 text-sm text-[var(--app-text-muted)]">{detail}</p>
    </div>
  );
}
