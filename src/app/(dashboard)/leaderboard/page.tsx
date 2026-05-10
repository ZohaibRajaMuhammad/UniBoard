"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import { Crown, TrendingUp } from "lucide-react";
import { api } from "../../../../convex/_generated/api";
import { initials } from "@/lib/utils";

export default function LeaderboardPage() {
  const leaderboard = useQuery(api.reputation.getLeaderboard);

  return (
    <div className="app-scroll">
      <div className="page-wrap page-stack content-column">
        <section className="spotlight-ring glass-panel page-hero">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05]">
              <Crown size={20} className="text-[var(--app-gold)]" />
            </div>
            <div className="max-w-3xl">
              <p className="section-eyebrow text-[var(--app-gold)]">Leaderboard</p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight text-white">Prestige without visual noise.</h1>
              <p className="mt-2 text-sm leading-7 text-[var(--app-text-soft)]">
                Compare contribution strength, inspect momentum, and move from score visibility into deeper reputation detail.
              </p>
            </div>
          </div>
        </section>

        {leaderboard ? (
          <>
            <section className="grid gap-4 md:grid-cols-3">
              {leaderboard.slice(0, 3).map((entry: NonNullable<typeof leaderboard>[number]) => (
                <div key={entry.userId} className="glass-panel rounded-[28px] p-6">
                  <p className="text-xs uppercase tracking-[0.2em] text-[var(--app-text-muted)]">Rank {entry.rank}</p>
                  <div className="mt-4 flex h-14 w-14 items-center justify-center rounded-full border border-[rgba(213,178,122,0.24)] bg-[rgba(213,178,122,0.08)] text-lg font-semibold text-white">
                    {initials(entry.name)}
                  </div>
                  <p className="mt-4 text-xl font-semibold text-white">{entry.name}</p>
                  <p className="mt-1 text-sm text-[var(--app-text-muted)]">{entry.xp} XP</p>
                  <p className="mt-3 text-xs text-[var(--app-text-muted)]">{entry.posts} posts • {entry.comments} comments</p>
                </div>
              ))}
            </section>

            <section className="glass-panel rounded-[28px] p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-[var(--app-text-muted)]">Full ranking</p>
                  <h2 className="mt-2 text-2xl font-semibold text-white">Workspace standings</h2>
                </div>
                <Link href="/reputation" className="inline-flex items-center gap-2 text-sm font-medium text-[var(--app-primary-strong)] transition hover:text-white">
                  <TrendingUp size={14} />
                  Open my reputation
                </Link>
              </div>

              <div className="mt-5 space-y-3">
                {leaderboard.map((entry: NonNullable<typeof leaderboard>[number]) => (
                  <div key={entry.userId} className="flex flex-col gap-4 rounded-[24px] border border-[var(--app-line)] bg-black/20 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-4">
                      <div className="rounded-2xl bg-white/5 px-3 py-2 text-sm font-semibold text-white">#{entry.rank}</div>
                      <div className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 text-sm font-semibold text-white">
                        {initials(entry.name)}
                      </div>
                      <div>
                        <p className="font-medium text-white">{entry.name}</p>
                        <p className="mt-1 text-xs text-[var(--app-text-muted)]">{entry.posts} posts • {entry.comments} comments • {entry.upvotesReceived} upvotes</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={entry.momentum === "surging" ? "rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-medium text-emerald-100" : entry.momentum === "steady" ? "rounded-full bg-amber-500/15 px-3 py-1 text-xs font-medium text-amber-100" : "rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-[var(--app-text-soft)]"}>
                        {entry.momentum}
                      </span>
                      <span className="text-lg font-semibold text-white">{entry.xp} XP</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </>
        ) : (
          <div className="grid gap-4 md:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="h-36 animate-pulse rounded-[28px] bg-white/5" />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
