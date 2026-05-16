"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useQuery } from "convex/react";
import { Crown, Medal, Sparkles, TrendingUp, Trophy } from "lucide-react";
import { api } from "../../../../convex/_generated/api";
import { initials } from "@/lib/utils";

type Scope = "all" | "surging";
type LeaderboardEntry = {
  userId: string;
  rank: number;
  name: string;
  xp: number;
  posts: number;
  comments: number;
  upvotesReceived: number;
  momentum: string;
};

export default function LeaderboardPage() {
  const leaderboard = useQuery(api.reputation.getLeaderboard);
  const [scope, setScope] = useState<Scope>("all");

  const filtered = useMemo(() => {
    if (!leaderboard) {
      return [] as LeaderboardEntry[];
    }
    const typedLeaderboard = leaderboard as LeaderboardEntry[];
    return scope === "surging"
      ? typedLeaderboard.filter((entry: LeaderboardEntry) => entry.momentum === "surging")
      : typedLeaderboard;
  }, [leaderboard, scope]);

  const topThree = filtered.slice(0, 3);

  return (
    <div className="app-scroll">
      <div className="page-wrap page-stack content-column">
        <section className="spotlight-ring glass-panel page-hero">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.06] text-[var(--app-gold)]">
                <Crown size={20} />
              </div>
              <p className="section-eyebrow text-[var(--app-gold)]">Leaderboard</p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight text-white">Prestige, momentum, and readable competition.</h1>
              <p className="mt-3 text-sm leading-7 text-[var(--app-text-soft)]">
                Review who is contributing most strongly, track momentum, and move from rank visibility into deeper reputation detail without visual clutter.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <FilterButton label="All ranks" active={scope === "all"} onClick={() => setScope("all")} />
              <FilterButton label="Surging only" active={scope === "surging"} onClick={() => setScope("surging")} />
            </div>
          </div>
        </section>

        {leaderboard ? (
          <>
            <section className="grid gap-4 md:grid-cols-3">
              {topThree.map((entry: LeaderboardEntry, index: number) => (
                <div
                  key={entry.userId}
                  className={`glass-panel rounded-[30px] p-6 ${index === 0 ? "border-[rgba(213,178,122,0.24)] bg-[linear-gradient(180deg,rgba(213,178,122,0.12),rgba(255,255,255,0.06))]" : ""}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="metric-kicker">Rank {entry.rank}</p>
                      <p className="mt-2 text-xl font-semibold text-white">{entry.name}</p>
                    </div>
                    <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-[var(--app-gold)]">
                      {index === 0 ? <Trophy size={18} /> : <Medal size={18} />}
                    </span>
                  </div>
                  <div className="mt-5 flex items-center gap-4">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full border border-white/10 bg-white/5 text-lg font-bold text-white">
                      {initials(entry.name)}
                    </div>
                    <div>
                      <p className="text-3xl font-black text-white">{entry.xp}</p>
                      <p className="text-sm text-[var(--app-text-muted)]">XP accumulated</p>
                    </div>
                  </div>
                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    <MiniMetric label="Posts" value={entry.posts} />
                    <MiniMetric label="Comments" value={entry.comments} />
                  </div>
                </div>
              ))}
            </section>

            <section className="glass-panel rounded-[30px] p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="metric-kicker">Workspace standings</p>
                  <h2 className="mt-2 text-2xl font-semibold text-white">Full ranking</h2>
                </div>
                <Link href="/reputation" className="inline-flex items-center gap-2 text-sm font-medium text-[var(--app-primary-strong)] transition hover:text-white">
                  <TrendingUp size={14} />
                  Open my reputation
                </Link>
              </div>

              <div className="mt-5 space-y-2">
                {filtered.map((entry: LeaderboardEntry) => (
                  <div
                    key={entry.userId}
                    className="grid gap-4 rounded-[24px] border border-[var(--app-line)] bg-white/5 px-4 py-4 md:grid-cols-[auto_1fr_auto_auto]"
                  >
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-sm font-bold text-white">
                      #{entry.rank}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 text-sm font-semibold text-white">
                          {initials(entry.name)}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-white">{entry.name}</p>
                          <p className="mt-1 text-xs text-[var(--app-text-muted)]">{entry.posts} posts - {entry.comments} comments - {entry.upvotesReceived} upvotes</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <MomentumChip momentum={entry.momentum} />
                    </div>
                    <div className="flex items-center justify-between gap-4 md:block md:text-right">
                      <p className="font-mono text-xl font-black text-white">{entry.xp}</p>
                      <p className="text-xs uppercase tracking-[0.18em] text-[var(--app-text-muted)]">XP</p>
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

function FilterButton({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className={active ? "app-filter-pill app-filter-pill-active" : "app-filter-pill"}>
      {active ? <Sparkles size={12} /> : null}
      {label}
    </button>
  );
}

function MiniMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-[20px] border border-[var(--app-line)] bg-white/5 p-3">
      <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--app-text-muted)]">{label}</p>
      <p className="mt-2 text-lg font-bold text-white">{value}</p>
    </div>
  );
}

function MomentumChip({ momentum }: { momentum: string }) {
  const tones: Record<string, string> = {
    surging: "bg-emerald-500/15 text-emerald-100 border-emerald-400/20",
    steady: "bg-amber-500/15 text-amber-100 border-amber-400/20",
    quiet: "bg-white/10 text-[var(--app-text-soft)] border-white/10"
  };

  return <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${tones[momentum] ?? tones.quiet}`}>{momentum}</span>;
}
