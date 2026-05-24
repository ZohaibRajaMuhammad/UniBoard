"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { ArrowLeft, Lock, Save } from "lucide-react";
import { api } from "../../../../../../convex/_generated/api";
import type { Id } from "../../../../../../convex/_generated/dataModel";
import { ROOM_COLORS } from "@/lib/constants";
import { getRoomIcon, ROOM_ICON_OPTIONS } from "@/lib/ui-icons";
import { cn } from "@/lib/utils";
import { useCurrentUser } from "@/hooks/useCurrentUser";

type RoomSettingsForm = {
  name: string;
  description: string;
  emoji: string;
  color: (typeof ROOM_COLORS)[number];
  isPublic: boolean;
  allowAnonymous: boolean;
  aiEnabled: boolean;
  allowStudentInvite: boolean;
  isArchived: boolean;
};

export default function RoomSettingsPage({ params }: { params: { roomId: string } }) {
  const roomId = params.roomId as Id<"rooms">;
  const currentUser = useCurrentUser();
  const room = useQuery(api.rooms.getById, { roomId });
  const members = useQuery(api.rooms.getMembers, { roomId });
  const updateSettings = useMutation(api.rooms.updateSettings);
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState("");
  const [form, setForm] = useState<RoomSettingsForm>({
    name: "",
    description: "",
    emoji: ROOM_ICON_OPTIONS[0].value,
    color: ROOM_COLORS[0],
    isPublic: true,
    allowAnonymous: true,
    aiEnabled: false,
    allowStudentInvite: false,
    isArchived: false
  });
  const [initialForm, setInitialForm] = useState<RoomSettingsForm | null>(null);

  useEffect(() => {
    if (!room) {
      return;
    }

    const nextForm: RoomSettingsForm = {
      name: room.name,
      description: room.description ?? "",
      emoji: room.emoji,
      color: room.color as (typeof ROOM_COLORS)[number],
      isPublic: room.isPublic,
      allowAnonymous: room.allowAnonymous ?? true,
      aiEnabled: room.aiEnabled ?? false,
      allowStudentInvite: room.allowStudentInvite ?? false,
      isArchived: room.isArchived ?? false
    };

    setForm(nextForm);
    setInitialForm(nextForm);
  }, [room]);

  const currentMembership = useMemo(
    () => members?.find((member) => member.user._id === currentUser?._id),
    [currentUser?._id, members]
  );

  const canEdit =
    currentUser?.role === "teacher" ||
    currentUser?.role === "super_admin" ||
    currentMembership?.role === "owner";
  const isReadOnly = Boolean(room?.isArchived) || !canEdit;
  const isDirty = initialForm ? JSON.stringify(form) !== JSON.stringify(initialForm) : false;
  const trimmedName = form.name.trim();
  const validationError = !trimmedName ? "Room name is required." : "";
  const saveDisabled = !canEdit || isReadOnly || !isDirty || Boolean(validationError) || isSaving;

  async function handleSave() {
    if (saveDisabled) {
      return;
    }

    setIsSaving(true);
    setStatus("");
    try {
      await updateSettings({
        roomId,
        name: trimmedName,
        description: form.description,
        emoji: form.emoji,
        color: form.color,
        isPublic: form.isPublic,
        allowAnonymous: form.allowAnonymous,
        aiEnabled: form.aiEnabled,
        allowStudentInvite: form.allowStudentInvite,
        isArchived: form.isArchived
      });

      const nextForm = { ...form, name: trimmedName };
      setForm(nextForm);
      setInitialForm(nextForm);
      setStatus("Room settings saved.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Unable to save room settings.");
    } finally {
      setIsSaving(false);
    }
  }

  if (room === undefined || members === undefined) {
    return (
      <div className="app-scroll">
        <div className="page-wrap page-stack">
          <div className="h-72 animate-pulse rounded-[28px] bg-white/5" />
        </div>
      </div>
    );
  }

  if (!room) {
    return <div className="flex flex-1 items-center justify-center text-[var(--app-text-muted)]">Room not found.</div>;
  }

  return (
    <div className="app-scroll">
      <div className="page-wrap page-stack">
        <section className="glass-panel rounded-[28px] p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl">
              <Link href={`/rooms/${roomId}`} className="inline-flex items-center gap-2 text-sm text-[var(--app-text-muted)] transition hover:text-white">
                <ArrowLeft size={14} />
                Back to room
              </Link>
              <p className="mt-5 section-eyebrow">Room governance</p>
              <h1 className="mt-2 text-3xl font-bold text-white">Room settings</h1>
              <p className="mt-3 text-sm leading-7 text-[var(--app-text-soft)]">
                Review room identity, adjust posting policy, and keep discovery, invites, and AI behavior aligned with how the class should operate.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <div className="rounded-2xl border border-[var(--app-line)] bg-white/[0.03] px-4 py-3 text-sm text-[var(--app-text-soft)]">
                {room.isArchived ? "Archived room" : canEdit ? (isDirty ? "Unsaved changes" : "All changes saved") : "Read-only access"}
              </div>
              <button
                type="button"
                onClick={() => void handleSave()}
                disabled={saveDisabled}
                className="app-button app-button-primary disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Save size={14} />
                {isSaving ? "Saving..." : "Save settings"}
              </button>
            </div>
          </div>

          {!canEdit ? (
            <div className="mt-6 rounded-2xl border border-amber-400/25 bg-amber-500/10 p-4 text-sm text-[var(--app-text)]">
              <div className="flex items-start gap-3">
                <Lock size={16} className="mt-0.5 shrink-0" />
                <div>
                  <p className="font-semibold">This room is viewable, but policy edits are restricted.</p>
                  <p className="mt-1 text-[var(--app-text-soft)]">
                    The current backend contract allows room owners, teachers, and super admins to save changes. Members can still inspect the room configuration here.
                  </p>
                </div>
              </div>
            </div>
          ) : null}

          {room.isArchived ? (
            <div className="mt-6 rounded-2xl border border-red-400/25 bg-red-500/10 p-4 text-sm text-[var(--app-text)]">
              Archived rooms are read-only. Unarchive the room from an administrative workflow before changing policy.
            </div>
          ) : null}

          <div className="mt-6 grid gap-6 xl:grid-cols-2">
            <section className="rounded-[24px] border border-[var(--app-line)] bg-white/5 p-5">
              <h2 className="text-lg font-semibold text-white">Metadata</h2>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <Field label="Room name" error={validationError}>
                  <input
                    value={form.name}
                    onChange={(event) => {
                      setForm((current) => ({ ...current, name: event.target.value }));
                      setStatus("");
                    }}
                    disabled={isReadOnly}
                    className={cn("app-input", isReadOnly && "cursor-not-allowed opacity-70")}
                  />
                </Field>
                <Field label="Subject">
                  <input value={room.subject} disabled className="app-input opacity-70" />
                </Field>
              </div>

              <Field label="Description" className="mt-4">
                <textarea
                  value={form.description}
                  onChange={(event) => {
                    setForm((current) => ({ ...current, description: event.target.value }));
                    setStatus("");
                  }}
                  disabled={isReadOnly}
                  className={cn("app-textarea min-h-[8rem]", isReadOnly && "cursor-not-allowed opacity-70")}
                />
              </Field>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <Field label="Accent color">
                  <div className="flex flex-wrap gap-2">
                    {ROOM_COLORS.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => {
                          if (isReadOnly) {
                            return;
                          }
                          setForm((current) => ({ ...current, color }));
                          setStatus("");
                        }}
                        disabled={isReadOnly}
                        className={cn(
                          "rounded-xl border px-3 py-2 text-sm capitalize transition",
                          form.color === color
                            ? "border-[rgba(109,140,255,0.32)] bg-[rgba(77,117,255,0.14)] text-[var(--app-text)]"
                            : "border-[var(--app-line)] bg-white/5 text-[var(--app-text-soft)] hover:bg-white/10",
                          isReadOnly && "cursor-not-allowed opacity-60 hover:bg-white/5"
                        )}
                      >
                        {color}
                      </button>
                    ))}
                  </div>
                </Field>

                <Field label="Room icon">
                  <div className="grid grid-cols-5 gap-2">
                    {ROOM_ICON_OPTIONS.map((option) => {
                      const Icon = option.icon;
                      return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => {
                          if (isReadOnly) {
                            return;
                          }
                          setForm((current) => ({ ...current, emoji: option.value }));
                          setStatus("");
                        }}
                        disabled={isReadOnly}
                        className={cn(
                          "rounded-xl border px-3 py-2 transition",
                          form.emoji === option.value ? "border-[rgba(109,140,255,0.32)] bg-[rgba(77,117,255,0.14)] text-[var(--app-text)]" : "border-[var(--app-line)] bg-white/5 text-[var(--app-text-soft)] hover:bg-white/10",
                          isReadOnly && "cursor-not-allowed opacity-60 hover:bg-white/5"
                        )}
                        title={option.label}
                      >
                        <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-2xl">
                          <Icon size={18} />
                        </div>
                      </button>
                      );
                    })}
                  </div>
                </Field>
              </div>
            </section>

            <section className="rounded-[24px] border border-[var(--app-line)] bg-white/5 p-5">
              <h2 className="text-lg font-semibold text-white">Policy controls</h2>
              <p className="mt-1 text-sm leading-6 text-[var(--app-text-muted)]">
                These controls affect composer behavior, invite paths, room discovery, and AI visibility immediately after a successful save.
              </p>
              <div className="mt-5 grid gap-3">
                <Toggle label="Public room" help="Public rooms remain visible in discovery. Private rooms rely on a join code." checked={form.isPublic} disabled={isReadOnly} onChange={(checked) => { setForm((current) => ({ ...current, isPublic: checked })); setStatus(""); }} />
                <Toggle label="Allow anonymous posting" help="When off, the composer should force visible identity for posts and comments." checked={form.allowAnonymous} disabled={isReadOnly} onChange={(checked) => { setForm((current) => ({ ...current, allowAnonymous: checked })); setStatus(""); }} />
                <Toggle label="Allow student invites" help="Enable room members to bring in more classmates without owner intervention." checked={form.allowStudentInvite} disabled={isReadOnly} onChange={(checked) => { setForm((current) => ({ ...current, allowStudentInvite: checked })); setStatus(""); }} />
                <Toggle label="Enable AI helper" help="Expose room-scoped AI experiences only when this policy is on." checked={form.aiEnabled} disabled={isReadOnly} onChange={(checked) => { setForm((current) => ({ ...current, aiEnabled: checked })); setStatus(""); }} />
                <Toggle label="Archive room" help="Archived rooms stop new participation and become operationally frozen after save." checked={form.isArchived} disabled={isReadOnly} onChange={(checked) => { setForm((current) => ({ ...current, isArchived: checked })); setStatus(""); }} />
              </div>

              <div className="mt-5 rounded-[24px] border border-[var(--app-line)] bg-white/[0.03] p-5">
                <p className="text-xs uppercase tracking-[0.2em] text-[var(--app-text-muted)]">Membership</p>
                <div className="mt-3 space-y-2">
                  {members.map((member) => (
                    <div key={member._id} className="flex items-center justify-between gap-3 rounded-xl bg-white/[0.03] px-3 py-2 text-sm">
                      <span className="truncate text-white">{member.user.name}</span>
                      <span className="text-xs uppercase tracking-[0.18em] text-[var(--app-text-muted)]">{member.role}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <InfoCard label="Join code" value={room.joinCode ?? "Public"} />
                <InfoCard label="Batch" value={room.batch} />
                <InfoCard label="Members" value={String(room.memberCount)} />
              </div>
            </section>
          </div>

          {status ? <p className="mt-4 text-sm text-[var(--app-text-soft)]">{status}</p> : null}
        </section>
      </div>
    </div>
  );
}

function Field({ label, children, error, className }: { label: string; children: React.ReactNode; error?: string; className?: string }) {
  return (
    <label className={cn("grid gap-2", className)}>
      <span className="text-sm font-semibold text-[var(--app-text-soft)]">{label}</span>
      {children}
      {error ? <span className="text-xs text-[var(--app-danger)]">{error}</span> : null}
    </label>
  );
}

function Toggle({ label, help, checked, disabled, onChange }: { label: string; help: string; checked: boolean; disabled: boolean; onChange: (checked: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      disabled={disabled}
      className="flex min-h-11 items-center justify-between gap-4 rounded-2xl border border-[var(--app-line)] bg-white/[0.03] px-4 py-3 text-left transition hover:bg-white/[0.05] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(109,140,255,0.45)] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-white/[0.03]"
    >
      <div>
        <span className="text-sm font-medium text-white">{label}</span>
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

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[20px] border border-[var(--app-line)] bg-white/5 p-4">
      <p className="text-xs uppercase tracking-[0.2em] text-[var(--app-text-muted)]">{label}</p>
      <p className="mt-2 text-sm font-semibold text-white">{value}</p>
    </div>
  );
}
