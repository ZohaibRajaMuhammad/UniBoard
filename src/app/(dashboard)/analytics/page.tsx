"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "convex/react";
import { AlertTriangle, ArrowUpRight, BarChart3, Clock3, Sparkles, TrendingUp } from "lucide-react";
import { api } from "../../../../convex/_generated/api";
import { getAi } from "@/lib/ai/client";
import type { AiEnvelope, DeadlineRiskItem } from "@/lib/ai/contracts";
import { formatDeadline } from "@/lib/utils";

export default function AnalyticsPage() {
  const analytics = useQuery(api.analytics.getWorkspaceAnalytics);
  const [riskResult, setRiskResult] = useState<AiEnvelope<DeadlineRiskItem[]> | null>(null);
  const [riskError, setRiskError] = useState("");

  useEffect(() => {
    let cancelled = false;

    void getAi<DeadlineRiskItem[]>("/api/v1/ai/deadline-risk")
      .then((payload) => {
        if (!cancelled) {
          setRiskResult(payload);
          setRiskError("");
        }
      })
      .catch((error) => {
        if (!cancelled) {
          setRiskError(error instanceof Error ? error.message : "Unable to load AI risk insights.");
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const totalTypeCount = useMemo(() => {
    if (!analytics) {
      return 0;
    }
    return Object.values(analytics.byType).reduce((sum, count) => sum + count, 0);
  }, [analytics]);

  return (
    <div className="app-scroll">
      <div className="page-wrap page-stack shell-content-column">
        <section className="spotlight-ring glass-panel page-hero">
          <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
            <div>
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.06] text-[var(--app-primary-strong)]">
                <BarChart3 size={20} />
              </div>
              <p className="section-eyebrow text-[var(--app-primary-strong)]">Analytics</p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight text-white">Clear academic signal, not decorative dashboards.</h1>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--app-text-soft)]">
                Monitor visible activity, identify pressure zones, and move from pattern recognition into action without leaving the workspace.
              </p>
            </div>

            <div className="rounded-[26px] border border-[rgba(77,117,255,0.16)] bg-[linear-gradient(135deg,rgba(77,117,255,0.12),rgba(255,255,255,0.72))] p-5">
              <div className="flex items-center gap-2 text-[var(--app-primary-strong)]">
                <Sparkles size={15} />
                <p className="metric-kicker">AI insight card</p>
              </div>
              {riskError ? (
                <div className="mt-4 rounded-2xl border border-red-400/20 bg-red-500/10 p-4 text-sm text-red-100">{riskError}</div>
              ) : riskResult?.data?.[0] ? (
                <>
                  <h2 className="mt-3 text-2xl font-semibold text-white">{riskResult.data[0].title}</h2>
                  <p className="mt-2 text-sm leading-7 text-[var(--app-text-soft)]">{riskResult.data[0].explanation}</p>
                  <div className="mt-4 flex flex-wrap gap-3">
                    <StatusChip label={`${riskResult.data[0].score}% risk`} tone={riskResult.data[0].band} />
                    <StatusChip label={riskResult.meta.mode === "openai" ? "Grounded model review" : "Fallback review"} tone="neutral" />
                  </div>
                </>
              ) : riskResult ? (
                <div className="mt-4 rounded-2xl border border-dashed border-[var(--app-line)] bg-white/70 p-4 text-sm leading-7 text-[var(--app-text-soft)]">
                  No urgent deadline signal is available yet. Add deadlines in the planner or join more active rooms to populate AI risk insights.
                </div>
              ) : (
                <div className="mt-4 h-28 animate-pulse rounded-2xl bg-white/5" />
              )}
            </div>
          </div>
        </section>

        {analytics ? (
          <>
            <section className="grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
              <MetricCard label="Visible posts" value={analytics.totalPosts} detail="Accessible room activity" icon={<TrendingUp size={16} />} />
              <MetricCard label="Active rooms" value={analytics.activeRooms} detail="Rooms with visible signal" icon={<BarChart3 size={16} />} />
              <MetricCard label="Resolved questions" value={analytics.resolvedQuestions} detail="Questions that closed the loop" icon={<ArrowUpRight size={16} />} />
              <MetricCard label="Tracked deadlines" value={analytics.upcomingDeadlines.length} detail="Upcoming items in academic scope" icon={<Clock3 size={16} />} />
            </section>

            <section className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
              <article className="glass-panel rounded-[28px] p-6">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="metric-kicker">Activity matrix</p>
                    <h2 className="mt-2 text-2xl font-semibold text-white">Last 28 days</h2>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-[var(--app-text-muted)]">
                    <span className="h-3 w-3 rounded-full bg-[rgba(77,117,255,0.18)]" />
                    low
                    <span className="ml-2 h-3 w-3 rounded-full bg-[rgba(77,117,255,0.78)]" />
                    high
                  </div>
                </div>
                <div className="mt-6 grid grid-cols-7 gap-3">
                  {analytics.last28Days.map((item) => (
                    <div key={item.day} className="space-y-2">
                      <div className="app-surface-soft rounded-[18px] p-2">
                        <div
                          className="h-16 rounded-[14px]"
                          style={{
                            background:
                              item.count >= 5
                                ? "linear-gradient(180deg, rgba(37,76,227,0.92), rgba(77,117,255,0.72))"
                                : item.count >= 3
                                  ? "linear-gradient(180deg, rgba(37,76,227,0.7), rgba(77,117,255,0.44))"
                                  : item.count >= 1
                                    ? "linear-gradient(180deg, rgba(77,117,255,0.32), rgba(77,117,255,0.16))"
                                    : "rgba(255,255,255,0.04)"
                          }}
                          title={`${item.day}: ${item.count} posts`}
                        />
                      </div>
                      <div className="text-center">
                        <p className="text-[11px] font-semibold text-[var(--app-text)]">{item.count}</p>
                        <p className="mt-1 text-[10px] text-[var(--app-text-muted)]">{item.day.slice(5)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </article>

              <article className="glass-panel rounded-[28px] p-6">
                <p className="metric-kicker">Deadline pressure</p>
                <h2 className="mt-2 text-2xl font-semibold text-white">AI risk radar</h2>
                <div className="mt-5 space-y-3">
                  {riskError ? (
                    <div className="rounded-2xl border border-red-400/20 bg-red-500/10 p-4 text-sm text-red-100">{riskError}</div>
                  ) : riskResult === null ? (
                    Array.from({ length: 3 }).map((_, index) => <div key={index} className="h-24 animate-pulse rounded-2xl bg-white/5" />)
                  ) : riskResult.data?.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-[var(--app-line)] bg-white/5 p-4 text-sm text-[var(--app-text-muted)]">
                      Not enough deadline signal is available yet.
                    </div>
                  ) : (
                    riskResult.data?.map((risk) => (
                      <div key={risk.postId} className="app-surface-muted rounded-[22px] p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="font-semibold text-white">{risk.title}</p>
                            <p className="mt-1 text-xs uppercase tracking-[0.18em] text-[var(--app-text-muted)]">{risk.roomName}</p>
                          </div>
                          <StatusChip label={`${risk.score}%`} tone={risk.band} />
                        </div>
                        <p className="mt-3 text-sm leading-7 text-[var(--app-text-soft)]">{risk.explanation}</p>
                        <p className="mt-3 text-xs text-[var(--app-text-muted)]">Due {formatDeadline(risk.dueDate)}</p>
                      </div>
                    ))
                  )}
                </div>
              </article>
            </section>

            <section className="grid gap-5 xl:grid-cols-[0.92fr_1.08fr]">
              <article className="glass-panel rounded-[28px] p-6">
                <p className="metric-kicker">Content mix</p>
                <h2 className="mt-2 text-2xl font-semibold text-white">Distribution by post type</h2>
                <div className="mt-5 space-y-4">
                  {Object.entries(analytics.byType).map(([type, count]) => {
                    const ratio = totalTypeCount > 0 ? (count / totalTypeCount) * 100 : 0;
                    return (
                      <div key={type}>
                        <div className="mb-2 flex items-center justify-between text-sm">
                          <span className="capitalize font-medium text-[var(--app-text)]">{type}</span>
                          <span className="font-mono text-[var(--app-text-muted)]">{count}</span>
                        </div>
                        <div className="h-3 rounded-full bg-[rgba(77,117,255,0.08)]">
                          <div
                            className="h-3 rounded-full bg-[linear-gradient(90deg,rgba(37,76,227,0.92),rgba(77,117,255,0.62))]"
                            style={{ width: `${Math.max(10, ratio)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </article>

              <article className="glass-panel rounded-[28px] p-6">
                <div className="flex items-start gap-3">
                  <AlertTriangle size={18} className="mt-1 text-amber-500" />
                  <div>
                    <p className="metric-kicker">Interpretation notes</p>
                    <h2 className="mt-2 text-2xl font-semibold text-white">How to use this screen responsibly</h2>
                  </div>
                </div>
                <div className="mt-5 grid gap-3 lg:grid-cols-3">
                  <InsightCard
                    title="Pattern scanning"
                    copy="Use activity trends to identify where attention is building or disappearing, not to over-read a single day."
                  />
                  <InsightCard
                    title="Risk calibration"
                    copy="Risk bands are directional. They help prioritize the next study block, not judge people or predict outcomes with fake precision."
                  />
                  <InsightCard
                    title="Best next action"
                    copy="Move from high-risk items into the planner immediately and schedule a response while the context is still fresh."
                  />
                </div>
                <Link href="/planner" className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-[var(--app-primary-strong)] transition hover:text-white">
                  <Clock3 size={14} />
                  Open planner
                </Link>
              </article>
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

function MetricCard({
  label,
  value,
  detail,
  icon
}: {
  label: string;
  value: number;
  detail: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="stat-card">
      <div className="flex items-center justify-between gap-3">
        <p className="metric-kicker">{label}</p>
        <span className="text-[var(--app-primary-strong)]">{icon}</span>
      </div>
      <p className="mt-4 text-3xl font-black text-white">{value}</p>
      <p className="mt-2 text-sm text-[var(--app-text-muted)]">{detail}</p>
    </div>
  );
}

function InsightCard({ title, copy }: { title: string; copy: string }) {
  return (
    <div className="app-surface-muted rounded-[22px] p-4">
      <p className="text-sm font-semibold text-white">{title}</p>
      <p className="mt-2 text-sm leading-7 text-[var(--app-text-soft)]">{copy}</p>
    </div>
  );
}

function StatusChip({
  label,
  tone
}: {
  label: string;
  tone: "low" | "medium" | "high" | "neutral";
}) {
  const tones = {
    high: "bg-red-500/15 text-red-100 border-red-400/20",
    medium: "bg-amber-500/15 text-amber-100 border-amber-400/20",
    low: "bg-emerald-500/15 text-emerald-100 border-emerald-400/20",
    neutral: "bg-white/10 text-[var(--app-text-soft)] border-white/10"
  };

  return <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${tones[tone]}`}>{label}</span>;
}
