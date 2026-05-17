"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "convex/react";
import { AlertTriangle, ArrowUpRight, BarChart3, Clock3, Sparkles, TrendingUp } from "lucide-react";
import { api } from "../../../../convex/_generated/api";
import { getAi } from "@/lib/ai/client";
import type { AiEnvelope, DeadlineRiskItem } from "@/lib/ai/contracts";
import { formatDeadline } from "@/lib/utils";

const chartPalette = ["#315CF3", "#5E7BF7", "#8EA5FA", "#B8C7FC", "#D6E0FE", "#E9EEFF"];

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

  const activitySeries = analytics?.last28Days ?? [];
  const typeBreakdown = useMemo(
    () =>
      analytics
        ? Object.entries(analytics.byType)
            .sort((left, right) => right[1] - left[1])
            .map(([label, value], index) => ({
              label,
              value,
              color: chartPalette[index % chartPalette.length]
            }))
        : [],
    [analytics]
  );

  return (
    <div className="app-scroll">
      <div className="page-wrap page-stack shell-content-column">
        <section className="glass-panel page-hero">
          <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
            <div>
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-[var(--app-line)] bg-white text-[var(--app-primary-strong)]">
                <BarChart3 size={20} />
              </div>
              <p className="section-eyebrow text-[var(--app-primary-strong)]">Analytics</p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight text-white">Operational academic signal</h1>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--app-text-soft)]">
                Review room activity, upcoming deadline pressure, and the current content mix from live workspace calculations.
              </p>
            </div>

            <div className="app-surface-muted rounded-[26px] p-5">
              <div className="flex items-center gap-2 text-[var(--app-primary-strong)]">
                <Sparkles size={15} />
                <p className="metric-kicker">AI priority</p>
              </div>
              {riskError ? (
                <div className="mt-4 rounded-2xl border border-red-400/20 bg-red-500/10 p-4 text-sm text-red-100">{riskError}</div>
              ) : riskResult?.data?.[0] ? (
                <>
                  <h2 className="mt-3 text-2xl font-semibold text-white">{riskResult.data[0].title}</h2>
                  <p className="mt-2 text-sm leading-7 text-[var(--app-text-soft)]">{riskResult.data[0].explanation}</p>
                  <div className="mt-4 flex flex-wrap gap-3">
                    <StatusChip label={`${riskResult.data[0].score}% risk`} tone={riskResult.data[0].band} />
                    <StatusChip label={riskResult.meta.mode === "openai" ? "Model review" : "Fallback review"} tone="neutral" />
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

            <section className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
              <article className="glass-panel rounded-[28px] p-6">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="metric-kicker">Activity trend</p>
                    <h2 className="mt-2 text-2xl font-semibold text-white">Last 28 days</h2>
                  </div>
                  <p className="text-xs uppercase tracking-[0.18em] text-[var(--app-text-muted)]">
                    {activitySeries.reduce((sum, item) => sum + item.count, 0)} posts in range
                  </p>
                </div>
                <div className="mt-6">
                  <LineChart data={activitySeries} />
                </div>
              </article>

              <article className="glass-panel rounded-[28px] p-6">
                <p className="metric-kicker">Type distribution</p>
                <h2 className="mt-2 text-2xl font-semibold text-white">Current content mix</h2>
                <div className="mt-6 grid gap-6 lg:grid-cols-[auto_1fr] lg:items-center">
                  <DonutChart data={typeBreakdown} total={totalTypeCount} />
                  <div className="space-y-3">
                    {typeBreakdown.map((item) => (
                      <div key={item.label} className="flex items-center justify-between gap-3 rounded-2xl border border-[var(--app-line)] bg-white/70 px-4 py-3">
                        <div className="flex items-center gap-3">
                          <span className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                          <span className="text-sm font-medium capitalize text-[var(--app-text)]">{item.label}</span>
                        </div>
                        <span className="text-sm text-[var(--app-text-muted)]">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </article>
            </section>

            <section className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
              <article className="glass-panel rounded-[28px] p-6">
                <p className="metric-kicker">Deadline velocity</p>
                <h2 className="mt-2 text-2xl font-semibold text-white">Priority profile</h2>
                <div className="mt-5">
                  <SparklineChart
                    data={analytics.upcomingDeadlines.map((item, index) => ({
                      label: item.title || `Deadline ${index + 1}`,
                      value: item.score
                    }))}
                  />
                </div>
                <div className="mt-5 space-y-3">
                  {analytics.upcomingDeadlines.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-[var(--app-line)] bg-white/70 p-4 text-sm text-[var(--app-text-muted)]">
                      No upcoming deadlines are currently available.
                    </div>
                  ) : (
                    analytics.upcomingDeadlines.map((item) => (
                      <div key={item.postId} className="flex items-center justify-between gap-4 rounded-2xl border border-[var(--app-line)] bg-white/70 px-4 py-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-[var(--app-text)]">{item.title}</p>
                          <p className="mt-1 text-xs text-[var(--app-text-muted)]">Due {formatDeadline(item.dueDate)}</p>
                        </div>
                        <StatusChip label={`${item.score}%`} tone={item.band} />
                      </div>
                    ))
                  )}
                </div>
              </article>

              <article className="glass-panel rounded-[28px] p-6">
                <div className="flex items-start gap-3">
                  <AlertTriangle size={18} className="mt-1 text-amber-500" />
                  <div>
                    <p className="metric-kicker">AI risk radar</p>
                    <h2 className="mt-2 text-2xl font-semibold text-white">Grounded deadline review</h2>
                  </div>
                </div>
                <div className="mt-5 space-y-3">
                  {riskError ? (
                    <div className="rounded-2xl border border-red-400/20 bg-red-500/10 p-4 text-sm text-red-100">{riskError}</div>
                  ) : riskResult === null ? (
                    Array.from({ length: 3 }).map((_, index) => <div key={index} className="h-24 animate-pulse rounded-2xl bg-white/5" />)
                  ) : riskResult.data?.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-[var(--app-line)] bg-white/70 p-4 text-sm text-[var(--app-text-muted)]">
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

function LineChart({ data }: { data: Array<{ day: string; count: number }> }) {
  const width = 720;
  const height = 240;
  const padding = 18;
  const maxValue = Math.max(...data.map((item) => item.count), 1);
  const points = data.map((item, index) => {
    const x = padding + (index / Math.max(data.length - 1, 1)) * (width - padding * 2);
    const y = height - padding - (item.count / maxValue) * (height - padding * 2);
    return { ...item, x, y };
  });
  const linePath = points.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ");
  const areaPath = `${linePath} L ${points[points.length - 1]?.x ?? padding} ${height - padding} L ${points[0]?.x ?? padding} ${height - padding} Z`;

  return (
    <div className="rounded-[24px] border border-[var(--app-line)] bg-white/70 p-4">
      <svg viewBox={`0 0 ${width} ${height}`} className="h-[240px] w-full" role="img" aria-label="Workspace activity line chart">
        {[0, 1, 2, 3].map((step) => {
          const y = padding + ((height - padding * 2) / 3) * step;
          return <line key={step} x1={padding} y1={y} x2={width - padding} y2={y} stroke="rgba(67,96,160,0.12)" strokeWidth="1" />;
        })}
        <path d={areaPath} fill="rgba(49,92,243,0.10)" />
        <path d={linePath} fill="none" stroke="#315CF3" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        {points.map((point) => (
          <g key={point.day}>
            <circle cx={point.x} cy={point.y} r="4" fill="#315CF3" />
            <text x={point.x} y={height - 2} textAnchor="middle" fontSize="10" fill="#6e7c96">
              {point.day.slice(5)}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}

function DonutChart({
  data,
  total
}: {
  data: Array<{ label: string; value: number; color: string }>;
  total: number;
}) {
  if (total === 0) {
    return (
      <div className="flex h-[13rem] w-[13rem] items-center justify-center rounded-full border border-dashed border-[var(--app-line)] bg-white/70 text-sm text-[var(--app-text-muted)]">
        No content
      </div>
    );
  }

  let currentOffset = 0;
  const segments = data.map((item) => {
    const size = item.value / total;
    const segment = {
      ...item,
      dashArray: `${size * 100} ${100 - size * 100}`,
      dashOffset: -currentOffset
    };
    currentOffset += size * 100;
    return segment;
  });

  return (
    <div className="relative mx-auto h-[13rem] w-[13rem]">
      <svg viewBox="0 0 42 42" className="h-full w-full -rotate-90">
        <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="rgba(67,96,160,0.12)" strokeWidth="5" />
        {segments.map((segment) => (
          <circle
            key={segment.label}
            cx="21"
            cy="21"
            r="15.915"
            fill="transparent"
            stroke={segment.color}
            strokeWidth="5"
            strokeDasharray={segment.dashArray}
            strokeDashoffset={segment.dashOffset}
          />
        ))}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold text-white">{total}</span>
        <span className="text-xs uppercase tracking-[0.18em] text-[var(--app-text-muted)]">posts</span>
      </div>
    </div>
  );
}

function SparklineChart({ data }: { data: Array<{ label: string; value: number }> }) {
  if (data.length === 0) {
    return (
      <div className="rounded-[24px] border border-dashed border-[var(--app-line)] bg-white/70 p-4 text-sm text-[var(--app-text-muted)]">
        Add more deadline data to render the priority sparkline.
      </div>
    );
  }

  const width = 420;
  const height = 130;
  const padding = 12;
  const maxValue = Math.max(...data.map((item) => item.value), 1);
  const points = data.map((item, index) => {
    const x = padding + (index / Math.max(data.length - 1, 1)) * (width - padding * 2);
    const y = height - padding - (item.value / maxValue) * (height - padding * 2);
    return { ...item, x, y };
  });
  const path = points.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ");

  return (
    <div className="rounded-[24px] border border-[var(--app-line)] bg-white/70 p-4">
      <svg viewBox={`0 0 ${width} ${height}`} className="h-[130px] w-full" role="img" aria-label="Deadline priority sparkline">
        <path d={path} fill="none" stroke="#315CF3" strokeWidth="3" strokeLinecap="round" />
        {points.map((point) => (
          <circle key={point.label} cx={point.x} cy={point.y} r="3.5" fill="#315CF3" />
        ))}
      </svg>
    </div>
  );
}

function StatusChip({
  label,
  tone
}: {
  label: string;
  tone: string;
}) {
  const tones: Record<string, string> = {
    high: "bg-red-500/15 text-red-100 border-red-400/20",
    medium: "bg-amber-500/15 text-amber-100 border-amber-400/20",
    low: "bg-emerald-500/15 text-emerald-100 border-emerald-400/20",
    neutral: "bg-white/10 text-[var(--app-text-soft)] border-white/10"
  };

  return <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${tones[tone] ?? tones.neutral}`}>{label}</span>;
}
