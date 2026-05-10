"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useQuery } from "convex/react";
import { Award, Flame, TrendingUp } from "lucide-react";
import { api } from "../../../../convex/_generated/api";
import { getAi } from "@/lib/ai/client";
import type { AiEnvelope, LearningProfile } from "@/lib/ai/contracts";

export default function ReputationPage() {
  const me = useQuery(api.reputation.getMe);
  const activity = useQuery(api.reputation.getActivity);
  const leaderboard = useQuery(api.reputation.getLeaderboard);
  const [profile, setProfile] = useState<AiEnvelope<LearningProfile> | null>(null);
  const [profileError, setProfileError] = useState("");
  const expertise = (profile?.data?.expertise ?? me?.expertise ?? []) as Array<{
    topic: string;
    score: number;
    confidence: string;
    evidence?: string;
  }>;

  useEffect(() => {
    let cancelled = false;

    void getAi<LearningProfile>("/api/v1/ai/learning-profile")
      .then((payload) => {
        if (!cancelled) {
          setProfile(payload);
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
            <section className="spotlight-ring glass-panel rounded-[34px] p-6 sm:p-8">
              <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                <div className="max-w-3xl">
                  <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Reputation profile</p>
                  <h1 className="mt-2 text-3xl font-bold tracking-tight text-white">{me.xp} XP | {me.tier}</h1>
                  <p className="mt-3 text-sm leading-6 text-gray-300">
                    This score is derived from visible academic contribution, discussion participation, and received signal. It is directional and reversible, not an opaque permanent label.
                  </p>
                </div>
                <div className="rounded-[24px] border border-white/10 bg-black/20 p-5">
                  <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Global rank</p>
                  <p className="mt-2 text-3xl font-black text-white">#{me.rank}</p>
                  <p className="mt-2 text-sm text-gray-400">Next tier at {me.nextTierTarget} XP</p>
                </div>
              </div>

              <div className="mt-6 rounded-3xl border border-white/10 bg-black/20 p-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white">Progress to next tier</span>
                  <span className="text-gray-400">{Math.round(me.progress)}%</span>
                </div>
                <div className="mt-3 h-3 rounded-full bg-white/5">
                  <div className="h-3 rounded-full bg-brand-500" style={{ width: `${Math.max(4, me.progress)}%` }} />
                </div>
              </div>
            </section>

            <section className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
              <div className="space-y-5">
                <div className="glass-panel rounded-[28px] p-6">
                  <div className="flex items-center gap-3">
                    <Award size={18} className="text-brand-200" />
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Achievements</p>
                      <h2 className="mt-2 text-2xl font-semibold text-white">Unlocked milestones</h2>
                    </div>
                  </div>
                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    {me.achievements.map((achievement) => (
                      <div key={achievement.label} className={achievement.unlocked ? "rounded-[24px] border border-emerald-400/25 bg-emerald-500/10 p-4 text-emerald-100" : "rounded-[24px] border border-white/10 bg-black/20 p-4 text-gray-400"}>
                        <p className="font-medium">{achievement.label}</p>
                        <p className="mt-2 text-xs uppercase tracking-[0.18em]">{achievement.unlocked ? "Unlocked" : "Locked"}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="glass-panel rounded-[28px] p-6">
                  <div className="flex items-center gap-3">
                    <TrendingUp size={18} className="text-brand-200" />
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Recent XP activity</p>
                      <h2 className="mt-2 text-2xl font-semibold text-white">Transparency feed</h2>
                    </div>
                  </div>
                  <div className="mt-5 space-y-3">
                    {activity === undefined ? (
                      Array.from({ length: 4 }).map((_, index) => <div key={index} className="h-20 animate-pulse rounded-2xl bg-white/5" />)
                    ) : activity.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-white/10 bg-black/20 p-4 text-sm text-gray-400">
                        Contribute in rooms to start building a transparent XP history.
                      </div>
                    ) : (
                      activity.map((item) => (
                        <div key={item.id} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                          <div className="flex items-center justify-between gap-4">
                            <div>
                              <p className="font-medium text-white">{item.label}</p>
                              <p className="mt-1 text-xs text-gray-500">{new Date(item.timestamp).toLocaleString()}</p>
                            </div>
                            <span className="rounded-full bg-brand-500/15 px-3 py-1 text-xs font-medium text-brand-100">+{item.xp} XP</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-5">
                <div className="glass-panel rounded-[28px] p-6">
                  <div className="flex items-center gap-3">
                    <Flame size={18} className="text-amber-300" />
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Streak and expertise</p>
                      <h2 className="mt-2 text-2xl font-semibold text-white">Current momentum</h2>
                    </div>
                  </div>
                  <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
                    <div className="rounded-[24px] border border-white/10 bg-black/20 p-4">
                      <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Streak</p>
                      <p className="mt-2 text-3xl font-black text-white">{me.streak} days</p>
                    </div>
                    <div className="rounded-[24px] border border-white/10 bg-black/20 p-4">
                      <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Contribution mix</p>
                      <p className="mt-2 text-sm text-gray-300">{me.stats.posts} posts | {me.stats.comments} comments | {me.stats.upvotesReceived} upvotes</p>
                    </div>
                  </div>
                  {profileError ? (
                    <div className="mt-4 rounded-2xl border border-red-400/20 bg-red-500/10 p-4 text-sm text-red-100">{profileError}</div>
                  ) : profile?.data?.summary ? (
                    <p className="mt-4 text-sm leading-6 text-gray-400">{profile.data.summary}</p>
                  ) : null}
                  <div className="mt-4 space-y-3">
                    {expertise.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-white/10 bg-black/20 p-4 text-sm text-gray-400">
                        Not enough tagged content exists yet to infer topic expertise confidently.
                      </div>
                    ) : (
                      expertise.map((item) => (
                        <div key={item.topic} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                          <div className="flex items-center justify-between gap-4">
                            <p className="font-medium text-white">{item.topic}</p>
                            <span className="text-sm text-gray-300">{item.score}</span>
                          </div>
                          <div className="mt-3 h-2 rounded-full bg-white/5">
                            <div className="h-2 rounded-full bg-brand-500" style={{ width: `${item.score}%` }} />
                          </div>
                          <p className="mt-2 text-xs text-gray-500">{item.confidence} confidence inference</p>
                          {item.evidence ? <p className="mt-1 text-xs text-gray-500">{item.evidence}</p> : null}
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="glass-panel rounded-[28px] p-6">
                  <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Leaderboard context</p>
                  <div className="mt-5 space-y-3">
                    {leaderboard?.slice(0, 5).map((entry: NonNullable<typeof leaderboard>[number]) => (
                      <div key={entry.userId} className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-black/20 p-4">
                        <div>
                          <p className="font-medium text-white">#{entry.rank} {entry.name}</p>
                          <p className="mt-1 text-xs text-gray-500">{entry.posts} posts | {entry.comments} comments</p>
                        </div>
                        <span className="text-sm font-semibold text-white">{entry.xp} XP</span>
                      </div>
                    ))}
                  </div>
                  <Link href="/leaderboard" className="mt-5 inline-flex text-sm font-medium text-brand-100 transition hover:text-white">
                    Open full leaderboard
                  </Link>
                </div>
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
