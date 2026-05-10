"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { CalendarDays, Download, Plus, RefreshCcw } from "lucide-react";
import { api } from "../../../../convex/_generated/api";
import type { Doc, Id } from "../../../../convex/_generated/dataModel";
import { getAi } from "@/lib/ai/client";
import type { AiEnvelope, StudyPlan } from "@/lib/ai/contracts";
import { formatDeadline } from "@/lib/utils";

type CalendarView = "month" | "week";

export default function PlannerPage() {
  const planner = useQuery(api.planner.getSnapshot);
  const rooms = useQuery(api.rooms.getMyRooms);
  const createManualDeadline = useMutation(api.planner.createManualDeadline);
  const replan = useMutation(api.planner.replan);
  const exportCalendar = useMutation(api.planner.exportCalendar);
  const [calendarView, setCalendarView] = useState<CalendarView>("month");
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState("");
  const [studyPlan, setStudyPlan] = useState<AiEnvelope<StudyPlan> | null>(null);
  const [studyPlanError, setStudyPlanError] = useState("");
  const [draft, setDraft] = useState({
    title: "",
    dueDate: "",
    estimatedMinutes: "120",
    roomId: "",
    notes: ""
  });

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
        }
      })
      .catch((error) => {
        if (!cancelled) {
          setStudyPlanError(error instanceof Error ? error.message : "Unable to load the AI study planner.");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [planner?.generatedAt]);

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
      setDraft({
        title: "",
        dueDate: "",
        estimatedMinutes: "120",
        roomId: "",
        notes: ""
      });
      setShowForm(false);
      setStatus("Manual deadline added.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Unable to add deadline.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="app-scroll">
      <div className="page-wrap page-stack">
        <section className="spotlight-ring glass-panel rounded-[34px] p-6 sm:p-8">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-3xl">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05]">
                <CalendarDays size={20} className="text-brand-200" />
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-white">Planner</h1>
              <p className="mt-2 text-sm leading-6 text-gray-300">
                Turn deadlines into a visible calendar, inspect AI-prioritized study blocks, and add manual work that does not yet live in room posts.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={async () => {
                  const result = await exportCalendar({});
                  const blob = new Blob([result.content], { type: "text/calendar;charset=utf-8" });
                  const url = URL.createObjectURL(blob);
                  const anchor = document.createElement("a");
                  anchor.href = url;
                  anchor.download = result.filename;
                  anchor.click();
                  URL.revokeObjectURL(url);
                }}
                className="app-button app-button-secondary inline-flex items-center gap-2"
              >
                <Download size={14} />
                Export
              </button>
              <button
                type="button"
                onClick={() => void replan({})}
                className="app-button app-button-secondary inline-flex items-center gap-2"
              >
                <RefreshCcw size={14} />
                Re-plan
              </button>
              <button
                type="button"
                onClick={() => setShowForm((current) => !current)}
                className="app-button app-button-primary inline-flex items-center gap-2"
              >
                <Plus size={14} />
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

            <section className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
              <div className="glass-panel rounded-[28px] p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Calendar</p>
                    <h2 className="mt-2 text-2xl font-semibold text-white">Plan against real due dates</h2>
                  </div>
                  <div className="flex gap-2">
                    {(["month", "week"] as const).map((value) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setCalendarView(value)}
                        className={calendarView === value ? "rounded-2xl bg-brand-500 px-4 py-2 text-sm font-medium text-white" : "rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-gray-300"}
                      >
                        {value}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-7 gap-2 text-center text-xs uppercase tracking-[0.18em] text-gray-500">
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((label) => (
                    <div key={label}>{label}</div>
                  ))}
                </div>

                <div className="mt-3 grid grid-cols-7 gap-2">
                  {calendarCells.map((date) => {
                    const dayEvents = planner.items.filter((item) => new Date(item.dueDate).toDateString() === date.toDateString());
                    const daySessions = planner.sessions.filter((item) => new Date(item.startAt).toDateString() === date.toDateString());
                    return (
                      <div key={date.toISOString()} className="min-h-[8rem] rounded-[24px] border border-white/10 bg-black/20 p-3">
                        <p className="text-sm font-medium text-white">{date.getDate()}</p>
                        <div className="mt-3 space-y-2">
                          {dayEvents.slice(0, 2).map((item) => (
                            <div key={item.id} className={item.urgency === "high" ? "rounded-xl bg-red-500/15 px-2 py-1 text-[11px] text-red-100" : item.urgency === "medium" ? "rounded-xl bg-amber-500/15 px-2 py-1 text-[11px] text-amber-100" : "rounded-xl bg-emerald-500/15 px-2 py-1 text-[11px] text-emerald-100"}>
                              {item.title}
                            </div>
                          ))}
                          {daySessions.slice(0, 1).map((session) => (
                            <div key={session.id} className="rounded-xl bg-brand-500/15 px-2 py-1 text-[11px] text-brand-100">
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
                  <p className="text-xs uppercase tracking-[0.2em] text-gray-500">AI study planner</p>
                  <h2 className="mt-2 text-2xl font-semibold text-white">Recommended sessions</h2>
                  <div className="mt-5 space-y-3">
                    {studyPlanError ? (
                      <div className="rounded-2xl border border-red-400/20 bg-red-500/10 p-4 text-sm text-red-100">{studyPlanError}</div>
                    ) : studyPlan === null ? (
                      Array.from({ length: 3 }).map((_, index) => <div key={index} className="h-20 animate-pulse rounded-2xl bg-white/5" />)
                    ) : studyPlan.data?.sessions.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-white/10 bg-black/20 p-4 text-sm text-gray-400">
                        Add or inherit deadlines first so the planner can allocate study blocks.
                      </div>
                    ) : (
                      studyPlan.data?.sessions.slice(0, 6).map((session) => (
                        <div key={session.id} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <p className="font-medium text-white">{session.title}</p>
                              <p className="mt-1 text-xs text-gray-500">{formatDeadline(session.startAt)} to {new Date(session.endAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</p>
                            </div>
                            <span className={session.urgency === "high" ? "rounded-full bg-red-500/15 px-3 py-1 text-xs font-medium text-red-100" : session.urgency === "medium" ? "rounded-full bg-amber-500/15 px-3 py-1 text-xs font-medium text-amber-100" : "rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-medium text-emerald-100"}>
                              {session.urgency}
                            </span>
                          </div>
                          <p className="mt-3 text-sm leading-6 text-gray-300">{session.reasoning}</p>
                        </div>
                      ))
                    )}
                    {studyPlan?.data?.summary ? <p className="text-sm text-gray-400">{studyPlan.data.summary}</p> : null}
                  </div>
                </div>

                <div className="glass-panel rounded-[28px] p-6">
                  <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Upcoming deadlines</p>
                  <div className="mt-5 space-y-3">
                    {planner.items.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-white/10 bg-black/20 p-4 text-sm text-gray-400">
                        No deadlines are currently available.
                      </div>
                    ) : (
                      planner.items.slice(0, 8).map((item) => (
                        <div key={item.id} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <p className="font-medium text-white">{item.title}</p>
                              <p className="mt-1 text-xs text-gray-500">{item.roomName ?? "Manual planning item"}</p>
                            </div>
                            <span className={item.urgency === "high" ? "rounded-full bg-red-500/15 px-3 py-1 text-xs font-medium text-red-100" : item.urgency === "medium" ? "rounded-full bg-amber-500/15 px-3 py-1 text-xs font-medium text-amber-100" : "rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-medium text-emerald-100"}>
                              {item.riskScore}%
                            </span>
                          </div>
                          <p className="mt-3 text-sm leading-6 text-gray-300">{item.explanation}</p>
                          <p className="mt-3 text-xs text-gray-500">Due {formatDeadline(item.dueDate)}</p>
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
              <div key={index} className="h-40 animate-pulse rounded-[28px] bg-white/5" />
            ))}
          </div>
        )}

        {showForm ? (
          <section className="glass-panel rounded-[28px] p-6">
            <h2 className="text-2xl font-semibold text-white">Add manual deadline</h2>
            <form onSubmit={handleSubmit} className="mt-5 grid gap-4 lg:grid-cols-2">
              <input
                value={draft.title}
                onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))}
                placeholder="Deadline title"
                className="app-input"
              />
              <input
                type="datetime-local"
                value={draft.dueDate}
                onChange={(event) => setDraft((current) => ({ ...current, dueDate: event.target.value }))}
                className="app-input"
              />
              <input
                value={draft.estimatedMinutes}
                onChange={(event) => setDraft((current) => ({ ...current, estimatedMinutes: event.target.value }))}
                placeholder="Estimated minutes"
                className="app-input"
              />
              <select
                value={draft.roomId}
                onChange={(event) => setDraft((current) => ({ ...current, roomId: event.target.value }))}
                className="app-input"
              >
                <option value="">No room linkage</option>
                {(rooms as Doc<"rooms">[] | undefined)?.map((room) => (
                  <option key={room._id} value={room._id}>
                    {room.name}
                  </option>
                ))}
              </select>
              <textarea
                value={draft.notes}
                onChange={(event) => setDraft((current) => ({ ...current, notes: event.target.value }))}
                placeholder="Optional notes"
                className="app-textarea lg:col-span-2"
              />
              <div className="flex flex-wrap gap-3 lg:col-span-2">
                <button type="submit" disabled={isSubmitting} className="app-button app-button-primary">
                  {isSubmitting ? "Saving..." : "Save deadline"}
                </button>
                <button type="button" onClick={() => setShowForm(false)} className="app-button app-button-secondary">
                  Cancel
                </button>
              </div>
            </form>
            {status ? <p className="mt-4 text-sm text-gray-300">{status}</p> : null}
          </section>
        ) : status ? (
          <p className="text-sm text-gray-300">{status}</p>
        ) : null}
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="stat-card">
      <p className="text-xs uppercase tracking-[0.25em] text-gray-500">{label}</p>
      <p className="mt-4 text-3xl font-black text-white">{value}</p>
    </div>
  );
}
