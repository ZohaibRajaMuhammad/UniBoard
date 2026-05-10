"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { BellRing, CheckCheck } from "lucide-react";
import { api } from "../../../../convex/_generated/api";
import type { Notification } from "@/types";
import { formatRelativeTime } from "@/lib/utils";

export default function NotificationsPage() {
  const notifications = useQuery(api.notifications.getMyNotifications);
  const markAllRead = useMutation(api.notifications.markAllRead);
  const markRead = useMutation(api.notifications.markRead);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const items = useMemo(() => {
    const source = (notifications as Notification[] | undefined) ?? [];
    return source.filter((item) => (filter === "unread" ? !item.isRead : true));
  }, [filter, notifications]);

  const unreadCount = useMemo(
    () => ((notifications as Notification[] | undefined) ?? []).filter((item) => !item.isRead).length,
    [notifications]
  );

  return (
    <div className="app-scroll">
      <div className="page-wrap page-stack content-column">
        <section className="spotlight-ring glass-panel page-hero">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05]">
                <BellRing size={20} className="text-[var(--app-primary-strong)]" />
              </div>
              <p className="section-eyebrow text-[var(--app-primary-strong)]">Notifications</p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight text-white">Quiet operational alerts.</h1>
              <p className="mt-2 text-sm leading-7 text-[var(--app-text-soft)]">
                Triage new activity quickly, review what needs attention, and clear noise when you are done.
              </p>
            </div>
            <button
              onClick={() => void markAllRead({})}
              className="app-button app-button-secondary w-full sm:w-auto"
            >
              <CheckCheck size={16} />
              Mark all read
            </button>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <StatPill label="Unread" value={String(unreadCount)} />
            <StatPill label="Total" value={String((notifications as Notification[] | undefined)?.length ?? 0)} />
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            {(["all", "unread"] as const).map((value) => (
              <button
                key={value}
                onClick={() => setFilter(value)}
                className={
                  filter === value
                    ? "rounded-2xl bg-[var(--app-primary)] px-4 py-2 text-sm font-medium text-white"
                    : "rounded-2xl border border-[var(--app-line)] bg-white/5 px-4 py-2 text-sm text-[var(--app-text-soft)]"
                }
              >
                {value === "all" ? "All activity" : "Unread only"}
              </button>
            ))}
          </div>
        </section>

        <section className="glass-panel rounded-[28px] p-3 sm:p-4">
          {notifications === undefined ? (
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="h-20 animate-pulse rounded-[24px] bg-white/5" />
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="rounded-[24px] border border-dashed border-[var(--app-line)] bg-black/20 p-10 text-center text-sm text-[var(--app-text-muted)]">
              No notifications in this view.
            </div>
          ) : (
            <div className="space-y-2">
              {items.map((notification) => {
                const row = (
                  <div
                    className={`surface-row flex items-start gap-4 transition hover:bg-white/[0.05] ${
                      notification.isRead ? "" : "border-[rgba(109,140,255,0.18)] bg-[rgba(77,117,255,0.06)]"
                    }`}
                  >
                    <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-[var(--app-primary-strong)]">
                      <BellRing size={16} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-white">{notification.message}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        {!notification.isRead ? <span className="h-2 w-2 rounded-full bg-[var(--app-primary)]" /> : null}
                        <span className="text-xs uppercase tracking-[0.18em] text-[var(--app-text-muted)]">
                          {notification.type.replace("_", " ")}
                        </span>
                        <span className="text-xs text-[var(--app-text-muted)]">{formatRelativeTime(notification.createdAt)}</span>
                      </div>
                    </div>
                    <div className="shrink-0">
                      {!notification.isRead ? (
                        <button
                          onClick={(event) => {
                            event.preventDefault();
                            void markRead({ notificationId: notification._id });
                          }}
                          className="text-xs font-medium text-[var(--app-primary-strong)] transition hover:text-white"
                        >
                          Mark read
                        </button>
                      ) : null}
                    </div>
                  </div>
                );

                return notification.roomId ? (
                  <Link
                    key={notification._id}
                    href={notification.postId ? `/rooms/${notification.roomId}?post=${notification.postId}` : `/rooms/${notification.roomId}`}
                    onClick={() => void markRead({ notificationId: notification._id })}
                    className="block"
                  >
                    {row}
                  </Link>
                ) : (
                  <div key={notification._id}>{row}</div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function StatPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="stat-card">
      <p className="text-xs uppercase tracking-[0.22em] text-[var(--app-text-muted)]">{label}</p>
      <p className="mt-3 text-3xl font-black text-white">{value}</p>
    </div>
  );
}
