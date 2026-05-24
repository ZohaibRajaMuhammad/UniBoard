"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { Sparkles, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useNotifier } from "@/components/providers/NotificationProvider";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { BATCHES, ROOM_COLORS } from "@/lib/constants";
import { ROOM_ICON_OPTIONS } from "@/lib/ui-icons";

type CreateRoomForm = {
  name: string;
  subject: string;
  batch: string;
  description: string;
  isPublic: boolean;
  color: string;
  emoji: string;
};

export function CreateRoomModal({ onClose }: { onClose: () => void }) {
  const { notify } = useNotifier();
  const currentUser = useCurrentUser();
  const createRoom = useMutation(api.rooms.create);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState<CreateRoomForm>({
    name: "",
    subject: "",
    batch: BATCHES[0],
    description: "",
    isPublic: true,
    color: ROOM_COLORS[0],
    emoji: ROOM_ICON_OPTIONS[0].value
  });

  useEffect(() => {
    if (currentUser?.role === "student") {
      setForm((current) => ({ ...current, isPublic: false }));
    }
  }, [currentUser?.role]);

  async function handleSubmit() {
    if (!form.name.trim() || !form.subject.trim()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await createRoom({
        name: form.name,
        subject: form.subject,
        batch: form.batch,
        description: form.description || undefined,
        isPublic: form.isPublic,
        color: form.color,
        emoji: form.emoji
      });
      notify({
        title: "Room created",
        message: `${form.name} is ready for collaboration.`,
        tone: "success",
        tag: "room-created"
      });
      onClose();
    } catch (error) {
      notify({
        title: "Room creation failed",
        message: error instanceof Error ? error.message : "Unable to create the room.",
        tone: "error",
        priority: "high",
        tag: "room-created-error"
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog.Root open onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-[rgba(7,17,26,0.44)] backdrop-blur-sm" />
        <Dialog.Content className="glass-panel fixed inset-x-4 top-1/2 z-50 max-h-[calc(100dvh-2rem)] w-auto -translate-y-1/2 overflow-hidden rounded-[1.75rem] shadow-2xl sm:left-1/2 sm:w-[min(42rem,calc(100vw-2rem))] sm:-translate-x-1/2">
          <div className="flex items-start justify-between border-b border-[var(--app-line)] px-5 py-4 sm:px-6">
            <div className="pr-4">
              <Dialog.Title className="text-xl font-bold text-white sm:text-2xl">Create room</Dialog.Title>
              <Dialog.Description className="mt-2 text-sm leading-6 text-[var(--app-text-muted)]">
                Define a clean academic space with the right subject identity, visibility, and tone from the start.
              </Dialog.Description>
            </div>
            <Dialog.Close className="touch-target rounded-2xl border border-[var(--app-line)] bg-white/5 p-2 text-[var(--app-text-muted)] transition hover:bg-white/10">
              <X size={16} />
            </Dialog.Close>
          </div>

          <div className="max-h-[calc(100dvh-10rem)] overflow-y-auto px-5 py-5 sm:px-6">
            <div className="page-stack">
              <div className="rounded-[1.25rem] border border-[rgba(109,140,255,0.24)] bg-[rgba(77,117,255,0.08)] p-4 text-sm leading-6 text-[var(--app-text-soft)]">
                <div className="mb-2 flex items-center gap-2 font-semibold">
                  <Sparkles size={15} />
                  Room quality checklist
                </div>
                {currentUser?.role === "student"
                  ? "Student-created rooms are kept private by policy. Use them for study groups, project coordination, and focused collaboration rather than official course broadcasting."
                  : "Keep the title short, the subject code precise, and the description specific enough that students know exactly what belongs here."}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Room name">
                  <input
                    value={form.name}
                    onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                    className="app-input"
                    placeholder="Parallel Computing"
                  />
                </Field>
                <Field label="Subject code">
                  <input
                    value={form.subject}
                    onChange={(event) => setForm((current) => ({ ...current, subject: event.target.value }))}
                    className="app-input"
                    placeholder="CS-401"
                  />
                </Field>
                <Field label="Batch">
                  <select
                    value={form.batch}
                    onChange={(event) => setForm((current) => ({ ...current, batch: event.target.value }))}
                    className="app-select"
                  >
                    {BATCHES.map((batch) => (
                      <option key={batch} value={batch}>
                        {batch}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Visibility">
                  <select
                    value={String(form.isPublic)}
                    onChange={(event) => setForm((current) => ({ ...current, isPublic: event.target.value === "true" }))}
                    className="app-select"
                    disabled={currentUser?.role === "student"}
                  >
                    <option value="true">Public to batch</option>
                    <option value="false">Private</option>
                  </select>
                </Field>
              </div>

              <Field label="Description">
                <textarea
                  value={form.description}
                  onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                  className="app-textarea min-h-[8rem]"
                  placeholder="What belongs in this room, what matters most, and how students should use it."
                />
              </Field>

              <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
                <Field label="Accent color">
                  <div className="flex flex-wrap gap-2">
                    {ROOM_COLORS.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setForm((current) => ({ ...current, color }))}
                        className={`touch-target rounded-xl border px-3 py-2 text-sm capitalize transition ${form.color === color ? "border-brand-400 bg-brand-500/20 text-[var(--app-text)]" : "border-[var(--app-line)] bg-white/5 text-[var(--app-text-soft)] hover:bg-white/10"}`}
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
                        onClick={() => setForm((current) => ({ ...current, emoji: option.value }))}
                        className={`touch-target rounded-xl border transition ${form.emoji === option.value ? "border-brand-400 bg-brand-500/20 text-[var(--app-text)]" : "border-[var(--app-line)] bg-white/5 text-[var(--app-text-soft)] hover:bg-white/10"}`}
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
            </div>
          </div>

          <div className="flex flex-col-reverse gap-3 border-t border-[var(--app-line)] px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
            <button onClick={onClose} className="app-button app-button-secondary w-full sm:w-auto">
              Cancel
            </button>
            <button onClick={() => void handleSubmit()} disabled={isSubmitting} className="app-button app-button-primary w-full disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto">
              {isSubmitting ? "Creating..." : "Create room"}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function Field({
  label,
  children
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-semibold text-[var(--app-text-soft)]">{label}</span>
      {children}
    </label>
  );
}
