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
        <section className="spotlight-ring glass-panel rounded-[34px] p-6 sm:p-8">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05]">
              <BarChart3 size={20} className="text-brand-200" />
            </div>
            <div className="max-w-3xl">
              <h1 className="text-3xl font-bold tracking-tight text-white">Analytics and insights</h1>
              <p className="mt-2 text-sm leading-6 text-gray-300">
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
                <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Activity heatmap</p>
                <h2 className="mt-2 text-2xl font-semibold text-white">Last 28 days</h2>
                <div className="mt-5 grid grid-cols-7 gap-2">
                  {analytics.last28Days.map((item) => (
                    <div key={item.day} className="space-y-2">
                      <div
                        className="h-10 rounded-2xl"
                        style={{
                          background:
                            item.count >= 5
                              ? "rgba(63,115,255,0.7)"
                              : item.count >= 3
                                ? "rgba(63,115,255,0.45)"
                                : item.count >= 1
                                  ? "rgba(63,115,255,0.22)"
                                  : "rgba(255,255,255,0.05)"
                        }}
                        title={`${item.day}: ${item.count} posts`}
                      />
                      <p className="text-center text-[10px] text-gray-500">{item.day.slice(5)}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="glass-panel rounded-[28px] p-6">
                <p className="text-xs uppercase tracking-[0.2em] text-gray-500">AI risk radar</p>
                <h2 className="mt-2 text-2xl font-semibold text-white">Upcoming deadline pressure</h2>
                <div className="mt-5 space-y-3">
                  {riskError ? (
                    <div className="rounded-2xl border border-red-400/20 bg-red-500/10 p-4 text-sm text-red-100">{riskError}</div>
                  ) : riskResult === null ? (
                    Array.from({ length: 3 }).map((_, index) => <div key={index} className="h-20 animate-pulse rounded-2xl bg-white/5" />)
                  ) : riskResult.data?.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-white/10 bg-black/20 p-4 text-sm text-gray-400">
                      Not enough deadline signal is available yet.
                    </div>
                  ) : (
                    riskResult.data?.map((risk) => (
                      <div key={risk.postId} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="font-medium text-white">{risk.title}</p>
                            <p className="mt-1 text-xs text-gray-500">{risk.roomName}</p>
                          </div>
                          <span className={risk.band === "high" ? "rounded-full bg-red-500/15 px-3 py-1 text-xs font-medium text-red-100" : risk.band === "medium" ? "rounded-full bg-amber-500/15 px-3 py-1 text-xs font-medium text-amber-100" : "rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-medium text-emerald-100"}>
                            {risk.score}%
                          </span>
                        </div>
                        <p className="mt-3 text-sm leading-6 text-gray-300">{risk.explanation}</p>
                        <p className="mt-3 text-xs text-gray-500">Due {formatDeadline(risk.dueDate)}</p>
                      </div>
                    ))
                  )}
                  {riskResult ? (
                    <p className="text-xs text-gray-500">
                      {riskResult.meta.mode === "openai" ? "Model-grounded risk review" : "Deterministic fallback mode"} • request {riskResult.meta.requestId}
                    </p>
                  ) : null}
                </div>
              </div>
            </section>

            <section className="grid gap-5 xl:grid-cols-[0.8fr_1.2fr]">
              <div className="glass-panel rounded-[28px] p-6">
                <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Content mix</p>
                <div className="mt-5 space-y-3">
                  {Object.entries(analytics.byType).map(([type, count]) => (
                    <div key={type}>
                      <div className="mb-2 flex items-center justify-between text-sm">
                        <span className="text-white">{type}</span>
                        <span className="text-gray-400">{count}</span>
                      </div>
                      <div className="h-3 rounded-full bg-white/5">
                        <div className="h-3 rounded-full bg-brand-500" style={{ width: `${Math.max(8, (count / Math.max(analytics.totalPosts, 1)) * 100)}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="glass-panel rounded-[28px] p-6">
                <div className="flex items-start gap-3">
                  <AlertTriangle size={18} className="mt-1 text-amber-300" />
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Interpretation notes</p>
                    <h2 className="mt-2 text-2xl font-semibold text-white">How to read this screen safely</h2>
                  </div>
                </div>
                <div className="mt-5 space-y-3 text-sm leading-7 text-gray-300">
                  <p>The current analytics layer is grounded in visible workspace events. It is useful for pattern scanning, not for punitive or high-stakes judgment.</p>
                  <p>Risk scores are calibrated bands, not pseudo-precise predictions. Use them to decide where to spend the next study block.</p>
                  <p>The best follow-up is operational: move from high-risk deadlines straight into the planner and schedule the response.</p>
                </div>
                <Link href="/planner" className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-brand-100 transition hover:text-white">
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
      <p className="text-xs uppercase tracking-[0.25em] text-gray-500">{label}</p>
      <p className="mt-4 text-3xl font-black text-white">{value}</p>
      <p className="mt-2 text-sm text-gray-400">{detail}</p>
    </div>
  );
}
