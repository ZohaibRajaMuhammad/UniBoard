"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { BATCHES, ROOM_COLORS, ROOM_EMOJIS } from "@/lib/constants";

export function CreateRoomModal({ onClose }: { onClose: () => void }) {
  const createRoom = useMutation(api.rooms.create);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState<{
    name: string;
    subject: string;
    batch: string;
    description: string;
    isPublic: boolean;
    color: string;
    emoji: string;
  }>({
    name: "",
    subject: "",
    batch: BATCHES[0],
    description: "",
    isPublic: true,
    color: ROOM_COLORS[0],
    emoji: ROOM_EMOJIS[0]
  });

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
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog.Root open onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[calc(100vw-2rem)] max-w-2xl -translate-x-1/2 -translate-y-1/2 rounded-[28px] border border-white/10 bg-gray-900 p-6 shadow-2xl">
          <div className="mb-6 flex items-start justify-between">
            <div>
              <Dialog.Title className="text-2xl font-bold text-white">Create room</Dialog.Title>
              <Dialog.Description className="mt-2 text-sm text-gray-400">
                Create a structured academic space with live posts and unread tracking.
              </Dialog.Description>
            </div>
            <Dialog.Close className="rounded-xl border border-white/10 p-2 text-gray-400 transition hover:bg-white/5">
              <X size={16} />
            </Dialog.Close>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Room name">
              <input
                value={form.name}
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-brand-400"
                placeholder="Parallel Computing"
              />
            </Field>
            <Field label="Subject code">
              <input
                value={form.subject}
                onChange={(event) => setForm((current) => ({ ...current, subject: event.target.value }))}
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-brand-400"
                placeholder="CS-401"
              />
            </Field>
            <Field label="Batch">
              <select
                value={form.batch}
                onChange={(event) => setForm((current) => ({ ...current, batch: event.target.value }))}
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-brand-400"
              >
                {BATCHES.map((batch) => (
                  <option key={batch} value={batch}>{batch}</option>
                ))}
              </select>
            </Field>
            <Field label="Visibility">
              <select
                value={String(form.isPublic)}
                onChange={(event) => setForm((current) => ({ ...current, isPublic: event.target.value === "true" }))}
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-brand-400"
              >
                <option value="true">Public to batch</option>
                <option value="false">Private</option>
              </select>
            </Field>
          </div>

          <Field label="Description" className="mt-4">
            <textarea
              value={form.description}
              onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
              className="min-h-[110px] w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-brand-400"
              placeholder="What kind of updates belong in this room?"
            />
          </Field>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field label="Accent color">
              <div className="flex flex-wrap gap-2">
                {ROOM_COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => setForm((current) => ({ ...current, color }))}
                    className={`rounded-xl border px-3 py-2 text-sm ${form.color === color ? "border-brand-400 bg-brand-500/20 text-white" : "border-white/10 bg-white/5 text-gray-400"}`}
                  >
                    {color}
                  </button>
                ))}
              </div>
            </Field>
            <Field label="Emoji">
              <div className="flex flex-wrap gap-2">
                {ROOM_EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => setForm((current) => ({ ...current, emoji }))}
                    className={`rounded-xl border px-3 py-2 text-lg ${form.emoji === emoji ? "border-brand-400 bg-brand-500/20" : "border-white/10 bg-white/5"}`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </Field>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button onClick={onClose} className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-medium text-white transition hover:bg-white/10">
              Cancel
            </button>
            <button
              onClick={() => void handleSubmit()}
              disabled={isSubmitting}
              className="rounded-2xl bg-brand-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
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
  children,
  className
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={className}>
      <span className="mb-2 block text-sm font-medium text-gray-300">{label}</span>
      {children}
    </label>
  );
}
