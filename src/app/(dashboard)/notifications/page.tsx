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
    <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-6">
      <div className="mx-auto max-w-4xl">
        <div className="spotlight-ring glass-panel mb-6 rounded-[34px] p-6 sm:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05]">
                <BellRing size={20} className="text-brand-200" />
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-white">Notifications</h1>
              <p className="mt-2 text-sm leading-6 text-gray-300">Triage new activity quickly, review what needs attention, and clear noise when you are done.</p>
            </div>
            <button
              onClick={() => void markAllRead({})}
              className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-white transition hover:bg-white/10"
            >
              <CheckCheck size={16} />
              Mark all read
            </button>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-3xl border border-white/10 bg-black/20 p-4">
              <p className="text-xs uppercase tracking-[0.22em] text-gray-500">Unread</p>
              <p className="mt-3 text-3xl font-black text-white">{unreadCount}</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-black/20 p-4">
              <p className="text-xs uppercase tracking-[0.22em] text-gray-500">Total</p>
              <p className="mt-3 text-3xl font-black text-white">{(notifications as Notification[] | undefined)?.length ?? 0}</p>
            </div>
          </div>

          <div className="mt-5 flex gap-2">
            {(["all", "unread"] as const).map((value) => (
              <button
                key={value}
                onClick={() => setFilter(value)}
                className={`rounded-2xl px-4 py-2 text-sm font-medium transition ${filter === value ? "bg-brand-500 text-white" : "border border-white/10 bg-white/5 text-gray-300"}`}
              >
                {value === "all" ? "All activity" : "Unread only"}
              </button>
            ))}
          </div>
        </div>

        <div className="glass-panel rounded-[28px]">
          {notifications === undefined ? (
            <div className="space-y-4 p-6">
              {Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="h-16 animate-pulse rounded-2xl bg-white/5" />
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="p-10 text-center text-sm text-gray-400">No notifications yet.</div>
          ) : (
            <div className="divide-y divide-white/10">
              {items.map((notification) => (
                <div key={notification._id} className={`p-5 ${notification.isRead ? "" : "bg-brand-500/[0.03]"}`}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      {notification.roomId ? (
                        <Link
                          href={notification.postId ? `/rooms/${notification.roomId}?post=${notification.postId}` : `/rooms/${notification.roomId}`}
                          onClick={() => void markRead({ notificationId: notification._id })}
                          className="block"
                        >
                          <p className="text-sm font-medium text-white">{notification.message}</p>
                          <p className="mt-1 text-xs text-gray-500">{notification.type.replace("_", " ")}</p>
                        </Link>
                      ) : (
                        <>
                          <p className="text-sm font-medium text-white">{notification.message}</p>
                          <p className="mt-1 text-xs text-gray-500">{notification.type.replace("_", " ")}</p>
                        </>
                      )}
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-2">
                      <span className="text-xs text-gray-500">{formatRelativeTime(notification.createdAt)}</span>
                      {!notification.isRead ? (
                        <button
                          onClick={() => void markRead({ notificationId: notification._id })}
                          className="text-xs font-medium text-brand-200 transition hover:text-white"
                        >
                          Mark read
                        </button>
                      ) : null}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
