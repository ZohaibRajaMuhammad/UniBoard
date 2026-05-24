"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useMutation } from "convex/react";
import { Bot, RotateCcw, Save, Settings2, ShieldCheck } from "lucide-react";
import { api } from "../../../../convex/_generated/api";
import { ThemeToggle } from "@/components/system/ThemeToggle";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { cn } from "@/lib/utils";

const DEFAULT_PREFS = {
  newPost: true,
  upvote: true,
  comment: true,
  announcement: true,
  mention: true
};

type NotificationPrefs = typeof DEFAULT_PREFS;

const SETTING_GROUPS: Array<{
  title: string;
  description: string;
  icon: typeof Settings2;
  items: Array<{ key: keyof NotificationPrefs; label: string; help: string }>;
}> = [
  {
    title: "Activity alerts",
    description: "Choose which room events should actively pull your attention back into the workspace.",
    icon: Settings2,
    items: [
      { key: "newPost", label: "New posts", help: "Notify when a room publishes a fresh update." },
      { key: "announcement", label: "Announcements", help: "Keep pinned course-wide notices loud and visible." },
      { key: "comment", label: "Comments", help: "Follow discussion changes on the content you participate in." }
    ]
  },
  {
    title: "Recognition and follow-up",
    description: "Control the lighter-weight signals that support collaboration without overloading your inbox.",
    icon: Bot,
    items: [
      { key: "mention", label: "Mentions", help: "Surface replies or references where someone pulls you into a thread." },
      { key: "upvote", label: "Upvotes", help: "Track reputation signals when your posts help the room." }
    ]
  }
];

