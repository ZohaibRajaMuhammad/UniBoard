"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { CalendarDays, ChevronDown, Download, FileSpreadsheet, FileText, Plus, RefreshCcw } from "lucide-react";
import { api } from "../../../../convex/_generated/api";
import type { Doc, Id } from "../../../../convex/_generated/dataModel";
import { useNotifier } from "@/components/providers/NotificationProvider";
import { Skeleton } from "@/components/ui/Skeleton";
import { getAi } from "@/lib/ai/client";
import type { AiEnvelope, StudyPlan } from "@/lib/ai/contracts";
import { buildPlannerDoc, buildPlannerWorkbook, downloadBlob } from "@/lib/planner-export";
import { formatDeadline } from "@/lib/utils";

type CalendarView = "month" | "week";

export default function PlannerPage() {
  const { notify } = useNotifier();
  const planner = useQuery(api.planner.getSnapshot);
  const rooms = useQuery(api.rooms.getMyRooms);
  const createManualDeadline = useMutation(api.planner.createManualDeadline);
  const replan = useMutation(api.planner.replan);
  const exportCalendar = useMutation(api.planner.exportCalendar);
  const [calendarView, setCalendarView] = useState<CalendarView>("month");
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isReplanning, setIsReplanning] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [status, setStatus] = useState("");
  const [studyPlan, setStudyPlan] = useState<AiEnvelope<StudyPlan> | null>(null);
  const [studyPlanError, setStudyPlanError] = useState("");
  const [draft, setDraft] = useState({ title: "", dueDate: "", estimatedMinutes: "120", roomId: "", notes: "" });

  if (planner === undefined || rooms === undefined) {
    return (
      <div className="app-scroll">
        <div className="page-wrap page-stack shell-content-column">
          <Skeleton className="h-[18rem] rounded-[var(--radius-panel)]" />
          <Skeleton className="h-[12rem] rounded-[var(--radius-panel)]" />
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} className="h-40 rounded-3xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const calendarCells = useMemo(() => {
    const baseDate = new Date();
    const current = new Date(baseDate.getFullYear(), baseDate.getMonth(), 1);
    const firstDay = current.getDay();
    const start = new Date(current);
    start.setDate(current.getDate() - firstDay);
    return Array.from({ length: calendarView === "month" ? 35 : 7 }).map((_, index) => {
      const date = new Date(start);
      date.setDate(start.getDate() + index);
      return date;
    });
  }, [calendarView]);

  useEffect(() => {
    let cancelled = false;
    void getAi<StudyPlan>("/api/v1/ai/study-plan")
      .then((payload) => {
        if (!cancelled) {
          setStudyPlan(payload);
          setStudyPlanError("");
          if (payload.meta.mode === "fallback") {
            notify({
              title: "Planner AI degraded",
              message: "Showing a live deterministic study plan while the model service is temporarily unavailable.",
              tone: "warning",
              desktop: false,
              priority: "low",
              tag: "planner-ai-fallback"
            });
          }
        }
      })
      .catch((error) => {
        if (!cancelled) {
          const message = error instanceof Error ? error.message : "Unable to load the AI study planner.";
          setStudyPlanError(message);
          notify({
            title: "AI planner unavailable",
            message,
            tone: "error",
            priority: "high",
            tag: "planner-ai-error"
          });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [notify, planner?.generatedAt]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!draft.title.trim() || !draft.dueDate) {
      return;
    }

    setIsSubmitting(true);
    setStatus("");
    try {
      await createManualDeadline({
        title: draft.title,
        dueDate: new Date(draft.dueDate).getTime(),
        estimatedMinutes: Number(draft.estimatedMinutes),
        roomId: draft.roomId ? (draft.roomId as Id<"rooms">) : undefined,
        notes: draft.notes || undefined
      });
      setDraft({ title: "", dueDate: "", estimatedMinutes: "120", roomId: "", notes: "" });
      setShowForm(false);
      setStatus("Manual deadline added.");
      notify({
        title: "Deadline added",
        message: "Manual planner deadline created successfully.",
        tone: "success",
        tag: "planner-deadline-added"
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to add deadline.";
      setStatus(message);
      notify({
        title: "Deadline creation failed",
        message,
        tone: "error",
        priority: "high",
        tag: "planner-deadline-error"
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleExport(format: "xlsx" | "docx") {
    if (!planner) {
      return;
    }
    setIsExporting(true);
    setStatus("");
    try {
      const result = await exportCalendar({});
      const exportItems = planner.items.map((item) => ({
        id: item.id,
        title: item.title,
        roomName: item.roomName,
        dueDate: item.dueDate,
        riskScore: item.riskScore,
        urgency: item.urgency,
        explanation: item.explanation,
        estimatedMinutes: item.estimatedMinutes
      }));
      const sessions = planner.sessions.map((session) => ({
        id: session.id,
        title: session.title,
        startAt: session.startAt,
        endAt: session.endAt,
        urgency: session.urgency as "low" | "medium" | "high",
        reasoning: session.reasoning
      }));
      const officeBlob =
        format === "xlsx"
          ? await buildPlannerWorkbook(exportItems, sessions)
          : await buildPlannerDoc(exportItems, sessions);
      const filenameDate = new Date(planner.generatedAt).toISOString().slice(0, 10);
      downloadBlob(officeBlob, `uniboard-planner-${filenameDate}.${format}`);
      downloadBlob(new Blob([result.content], { type: "text/calendar;charset=utf-8" }), result.filename);
      setStatus(format === "xlsx" ? "Planner exported to Excel and calendar." : "Planner exported to Word and calendar.");
      notify({
        title: "Planner exported",
        message: format === "xlsx" ? "Excel and calendar files downloaded." : "Word and calendar files downloaded.",
        tone: "success",
        tag: `planner-export-${format}`
      });
      setShowExportMenu(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to export planner files.";
      setStatus(message);
      notify({
        title: "Planner export failed",
        message,
        tone: "error",
        priority: "high",
        tag: "planner-export-error"
      });
    } finally {
      setIsExporting(false);
    }
  }

  async function handleReplan() {
    setIsReplanning(true);
    setStatus("");
    try {
      await replan({});
      setStatus("Planner sessions were recalculated.");
      notify({
        title: "Planner recalculated",
        message: "Study sessions were refreshed successfully.",
        tone: "success",
        tag: "planner-replan"
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to refresh the plan.";
      setStatus(message);
      notify({
        title: "Planner refresh failed",
        message,
        tone: "error",
        priority: "high",
        tag: "planner-replan-error"
      });
    } finally {
      setIsReplanning(false);
    }
  }

  return (
    <div className="app-scroll">
      <div className="page-wrap page-stack shell-content-column">
        <section className="spotlight-ring glass-panel page-hero overflow-visible">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-3xl">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05]">
                <CalendarDays size={20} className="text-[var(--app-primary-strong)]" />
              </div>
              <p className="section-eyebrow text-[var(--app-primary-strong)]">Planner</p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight text-white">A premium study operations console.</h1>
              <p className="mt-2 text-sm leading-7 text-[var(--app-text-soft)]">
                Turn deadlines into a visible calendar, inspect AI-prioritized study blocks, and add manual work that does not yet live in room posts.
              </p>
            </div>
            <div className="flex flex-col flex-wrap gap-3">
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowExportMenu((current) => !current)}
                  disabled={isExporting}
                  className="app-button app-button-secondary"
                >
                  <Download size={14} />
                  {isExporting ? "Exporting..." : "Export"}
                  <ChevronDown size={14} />
                </button>
                {showExportMenu ? (
                  <div className="app-popover-enter dropdown-panel absolute right-0 top-[calc(100%+0.75rem)] z-30 min-w-[16rem] rounded-[24px] p-2 shadow-2xl">
                    <button type="button" onClick={() => void handleExport("xlsx")} className="app-action-button w-full justify-start border-transparent bg-transparent text-left">
                      <FileSpreadsheet size={15} />
                      Export Excel
                    </button>
                    <button type="button" onClick={() => void handleExport("docx")} className="app-action-button mt-1 w-full justify-start border-transparent bg-transparent text-left">
                      <FileText size={15} />
                      Export Word
                    </button>
                  </div>
                ) : null}
              </div>
              <button type="button" onClick={() => void handleReplan()} disabled={isReplanning} className="app-button app-button-secondary">
                <RefreshCcw size={14} />
                {isReplanning ? "Re-planning..." : "Re-plan"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm((current) => !current);
                  window.setTimeout(() => {
                    document.getElementById("manual-deadline-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
                  }, 80);
                }}
                className="app-button app-button-primary"
              >
                <Plus size={14} className="shrink-0" />
                Add deadline
              </button>
            </div>
          </div>
        </section>

        {planner ? (
          <>
            <section className="grid gap-4 md:grid-cols-4">
              <StatCard label="Tracked deadlines" value={String(planner.metrics.totalDeadlines)} />
              <StatCard label="Due in 7 days" value={String(planner.metrics.dueSoonCount)} />
              <StatCard label="High-risk items" value={String(planner.metrics.highRiskCount)} />
              <StatCard label="Planned hours" value={String(planner.metrics.plannedHours)} />
            </section>

            <section className="grid gap-5 xl:grid-cols-[1fr_340px]">
              <div className="glass-panel rounded-[28px] p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-[var(--app-text-muted)]">Calendar</p>
                    <h2 className="mt-2 text-2xl font-semibold text-white">Plan against real due dates</h2>
                  </div>
                  <div className="flex gap-2">
                    {(["month", "week"] as const).map((value) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setCalendarView(value)}
                        className={calendarView === value ? "app-segmented-button app-segmented-button-active" : "app-segmented-button"}
                      >
                        {value}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-7 gap-2 text-center text-xs uppercase tracking-[0.18em] text-[var(--app-text-muted)]">
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((label) => (
                    <div key={label}>{label}</div>
                  ))}
                </div>

                <div className="mt-3 grid grid-cols-7 gap-2">
                  {calendarCells.map((date) => {
                    const dayEvents = planner.items.filter((item) => new Date(item.dueDate).toDateString() === date.toDateString());
                    const daySessions = planner.sessions.filter((item) => new Date(item.startAt).toDateString() === date.toDateString());
                    return (
                      <div key={date.toISOString()} className="app-surface-muted min-h-[8rem] rounded-[24px] p-3">
                        <p className="text-sm font-medium text-white">{date.getDate()}</p>
                        <div className="mt-3 space-y-2">
                          {dayEvents.slice(0, 2).map((item) => (
                            <div key={item.id} className={item.urgency === "high" ? "rounded-xl bg-red-500/15 px-2 py-1 text-[11px] text-[var(--app-text)]" : item.urgency === "medium" ? "rounded-xl bg-amber-500/15 px-2 py-1 text-[11px] text-[var(--app-text)]" : "rounded-xl bg-emerald-500/15 px-2 py-1 text-[11px] text-[var(--app-text)]"}>
                              {item.title}
                            </div>
                          ))}
                          {daySessions.slice(0, 1).map((session) => (
                            <div key={session.id} className="rounded-xl bg-[rgba(77,117,255,0.14)] px-2 py-1 text-[11px] text-[var(--app-primary-strong)]">
                              Study block
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-5">
                <div className="glass-panel rounded-[28px] p-6">
                  <p className="text-xs uppercase tracking-[0.2em] text-[var(--app-text-muted)]">AI study planner</p>
                  <h2 className="mt-2 text-2xl font-semibold text-white">Recommended sessions</h2>
                  <div className="mt-5 space-y-3">
                    {studyPlanError ? (
                      <div className="rounded-2xl border border-red-400/20 bg-red-500/10 p-4 text-sm text-[var(--app-text)]">{studyPlanError}</div>
                    ) : studyPlan === null ? (
                      Array.from({ length: 3 }).map((_, index) => <Skeleton key={index} className="h-20 rounded-2xl" />)
                    ) : studyPlan.data?.sessions.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-[var(--app-line)] bg-white/5 p-4 text-sm text-[var(--app-text-muted)]">
                        Add or inherit deadlines first so the planner can allocate study blocks.
                      </div>
                    ) : (
                      studyPlan.data?.sessions.slice(0, 6).map((session) => (
                        <div key={session.id} className="app-surface-muted rounded-2xl p-4">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <p className="font-medium text-white">{session.title}</p>
                              <p className="mt-1 text-xs text-[var(--app-text-muted)]">{formatDeadline(session.startAt)} to {new Date(session.endAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</p>
                            </div>
                            <span className={session.urgency === "high" ? "rounded-full bg-red-500/15 px-3 py-1 text-xs font-medium text-[var(--app-text)]" : session.urgency === "medium" ? "rounded-full bg-amber-500/15 px-3 py-1 text-xs font-medium text-[var(--app-text)]" : "rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-medium text-[var(--app-text)]"}>
                              {session.urgency}
                            </span>
                          </div>
                          <p className="mt-3 text-sm leading-7 text-[var(--app-text-soft)]">{session.reasoning}</p>
                        </div>
                      ))
                    )}
                    {studyPlan?.data?.summary ? (
                      <div className="rounded-2xl border border-[var(--app-line)] bg-white/5 p-4">
                        <p className="text-sm leading-7 text-[var(--app-text-soft)]">{studyPlan.data.summary}</p>
                        {studyPlan.meta.mode === "fallback" ? (
                          <p className="mt-2 text-xs font-medium uppercase tracking-[0.18em] text-[var(--app-text-muted)]">
                            Deterministic planner mode
                          </p>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                </div>

                <div className="glass-panel rounded-[28px] p-6">
                  <p className="text-xs uppercase tracking-[0.2em] text-[var(--app-text-muted)]">Upcoming deadlines</p>
                  <div className="mt-5 space-y-3">
                    {planner.items.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-[var(--app-line)] bg-white/5 p-4 text-sm text-[var(--app-text-muted)]">
                        No deadlines are currently available.
                      </div>
                    ) : (
                      planner.items.slice(0, 8).map((item) => (
                        <div key={item.id} className="app-surface-muted rounded-2xl p-4">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <p className="font-medium text-white">{item.title}</p>
                              <p className="mt-1 text-xs text-[var(--app-text-muted)]">{item.roomName ?? "Manual planning item"}</p>
                            </div>
                            <span className={item.urgency === "high" ? "rounded-full bg-red-500/15 px-3 py-1 text-xs font-medium text-[var(--app-text)]" : item.urgency === "medium" ? "rounded-full bg-amber-500/15 px-3 py-1 text-xs font-medium text-[var(--app-text)]" : "rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-medium text-[var(--app-text)]"}>
                              {item.riskScore}%
                            </span>
                          </div>
                          <p className="mt-3 text-sm leading-7 text-[var(--app-text-soft)]">{item.explanation}</p>
                          <p className="mt-3 text-xs text-[var(--app-text-muted)]">Due {formatDeadline(item.dueDate)}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </section>
          </>
        ) : (
          <div className="grid gap-4 md:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} className="h-40 rounded-[28px]" />
            ))}
          </div>
        )}

        {showForm ? (
          <section id="manual-deadline-form" className="app-tab-panel glass-panel rounded-[28px] p-6">
            <h2 className="text-2xl font-semibold text-white">Add manual deadline</h2>
            <form onSubmit={handleSubmit} className="mt-5 grid gap-4 lg:grid-cols-2">
              <input value={draft.title} onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))} placeholder="Deadline title" className="app-input" />
              <input type="datetime-local" value={draft.dueDate} onChange={(event) => setDraft((current) => ({ ...current, dueDate: event.target.value }))} className="app-input" />
              <input value={draft.estimatedMinutes} onChange={(event) => setDraft((current) => ({ ...current, estimatedMinutes: event.target.value }))} placeholder="Estimated minutes" className="app-input" />
              <select value={draft.roomId} onChange={(event) => setDraft((current) => ({ ...current, roomId: event.target.value }))} className="app-input">
                <option value="">No room linkage</option>
                {(rooms as Doc<"rooms">[] | undefined)?.map((room) => (
                  <option key={room._id} value={room._id}>{room.name}</option>
                ))}
              </select>
              <textarea value={draft.notes} onChange={(event) => setDraft((current) => ({ ...current, notes: event.target.value }))} placeholder="Optional notes" className="app-textarea lg:col-span-2" />
              <div className="flex flex-wrap gap-3 lg:col-span-2">
                <button type="submit" disabled={isSubmitting} className="app-button app-button-primary">{isSubmitting ? "Saving..." : "Save deadline"}</button>
                <button type="button" onClick={() => setShowForm(false)} className="app-button app-button-secondary">Cancel</button>
              </div>
            </form>
            {status ? <p className="mt-4 text-sm text-[var(--app-text-soft)]">{status}</p> : null}
          </section>
        ) : status ? (
          <p className="text-sm text-[var(--app-text-soft)]">{status}</p>
        ) : null}
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="stat-card">
      <p className="text-xs uppercase tracking-[0.25em] text-[var(--app-text-muted)]">{label}</p>
      <p className="mt-4 text-3xl font-black text-[var(--app-text)]">{value}</p>
    </div>
  );
}
