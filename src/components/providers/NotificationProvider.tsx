"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { Bell, CheckCircle2, Info, TriangleAlert, X } from "lucide-react";
import { cn } from "@/lib/utils";

type NotifyTone = "success" | "error" | "info" | "warning" | "ai";
type NotifyPriority = "low" | "normal" | "high";

export type NotifyInput = {
  title: string;
  message: string;
  tone?: NotifyTone;
  priority?: NotifyPriority;
  desktop?: boolean;
  tag?: string;
};

type NotificationItem = NotifyInput & {
  id: string;
};

type NotificationContextValue = {
  notify: (input: NotifyInput) => void;
  permission: NotificationPermission | "unsupported";
  requestPermission: () => Promise<NotificationPermission | "unsupported">;
};

const NotificationContext = createContext<NotificationContextValue | null>(null);

function createId() {
  return `notify_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function getToneIcon(tone: NotifyTone) {
  if (tone === "success") return CheckCircle2;
  if (tone === "error") return TriangleAlert;
  if (tone === "warning") return TriangleAlert;
  if (tone === "ai") return Bell;
  return Info;
}

function getToneClasses(tone: NotifyTone) {
  if (tone === "success") return "border-emerald-400/25 bg-emerald-500/12 text-emerald-50";
  if (tone === "error") return "border-red-400/25 bg-red-500/12 text-red-50";
  if (tone === "warning") return "border-amber-400/25 bg-amber-500/12 text-amber-50";
  if (tone === "ai") return "border-[rgba(109,140,255,0.24)] bg-[rgba(77,117,255,0.14)] text-white";
  return "border-[var(--app-line)] bg-[var(--app-panel-strong)] text-white";
}

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">(
    typeof window === "undefined" || !("Notification" in window) ? "unsupported" : window.Notification.permission
  );
  const lastTagsRef = useRef<Map<string, number>>(new Map());

  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      setPermission("unsupported");
      return;
    }
    setPermission(window.Notification.permission);
  }, []);

  const requestPermission = useCallback(async () => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      setPermission("unsupported");
      return "unsupported";
    }
    const next = await window.Notification.requestPermission();
    setPermission(next);
    return next;
  }, []);

  const notify = useCallback(
    (input: NotifyInput) => {
      const nextItem: NotificationItem = {
        id: createId(),
        tone: input.tone ?? "info",
        priority: input.priority ?? "normal",
        desktop: input.desktop ?? true,
        ...input
      };

      if (input.tag) {
        const now = Date.now();
        const prev = lastTagsRef.current.get(input.tag) ?? 0;
        if (now - prev < 2500) {
          return;
        }
        lastTagsRef.current.set(input.tag, now);
      }

      setItems((current) => [...current, nextItem].slice(-5));
      window.setTimeout(() => {
        setItems((current) => current.filter((item) => item.id !== nextItem.id));
      }, nextItem.priority === "high" ? 7000 : 4200);

      if (typeof window === "undefined" || !("Notification" in window) || !nextItem.desktop) {
        return;
      }

      const showDesktop = () => {
        try {
          new window.Notification(nextItem.title, {
            body: nextItem.message,
            tag: nextItem.tag,
            silent: nextItem.priority === "low"
          });
        } catch {
          return;
        }
      };

      if (window.Notification.permission === "granted") {
        showDesktop();
      } else if (window.Notification.permission === "default" && nextItem.priority !== "low") {
        void window.Notification.requestPermission().then((next) => {
          setPermission(next);
          if (next === "granted") {
            showDesktop();
          }
        });
      }
    },
    []
  );

  const value = useMemo<NotificationContextValue>(
    () => ({
      notify,
      permission,
      requestPermission
    }),
    [notify, permission, requestPermission]
  );

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed right-4 top-4 z-[120] flex w-[min(22rem,calc(100vw-2rem))] flex-col gap-3">
        {items.map((item) => {
          const Icon = getToneIcon(item.tone ?? "info");
          return (
            <div
              key={item.id}
              className={cn(
                "pointer-events-auto rounded-[24px] border px-4 py-4 shadow-[0_22px_48px_rgba(8,14,28,0.22)] backdrop-blur-xl",
                getToneClasses(item.tone ?? "info")
              )}
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-2xl border border-white/10 bg-white/10">
                  <Icon size={16} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">{item.title}</p>
                  <p className="mt-1 text-xs leading-6 text-current/80">{item.message}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setItems((current) => current.filter((entry) => entry.id !== item.id))}
                  className="touch-target rounded-2xl border border-white/10 bg-white/10 p-2 text-current/70 transition hover:text-current"
                  aria-label="Dismiss notification"
                >
                  <X size={14} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </NotificationContext.Provider>
  );
}

export function useNotifier() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotifier must be used within NotificationProvider");
  }
  return context;
}