export default function SettingsPage() {
  const user = useCurrentUser();
  const updateProfile = useMutation(api.users.updateProfile);
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState("");
  const [prefs, setPrefs] = useState<NotificationPrefs>(DEFAULT_PREFS);
  const [initialPrefs, setInitialPrefs] = useState<NotificationPrefs>(DEFAULT_PREFS);

  useEffect(() => {
    const nextPrefs = user?.notifPrefs ?? DEFAULT_PREFS;
    setPrefs(nextPrefs);
    setInitialPrefs(nextPrefs);
  }, [user]);

  const dirtyKeys = useMemo(
    () =>
      (Object.keys(DEFAULT_PREFS) as Array<keyof NotificationPrefs>).filter(
        (key) => prefs[key] !== initialPrefs[key]
      ),
    [initialPrefs, prefs]
  );

  const hasChanges = dirtyKeys.length > 0;

  async function handleSave() {
    if (!hasChanges || isSaving) {
      return;
    }

    setIsSaving(true);
    setStatus("");
    try {
      await updateProfile({ notifPrefs: prefs });
      setInitialPrefs(prefs);
      setStatus("Notification preferences updated.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Unable to save settings.");
    } finally {
      setIsSaving(false);
    }
  }

  function handleReset() {
    setPrefs(DEFAULT_PREFS);
    setStatus("");
  }

  return (
    <div className="app-scroll">
      <div className="page-wrap page-stack shell-content-column">
        <section className="glass-panel rounded-[28px] p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl">
              <p className="section-eyebrow text-[var(--app-primary-strong)]">Settings</p>
              <h1 className="mt-2 text-3xl font-bold text-[var(--app-text)]">Personal controls for room activity</h1>
              <p className="mt-3 text-sm leading-7 text-[var(--app-text-soft)]">
                Tune the alerts that matter, keep low-signal noise down, and use room settings for policy changes that affect everyone.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleReset}
                disabled={isSaving || !hasChanges}
                className="app-button app-button-secondary disabled:cursor-not-allowed disabled:opacity-60"
              >
                <RotateCcw size={14} />
                Reset defaults
              </button>
              <button
                type="button"
                onClick={() => void handleSave()}
                disabled={isSaving || !hasChanges}
                className="app-button app-button-primary disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Save size={14} />
                {isSaving ? "Saving..." : "Save changes"}
              </button>
            </div>
          </div>

          <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="grid gap-4">
              <section className="app-surface-muted rounded-[24px] p-5">
                <div className="mb-5 flex items-start gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[rgba(109,140,255,0.25)] bg-[rgba(77,117,255,0.1)] text-[var(--app-primary-strong)]">
                    <ShieldCheck size={18} />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-[var(--app-text)]">Appearance</h2>
                    <p className="mt-1 text-sm leading-6 text-[var(--app-text-muted)]">Theme changes are now persisted across your authenticated workspace, not just this browser session.</p>
                  </div>
                </div>
                <ThemeToggle />
              </section>

              {SETTING_GROUPS.map((group) => {
                const Icon = group.icon;
                return (
                  <section key={group.title} className="app-surface-muted rounded-[24px] p-5">
                    <div className="mb-5 flex items-start gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[rgba(109,140,255,0.25)] bg-[rgba(77,117,255,0.1)] text-[var(--app-primary-strong)]">
                        <Icon size={18} />
                      </div>
                      <div>
                        <h2 className="text-lg font-semibold text-[var(--app-text)]">{group.title}</h2>
                        <p className="mt-1 text-sm leading-6 text-[var(--app-text-muted)]">{group.description}</p>
                      </div>
                    </div>
                    <div className="grid gap-3">
                      {group.items.map((item) => (
                        <SettingToggle
                          key={item.key}
                          label={item.label}
                          help={item.help}
                          checked={prefs[item.key]}
                          changed={prefs[item.key] !== initialPrefs[item.key]}
                          onChange={(checked) => {
                            setPrefs((current) => ({ ...current, [item.key]: checked }));
                            setStatus("");
                          }}
                        />
                      ))}
                    </div>
                  </section>
                );
              })}
            </div>

            <aside className="app-surface-muted rounded-[24px] p-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--app-text-muted)]">Workspace notes</p>
              <h2 className="mt-2 text-xl font-semibold text-[var(--app-text)]">What is controlled here</h2>
              <div className="mt-4 space-y-3 text-sm leading-7 text-[var(--app-text-soft)]">
                <p>These preferences change your own notification experience only. Room-wide policy remains under room administration.</p>
                <p>AI enablement is currently enforced at the room level, not as a personal override, so this screen leaves those controls read-only.</p>
              </div>

              <div className="mt-5 rounded-2xl border border-[var(--app-line)] bg-white/[0.03] p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-[var(--app-text-muted)]">Dirty state</p>
                <p className="mt-2 text-sm text-[var(--app-text)]">
                  {hasChanges ? `${dirtyKeys.length} unsaved change${dirtyKeys.length === 1 ? "" : "s"}` : "All changes saved"}
                </p>
              </div>

              <Link href="/profile" className="mt-4 inline-flex text-sm font-medium text-[var(--app-primary-strong)] transition hover:text-[var(--app-text)]">
                Open profile details
              </Link>
            </aside>
          </div>

          {status ? <p className="mt-4 text-sm text-[var(--app-text-soft)]">{status}</p> : null}
        </section>
      </div>
    </div>
  );
}

function SettingToggle({
  label,
  help,
  checked,
  changed,
  onChange
}: {
  label: string;
  help: string;
  checked: boolean;
  changed: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex min-h-11 items-center justify-between gap-4 rounded-2xl border border-[var(--app-line)] bg-white/[0.03] px-4 py-3 text-left transition hover:bg-white/[0.05] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(109,140,255,0.45)]"
    >
      <div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-[var(--app-text)]">{label}</span>
          {changed ? <span className="rounded-full bg-[rgba(77,117,255,0.14)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--app-primary-strong)]">Changed</span> : null}
        </div>
        <p className="mt-1 text-xs leading-5 text-[var(--app-text-muted)]">{help}</p>
      </div>
      <span
        className={cn(
          "rounded-full px-3 py-1 text-xs font-semibold",
          checked
            ? "border border-[rgba(77,117,255,0.24)] bg-[rgba(77,117,255,0.14)] text-[var(--app-text)]"
            : "bg-white/10 text-[var(--app-text-muted)]"
        )}
      >
        {checked ? "On" : "Off"}
      </span>
    </button>
  );
}
