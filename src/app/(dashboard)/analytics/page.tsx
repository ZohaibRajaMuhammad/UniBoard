"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useQuery } from "convex/react";
import { AlertTriangle, BarChart3, Clock3 } from "lucide-react";
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

  return (
    <div className="app-scroll">
      <div className="page-wrap page-stack">
        <section className="spotlight-ring glass-panel page-hero">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05]">
              <BarChart3 size={20} className="text-[var(--app-primary-strong)]" />
            </div>
            <div className="max-w-3xl">
              <p className="section-eyebrow text-[var(--app-primary-strong)]">Analytics</p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight text-white">Data-rich, calm, and actionable.</h1>
              <p className="mt-2 text-sm leading-7 text-[var(--app-text-soft)]">
                Review workspace engagement, content mix, and deadline pressure without leaving the academic shell.
              </p>
            </div>
          </div>
        </section>

        {analytics ? (
          <>
            <section className="grid gap-4 md:grid-cols-3">
              <StatCard label="Visible posts" value={String(analytics.totalPosts)} detail="Accessible room activity" />
              <StatCard label="Active rooms" value={String(analytics.activeRooms)} detail="Rooms currently in your workspace" />
              <StatCard label="Resolved questions" value={String(analytics.resolvedQuestions)} detail="Questions that closed the loop" />
            </section>

            <section className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
              <div className="glass-panel rounded-[28px] p-6">
                <p className="text-xs uppercase tracking-[0.2em] text-[var(--app-text-muted)]">Activity heatmap</p>
                <h2 className="mt-2 text-2xl font-semibold text-white">Last 28 days</h2>
                <div className="mt-5 grid grid-cols-7 gap-2">
                  {analytics.last28Days.map((item) => (
                    <div key={item.day} className="space-y-2">
                      <div
                        className="h-12 rounded-2xl"
                        style={{
                          background:
                            item.count >= 5
                              ? "rgba(77,117,255,0.78)"
                              : item.count >= 3
                                ? "rgba(77,117,255,0.5)"
                                : item.count >= 1
                                  ? "rgba(77,117,255,0.24)"
                                  : "rgba(255,255,255,0.05)"
                        }}
                        title={`${item.day}: ${item.count} posts`}
                      />
                      <p className="text-center text-[10px] text-[var(--app-text-muted)]">{item.day.slice(5)}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="glass-panel rounded-[28px] p-6">
                <p className="text-xs uppercase tracking-[0.2em] text-[var(--app-text-muted)]">AI risk radar</p>
                <h2 className="mt-2 text-2xl font-semibold text-white">Upcoming deadline pressure</h2>
                <div className="mt-5 space-y-3">
                  {riskError ? (
                    <div className="rounded-2xl border border-red-400/20 bg-red-500/10 p-4 text-sm text-red-100">{riskError}</div>
                  ) : riskResult === null ? (
                    Array.from({ length: 3 }).map((_, index) => <div key={index} className="h-20 animate-pulse rounded-2xl bg-white/5" />)
                  ) : riskResult.data?.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-[var(--app-line)] bg-black/20 p-4 text-sm text-[var(--app-text-muted)]">
                      Not enough deadline signal is available yet.
                    </div>
                  ) : (
                    riskResult.data?.map((risk) => (
                      <div key={risk.postId} className="rounded-2xl border border-[var(--app-line)] bg-black/20 p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="font-medium text-white">{risk.title}</p>
                            <p className="mt-1 text-xs text-[var(--app-text-muted)]">{risk.roomName}</p>
                          </div>
                          <span className={risk.band === "high" ? "rounded-full bg-red-500/15 px-3 py-1 text-xs font-medium text-red-100" : risk.band === "medium" ? "rounded-full bg-amber-500/15 px-3 py-1 text-xs font-medium text-amber-100" : "rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-medium text-emerald-100"}>
                            {risk.score}%
                          </span>
                        </div>
                        <p className="mt-3 text-sm leading-7 text-[var(--app-text-soft)]">{risk.explanation}</p>
                        <p className="mt-3 text-xs text-[var(--app-text-muted)]">Due {formatDeadline(risk.dueDate)}</p>
                      </div>
                    ))
                  )}
                  {riskResult ? (
                    <p className="text-xs text-[var(--app-text-muted)]">
                      {riskResult.meta.mode === "openai" ? "Model-grounded risk review" : "Deterministic fallback mode"} • request {riskResult.meta.requestId}
                    </p>
                  ) : null}
                </div>
              </div>
            </section>

            <section className="grid gap-5 xl:grid-cols-[0.85fr_1.15fr]">
              <div className="glass-panel rounded-[28px] p-6">
                <p className="text-xs uppercase tracking-[0.2em] text-[var(--app-text-muted)]">Content mix</p>
                <div className="mt-5 space-y-3">
                  {Object.entries(analytics.byType).map(([type, count]) => (
                    <div key={type}>
                      <div className="mb-2 flex items-center justify-between text-sm">
                        <span className="capitalize text-white">{type}</span>
                        <span className="text-[var(--app-text-muted)]">{count}</span>
                      </div>
                      <div className="h-3 rounded-full bg-white/5">
                        <div className="h-3 rounded-full bg-[var(--app-primary)]" style={{ width: `${Math.max(8, (count / Math.max(analytics.totalPosts, 1)) * 100)}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="glass-panel rounded-[28px] p-6">
                <div className="flex items-start gap-3">
                  <AlertTriangle size={18} className="mt-1 text-amber-300" />
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-[var(--app-text-muted)]">Interpretation notes</p>
                    <h2 className="mt-2 text-2xl font-semibold text-white">How to read this screen safely</h2>
                  </div>
                </div>
                <div className="mt-5 space-y-3 text-sm leading-7 text-[var(--app-text-soft)]">
                  <p>The analytics layer is grounded in visible workspace events. It is useful for pattern scanning, not for punitive or high-stakes judgment.</p>
                  <p>Risk scores are calibrated bands, not pseudo-precise predictions. Use them to decide where to spend the next study block.</p>
                  <p>The best follow-up is operational: move from high-risk deadlines straight into the planner and schedule the response.</p>
                </div>
                <Link href="/planner" className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-[var(--app-primary-strong)] transition hover:text-white">
                  <Clock3 size={14} />
                  Open planner
                </Link>
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

function StatCard({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="stat-card">
      <p className="text-xs uppercase tracking-[0.25em] text-[var(--app-text-muted)]">{label}</p>
      <p className="mt-4 text-3xl font-black text-white">{value}</p>
      <p className="mt-2 text-sm text-[var(--app-text-muted)]">{detail}</p>
    </div>
  );
}
