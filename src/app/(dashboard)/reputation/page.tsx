"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "convex/react";
import { Award, Flame, Gauge, Sparkles, TrendingUp, Trophy } from "lucide-react";
import { api } from "../../../../convex/_generated/api";
import { getAi } from "@/lib/ai/client";
import type { AiEnvelope, LearningProfile } from "@/lib/ai/contracts";

type LeaderboardEntry = {
  userId: string;
  rank: number;
  name: string;
  xp: number;
  posts: number;
  comments: number;
};

export default function ReputationPage() {
  const me = useQuery(api.reputation.getMe);
  const activity = useQuery(api.reputation.getActivity);
  const leaderboard = useQuery(api.reputation.getLeaderboard);
  const [profile, setProfile] = useState<AiEnvelope<LearningProfile> | null>(null);
  const [profileError, setProfileError] = useState("");

  const expertise = useMemo(
    () => (profile?.data?.expertise ?? me?.expertise ?? []) as Array<{ topic: string; score: number; confidence: string; evidence?: string }>,
    [me?.expertise, profile?.data?.expertise]
  );

  useEffect(() => {
    let cancelled = false;
    void getAi<LearningProfile>("/api/v1/ai/learning-profile")
      .then((payload) => {
        if (!cancelled) {
          setProfile(payload);
          setProfileError("");
        }
      })
      .catch((error) => {
        if (!cancelled) {
          setProfileError(error instanceof Error ? error.message : "Unable to load AI learning profile.");
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="app-scroll">
      <div className="page-wrap page-stack">
        {me ? (
          <>
            <section className="spotlight-ring glass-panel page-hero">
              <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
                <div>
                  <p className="section-eyebrow text-[var(--app-gold)]">Reputation profile</p>
                  <h1 className="mt-2 text-3xl font-bold tracking-tight text-white">{me.tier} standing</h1>
                  <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--app-text-soft)]">
                    Reputation is derived from visible academic contribution, helpful participation, and received signal. It is designed to guide growth, not hard-label a person.
                  </p>

                  <div className="mt-6 grid gap-4 sm:grid-cols-3">
                    <HeroStat label="XP" value={me.xp} />
                    <HeroStat label="Rank" value={`#${me.rank}`} />
                    <HeroStat label="Streak" value={`${me.streak}d`} />
                  </div>
                </div>

                <div className="rounded-[28px] border border-[rgba(213,178,122,0.18)] bg-[linear-gradient(160deg,rgba(213,178,122,0.12),rgba(255,255,255,0.06))] p-5">
                  <div className="flex items-center gap-2 text-[var(--app-gold)]">
                    <Gauge size={16} />
                    <p className="metric-kicker">Progress track</p>
                  </div>
                  <p className="mt-3 text-xl font-semibold text-white">Next tier at {me.nextTierTarget} XP</p>
                  <div className="mt-4 h-4 rounded-full bg-white/10">
                    <div
                      className="h-4 rounded-full bg-[linear-gradient(90deg,rgba(37,76,227,0.92),rgba(213,178,122,0.82))]"
                      style={{ width: `${Math.max(6, me.progress)}%` }}
                    />
                  </div>
                  <p className="mt-3 text-sm text-[var(--app-text-muted)]">{Math.round(me.progress)}% complete toward the next milestone.</p>
                  {profile?.data?.summary ? (
                    <div className="mt-5 rounded-[22px] border border-[var(--app-line)] bg-white/5 p-4">
                      <div className="flex items-center gap-2 text-[var(--app-primary-strong)]">
                        <Sparkles size={14} />
                        <p className="metric-kicker">AI learning profile</p>
                      </div>
                      <p className="mt-2 text-sm leading-7 text-[var(--app-text-soft)]">{profile.data.summary}</p>
                    </div>
                  ) : null}
                </div>
              </div>
            </section>

            <section className="grid gap-5 xl:grid-cols-[1fr_340px]">
              <div className="space-y-5">
                <article className="glass-panel rounded-[28px] p-6">
                  <div className="flex items-center gap-3">
                    <Award size={18} className="text-[var(--app-gold)]" />
                    <div>
                      <p className="metric-kicker">Achievements</p>
                      <h2 className="mt-2 text-2xl font-semibold text-white">Unlocked milestones</h2>
                    </div>
                  </div>
                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    {me.achievements.map((achievement) => (
                      <div
                        key={achievement.label}
                        className={
                          achievement.unlocked
                            ? "rounded-[24px] border border-emerald-400/25 bg-emerald-500/10 p-4 text-emerald-100"
                            : "rounded-[24px] border border-[var(--app-line)] bg-white/5 p-4 text-[var(--app-text-muted)]"
                        }
                      >
                        <p className="font-medium">{achievement.label}</p>
                        <p className="mt-2 text-xs uppercase tracking-[0.18em]">{achievement.unlocked ? "Unlocked" : "Locked"}</p>
                      </div>
                    ))}
                  </div>
                </article>

                <article className="glass-panel rounded-[28px] p-6">
                  <div className="flex items-center gap-3">
                    <TrendingUp size={18} className="text-[var(--app-primary-strong)]" />
                    <div>
                      <p className="metric-kicker">Recent XP activity</p>
                      <h2 className="mt-2 text-2xl font-semibold text-white">Transparency feed</h2>
                    </div>
                  </div>
                  <div className="mt-5 space-y-3">
                    {activity === undefined ? (
                      Array.from({ length: 4 }).map((_, index) => <div key={index} className="h-20 animate-pulse rounded-2xl bg-white/5" />)
                    ) : activity.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-[var(--app-line)] bg-white/5 p-4 text-sm text-[var(--app-text-muted)]">
                        Contribute in rooms to start building a transparent XP history.
                      </div>
                    ) : (
                      activity.map((item) => (
                        <div key={item.id} className="rounded-[22px] border border-[var(--app-line)] bg-white/5 p-4">
                          <div className="flex items-center justify-between gap-4">
                            <div>
                              <p className="font-medium text-white">{item.label}</p>
                              <p className="mt-1 text-xs text-[var(--app-text-muted)]">{new Date(item.timestamp).toLocaleString()}</p>
                            </div>
                            <span className="rounded-full bg-[rgba(77,117,255,0.14)] px-3 py-1 text-xs font-medium text-[var(--app-primary-strong)]">+{item.xp} XP</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </article>

                <article className="glass-panel rounded-[28px] p-6">
                  <div className="flex items-center gap-3">
                    <Sparkles size={18} className="text-[var(--app-primary-strong)]" />
                    <div>
                      <p className="metric-kicker">Expertise profile</p>
                      <h2 className="mt-2 text-2xl font-semibold text-white">Topic confidence map</h2>
                    </div>
                  </div>
                  {profileError ? (
                    <div className="mt-4 rounded-2xl border border-red-400/20 bg-red-500/10 p-4 text-sm text-red-100">{profileError}</div>
                  ) : null}
                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    {expertise.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-[var(--app-line)] bg-white/5 p-4 text-sm text-[var(--app-text-muted)]">
                        Not enough tagged content exists yet to infer topic expertise confidently.
                      </div>
                    ) : (
                      expertise.map((item) => (
                        <div key={item.topic} className="rounded-[22px] border border-[var(--app-line)] bg-white/5 p-4">
                          <div className="flex items-center justify-between gap-3">
                            <p className="font-medium text-white">{item.topic}</p>
                            <span className="font-mono text-sm text-[var(--app-text-soft)]">{item.score}</span>
                          </div>
                          <div className="mt-3 h-2 rounded-full bg-white/10">
                            <div className="h-2 rounded-full bg-[linear-gradient(90deg,rgba(37,76,227,0.92),rgba(77,117,255,0.62))]" style={{ width: `${item.score}%` }} />
                          </div>
                          <p className="mt-2 text-xs uppercase tracking-[0.18em] text-[var(--app-text-muted)]">{item.confidence} confidence</p>
                          {item.evidence ? <p className="mt-2 text-xs leading-6 text-[var(--app-text-muted)]">{item.evidence}</p> : null}
                        </div>
                      ))
                    )}
                  </div>
                </article>
              </div>

              <div className="space-y-5">
                <article className="glass-panel rounded-[28px] p-6">
                  <div className="flex items-center gap-3">
                    <Flame size={18} className="text-amber-500" />
                    <div>
                      <p className="metric-kicker">Momentum</p>
                      <h2 className="mt-2 text-2xl font-semibold text-white">Current standing</h2>
                    </div>
                  </div>
                  <div className="mt-5 grid gap-4">
                    <SideMetric label="Contribution mix" value={`${me.stats.posts} posts - ${me.stats.comments} comments - ${me.stats.upvotesReceived} upvotes`} />
                    <SideMetric label="Current streak" value={`${me.streak} days active`} />
                    <SideMetric label="Tier status" value={me.tier} />
                  </div>
                </article>

                <article className="glass-panel rounded-[28px] p-6">
                  <div className="flex items-center gap-3">
                    <Trophy size={18} className="text-[var(--app-gold)]" />
                    <div>
                      <p className="metric-kicker">Leaderboard context</p>
                      <h2 className="mt-2 text-2xl font-semibold text-white">Nearby ranking</h2>
                    </div>
                  </div>
                  <div className="mt-5 space-y-3">
                    {(leaderboard as LeaderboardEntry[] | undefined)?.slice(0, 5).map((entry: LeaderboardEntry) => (
                      <div key={entry.userId} className="flex items-center justify-between gap-4 rounded-[22px] border border-[var(--app-line)] bg-white/5 p-4">
                        <div>
                          <p className="font-medium text-white">#{entry.rank} {entry.name}</p>
                          <p className="mt-1 text-xs text-[var(--app-text-muted)]">{entry.posts} posts - {entry.comments} comments</p>
                        </div>
                        <span className="font-mono text-sm font-semibold text-white">{entry.xp} XP</span>
                      </div>
                    ))}
                  </div>
                  <Link href="/leaderboard" className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-[var(--app-primary-strong)] transition hover:text-white">
                    <TrendingUp size={14} />
                    Open full leaderboard
                  </Link>
                </article>
              </div>
            </section>
          </>
        ) : (
          <div className="grid gap-4 md:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="h-40 animate-pulse rounded-[28px] bg-white/5" />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function HeroStat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-[22px] border border-[var(--app-line)] bg-white/5 p-4">
      <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--app-text-muted)]">{label}</p>
      <p className="mt-3 text-2xl font-black text-white">{value}</p>
    </div>
  );
}

function SideMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[22px] border border-[var(--app-line)] bg-white/5 p-4">
      <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--app-text-muted)]">{label}</p>
      <p className="mt-2 text-sm leading-7 text-white">{value}</p>
    </div>
  );
}
