"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../../../convex/_generated/api";
import type { Id } from "../../../../../../convex/_generated/dataModel";
import { ROOM_COLORS, ROOM_EMOJIS } from "@/lib/constants";

type RoomSettingsForm = {
  name: string;
  description: string;
  emoji: (typeof ROOM_EMOJIS)[number];
  color: (typeof ROOM_COLORS)[number];
  isPublic: boolean;
  allowAnonymous: boolean;
  aiEnabled: boolean;
  allowStudentInvite: boolean;
  isArchived: boolean;
};

export default function RoomSettingsPage({ params }: { params: { roomId: string } }) {
  const roomId = params.roomId as Id<"rooms">;
  const room = useQuery(api.rooms.getById, { roomId });
  const members = useQuery(api.rooms.getMembers, { roomId });
  const updateSettings = useMutation(api.rooms.updateSettings);
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState("");
  const [form, setForm] = useState<RoomSettingsForm>({
    name: "",
    description: "",
    emoji: ROOM_EMOJIS[0],
    color: ROOM_COLORS[0],
    isPublic: true,
    allowAnonymous: true,
    aiEnabled: false,
    allowStudentInvite: false,
    isArchived: false
  });

  useEffect(() => {
    if (!room) {
      return;
    }
    setForm({
      name: room.name,
      description: room.description ?? "",
      emoji: room.emoji as (typeof ROOM_EMOJIS)[number],
      color: room.color as (typeof ROOM_COLORS)[number],
      isPublic: room.isPublic,
      allowAnonymous: room.allowAnonymous ?? true,
      aiEnabled: room.aiEnabled ?? false,
      allowStudentInvite: room.allowStudentInvite ?? false,
      isArchived: room.isArchived ?? false
    });
  }, [room]);

  async function handleSave() {
    setIsSaving(true);
    setStatus("");
    try {
      await updateSettings({
        roomId,
        name: form.name,
        description: form.description,
        emoji: form.emoji,
        color: form.color,
        isPublic: form.isPublic,
        allowAnonymous: form.allowAnonymous,
        aiEnabled: form.aiEnabled,
        allowStudentInvite: form.allowStudentInvite,
        isArchived: form.isArchived
      });
      setStatus("Room settings saved.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Unable to save room settings.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="app-scroll">
      <div className="page-wrap page-stack">
        <div className="glass-panel rounded-[28px] p-6">
          <h1 className="text-2xl font-bold">Room settings</h1>
          <p className="mt-2 text-sm text-gray-400">Edit room identity, privacy, invites, AI visibility, and archive state from one place.</p>

          {room ? (
            <div className="mt-6 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
              <div className="space-y-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Room name">
                    <input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} className="app-input" />
                  </Field>
                  <Field label="Subject">
                    <input value={room.subject} disabled className="app-input opacity-70" />
                  </Field>
                </div>

                <Field label="Description">
                  <textarea
                    value={form.description}
                    onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                    className="app-textarea min-h-[8rem]"
                  />
                </Field>

                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="Accent color">
                    <div className="flex flex-wrap gap-2">
                      {ROOM_COLORS.map((color) => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => setForm((current) => ({ ...current, color }))}
                          className={`rounded-xl border px-3 py-2 text-sm capitalize transition ${form.color === color ? "border-brand-400 bg-brand-500/20 text-white" : "border-white/10 bg-white/5 text-gray-300 hover:bg-white/10"}`}
                        >
                          {color}
                        </button>
                      ))}
                    </div>
                  </Field>
                  <Field label="Emoji">
                    <div className="grid grid-cols-5 gap-2">
                      {ROOM_EMOJIS.map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => setForm((current) => ({ ...current, emoji }))}
                          className={`rounded-xl border px-3 py-2 text-lg transition ${form.emoji === emoji ? "border-brand-400 bg-brand-500/20" : "border-white/10 bg-white/5 hover:bg-white/10"}`}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </Field>
                </div>

                <div className="grid gap-3">
                  <Toggle label="Public room" checked={form.isPublic} onChange={(checked) => setForm((current) => ({ ...current, isPublic: checked }))} />
                  <Toggle label="Allow anonymous posting" checked={form.allowAnonymous} onChange={(checked) => setForm((current) => ({ ...current, allowAnonymous: checked }))} />
                  <Toggle label="Allow student invites" checked={form.allowStudentInvite} onChange={(checked) => setForm((current) => ({ ...current, allowStudentInvite: checked }))} />
                  <Toggle label="Enable AI helper" checked={form.aiEnabled} onChange={(checked) => setForm((current) => ({ ...current, aiEnabled: checked }))} />
                  <Toggle label="Archive room" checked={form.isArchived} onChange={(checked) => setForm((current) => ({ ...current, isArchived: checked }))} />
                </div>

                {status ? <p className="text-sm text-gray-300">{status}</p> : null}

                <button onClick={() => void handleSave()} disabled={isSaving} className="app-button app-button-primary w-full sm:w-auto">
                  {isSaving ? "Saving..." : "Save settings"}
                </button>
              </div>

              <div className="space-y-4">
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Join code</p>
                  <p className="mt-2 text-lg font-semibold text-white">{room.joinCode ?? "Public rooms do not use join codes"}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Batch</p>
                  <p className="mt-2 text-lg font-semibold text-white">{room.batch}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Members</p>
                  <div className="mt-3 space-y-2">
                    {members?.map((member) => (
                      <div key={member._id} className="flex items-center justify-between gap-3 rounded-xl bg-white/[0.03] px-3 py-2 text-sm">
                        <span className="truncate text-white">{member.user.name}</span>
                        <span className="text-xs uppercase tracking-[0.18em] text-gray-500">{member.role}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-6 text-sm text-gray-500">Loading room settings...</div>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-semibold text-gray-200">{label}</span>
      {children}
    </label>
  );
}

function Toggle({
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
