"use client";

import { useEffect, useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useCurrentUser } from "@/hooks/useCurrentUser";

export default function SettingsPage() {
  const user = useCurrentUser();
  const updateProfile = useMutation(api.users.updateProfile);
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState("");
  const [prefs, setPrefs] = useState({
    newPost: true,
    upvote: true,
    comment: true,
    announcement: true,
    mention: true
  });

  useEffect(() => {
    if (user?.notifPrefs) {
      setPrefs(user.notifPrefs);
    }
  }, [user]);

  async function handleSave() {
    setIsSaving(true);
    setStatus("");
    try {
      await updateProfile({
        notifPrefs: prefs
      });
      setStatus("Notification preferences updated.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Unable to save settings.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="app-scroll">
      <div className="page-wrap page-stack">
        <div className="glass-panel rounded-[28px] p-6">
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="mt-2 text-sm text-gray-400">
            Control notification behavior and keep room activity aligned with how you actually work.
          </p>

          <div className="mt-6 grid gap-3">
            <SettingToggle label="New posts" checked={prefs.newPost} onChange={(checked) => setPrefs((current) => ({ ...current, newPost: checked }))} />
            <SettingToggle label="Upvotes" checked={prefs.upvote} onChange={(checked) => setPrefs((current) => ({ ...current, upvote: checked }))} />
            <SettingToggle label="Comments" checked={prefs.comment} onChange={(checked) => setPrefs((current) => ({ ...current, comment: checked }))} />
            <SettingToggle label="Announcements" checked={prefs.announcement} onChange={(checked) => setPrefs((current) => ({ ...current, announcement: checked }))} />
            <SettingToggle label="Mentions" checked={prefs.mention} onChange={(checked) => setPrefs((current) => ({ ...current, mention: checked }))} />
          </div>

          {status ? <p className="mt-4 text-sm text-gray-300">{status}</p> : null}

          <button onClick={() => void handleSave()} disabled={isSaving} className="mt-5 app-button app-button-primary w-full sm:w-auto">
            {isSaving ? "Saving..." : "Save settings"}
          </button>
        </div>
      </div>
    </div>
  );
}

function SettingToggle({
  label,
  checked,
  onChange
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-left"
    >
      <span className="text-sm text-white">{label}</span>
      <span className={`rounded-full px-3 py-1 text-xs ${checked ? "bg-brand-500 text-white" : "bg-white/10 text-gray-400"}`}>
        {checked ? "On" : "Off"}
      </span>
    </button>
  );
}
