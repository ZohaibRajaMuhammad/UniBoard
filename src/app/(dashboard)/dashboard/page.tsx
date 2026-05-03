"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import { Plus } from "lucide-react";
import { api } from "../../../../convex/_generated/api";
import { DeadlineWidget } from "@/components/feed/DeadlineWidget";
import { RoomCard } from "@/components/rooms/RoomCard";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import type { Post, Room } from "@/types";

export default function DashboardRoutePage() {
  const user = useCurrentUser();
  const rooms = useQuery(api.rooms.getMyRooms);
  const deadlines = useQuery(api.posts.getUpcomingDeadlines, {});

  return (
    <div className="app-scroll">
      <div className="page-wrap page-stack">
        <div className="grid gap-5 xl:grid-cols-[1.3fr_0.7fr]">
          <div className="spotlight-ring glass-panel rounded-[var(--radius-panel)] p-6 sm:p-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="section-eyebrow text-brand-200">Dashboard</p>
                <h1 className="fluid-title mt-2 font-bold text-white">
                  {user?.name ? `Welcome back, ${user.name.split(" ")[0]}` : "Your live academic workspace"}
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-300">
                  Monitor rooms, catch deadlines early, and move between classes without losing context.
                </p>
              </div>
              <Link href="/rooms" className="app-button app-button-primary w-full sm:w-auto">
                <Plus size={16} />
                Create or join room
              </Link>
            </div>
            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              <div className="stat-card">
                <p className="text-xs uppercase tracking-[0.25em] text-gray-500">Rooms</p>
                <p className="mt-4 text-3xl font-black text-white">{rooms?.length ?? 0}</p>
                <p className="mt-2 text-sm text-gray-400">Active academic spaces</p>
              </div>
              <div className="stat-card">
                <p className="text-xs uppercase tracking-[0.25em] text-gray-500">Deadlines</p>
                <p className="mt-4 text-3xl font-black text-white">{deadlines?.length ?? 0}</p>
                <p className="mt-2 text-sm text-gray-400">Upcoming time-sensitive posts</p>
              </div>
              <div className="stat-card">
                <p className="text-xs uppercase tracking-[0.25em] text-gray-500">Momentum</p>
                <p className="mt-4 text-3xl font-black text-white">{rooms && rooms.length > 0 ? "Live" : "Idle"}</p>
                <p className="mt-2 text-sm text-gray-400">Workspace engagement status</p>
              </div>
            </div>
          </div>

          <div className="glass-panel rounded-[var(--radius-panel)] p-6">
            <p className="section-eyebrow">Operating note</p>
            <h2 className="mt-4 text-2xl font-bold text-white">Stay ahead of class churn.</h2>
            <p className="mt-3 text-sm leading-6 text-gray-400">
              Keep the dashboard open while your class is active. Convex updates room activity, unread counts,
              and posts in place, so the page acts more like an operations board than a static dashboard.
            </p>
            <div className="mt-6 space-y-3">
              {["Pin deadlines that drive behavior", "Encourage anonymous questions", "Use rooms as the official subject stream"].map((item) => (
                <div key={item} className="panel-chip w-full justify-start rounded-2xl px-4 py-3 text-sm text-gray-200">
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>

        {deadlines && deadlines.length > 0 ? (
          <section className="page-stack">
            <div className="section-heading">
              <h2 className="section-eyebrow">Upcoming deadlines</h2>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-3">
              {(deadlines as Post[]).slice(0, 6).map((deadline) => (
                <DeadlineWidget key={deadline._id} post={deadline} />
              ))}
            </div>
          </section>
        ) : null}

        <section className="page-stack">
          <div className="section-heading">
            <h2 className="section-eyebrow">Your rooms</h2>
            <span className="text-sm text-gray-500">{rooms?.length ?? 0} active</span>
          </div>
          {rooms === undefined ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="h-40 animate-pulse rounded-3xl bg-white/5" />
              ))}
            </div>
          ) : rooms.length === 0 ? (
            <div className="glass-panel rounded-[var(--radius-panel)] p-8 text-center sm:p-10">
              <div className="text-5xl">💬</div>
              <h3 className="mt-4 text-xl font-semibold">No rooms yet</h3>
              <p className="mt-2 text-sm text-gray-400">Create a room for a subject or join a public room to start receiving live posts.</p>
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
