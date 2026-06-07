"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { FileUp, Inbox, Send, X } from "lucide-react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { useNotifier } from "@/components/providers/NotificationProvider";

type AssignmentOption = {
  postId: string;
  title: string;
  dueDate: number | null;
  contentPreview: string;
  roomId: string;
};

type SubmissionFormState = {
  assignmentPostId: string;
  content: string;
  attachmentUrl: string;
  attachmentName: string;
  attachmentType: string;
  attachmentSize?: number;
};

const defaultFormState: SubmissionFormState = {
  assignmentPostId: "",
  content: "",
  attachmentUrl: "",
  attachmentName: "",
  attachmentType: "",
  attachmentSize: undefined
};

const attachmentSizeLimit = 5 * 1024 * 1024;

export function AssignmentSubmissionPanel({
  roomId,
  roomName,
  canReview
}: {
  roomId: Id<"rooms">;
  roomName: string;
  canReview: boolean;
}) {
  const { notify } = useNotifier();
  const assignments = useQuery(api.assignments.getRoomAssignments, { roomId }) as AssignmentOption[] | undefined;
  const submitAssignment = useMutation(api.assignments.submit);
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState<SubmissionFormState>(defaultFormState);

  const assignmentOptions = assignments ?? [];

  useEffect(() => {
    if (form.assignmentPostId || assignmentOptions.length === 0) {
      return;
    }

    setForm((current) => ({
      ...current,
      assignmentPostId: assignmentOptions[0].postId
    }));
  }, [assignmentOptions, form.assignmentPostId]);

  function resetForm() {
    setForm(defaultFormState);
    setStatus("");
  }

  function openDialog() {
    setOpen(true);
  }

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      setForm((current) => ({
        ...current,
        attachmentUrl: "",
        attachmentName: "",
        attachmentType: "",
        attachmentSize: undefined
      }));
      return;
    }

    if (file.size > attachmentSizeLimit) {
      event.target.value = "";
      setStatus("Attachment must be 5 MB or smaller in this demo submission flow.");
      return;
    }

    const attachmentUrl = await readFileAsDataUrl(file);
    setForm((current) => ({
      ...current,
      attachmentUrl,
      attachmentName: file.name,
      attachmentType: file.type || "application/octet-stream",
      attachmentSize: file.size
    }));
    setStatus("");
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!form.assignmentPostId.trim() || !form.content.trim() || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setStatus("");

    try {
      await submitAssignment({
        roomId,
        assignmentPostId: form.assignmentPostId as Id<"posts">,
        content: form.content,
        attachmentUrl: form.attachmentUrl.trim() || undefined,
        attachmentName: form.attachmentName.trim() || undefined,
        attachmentType: form.attachmentType.trim() || undefined,
        attachmentSize: form.attachmentSize
      });

      resetForm();
      setOpen(false);
      setStatus("Assignment submitted to the room admin.");
      notify({
        title: "Assignment submitted",
        message: `Your submission was sent to the creator of ${roomName}.`,
        tone: "success",
        tag: "assignment-submitted"
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to submit assignment.";
      setStatus(message);
      notify({
        title: "Assignment submission failed",
        message,
        tone: "error",
        priority: "high",
        tag: "assignment-submission-error"
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="glass-panel rounded-[28px] p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[11px] uppercase tracking-[0.24em] text-[var(--app-text-muted)]">Assignments</p>
        <Inbox size={16} className="text-[var(--app-primary-strong)]" />
      </div>

      <div className="mt-4 grid gap-2">
        <button type="button" onClick={openDialog} className="app-button app-button-primary min-h-[44px] w-full justify-center">
          <Send size={14} />
          {canReview ? "Open assignment inbox" : "Open assignment form"}
        </button>
      </div>

      <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-[rgba(7,17,26,0.44)] backdrop-blur-sm" />
          <Dialog.Content className="fixed inset-x-3 top-1/2 z-50 max-h-[calc(100dvh-1.5rem)] -translate-y-1/2 overflow-y-auto rounded-[28px] sm:left-1/2 sm:w-[min(44rem,calc(100vw-1.5rem))] sm:-translate-x-1/2">
            <div className="glass-panel overflow-hidden rounded-[28px]">
              <div className="flex items-center justify-between border-b border-[var(--app-line)] px-5 py-4">
                <div>
                  <Dialog.Title className="text-lg font-semibold text-white">Submit assignment</Dialog.Title>
                  <Dialog.Description className="mt-1 text-sm text-[var(--app-text-muted)]">
                    Choose the exact assignment, attach your file, and submit it to the room creator.
                  </Dialog.Description>
                </div>
                <Dialog.Close className="touch-target rounded-2xl border border-[var(--app-line)] bg-white/5 p-2 text-[var(--app-text-muted)] transition hover:bg-white/10">
                  <X size={16} />
                </Dialog.Close>
              </div>

              <form onSubmit={handleSubmit} className="grid gap-4 px-5 py-5">
                <div className="grid gap-2">
                  <label className="text-xs uppercase tracking-[0.18em] text-[var(--app-text-muted)]" htmlFor={`assignment-modal-select-${roomId}`}>
                    Assignment name
                  </label>
                  <select
                    id={`assignment-modal-select-${roomId}`}
                    value={form.assignmentPostId}
                    onChange={(event) => setForm((current) => ({ ...current, assignmentPostId: event.target.value }))}
                    className="app-input"
                    disabled={assignmentOptions.length === 0}
                  >
                    {assignmentOptions.length === 0 ? <option value="">No assignments available</option> : null}
                    {assignmentOptions.map((assignment) => (
                      <option key={assignment.postId} value={assignment.postId}>
                        {assignment.title}
                        {assignment.dueDate ? ` - ${new Date(assignment.dueDate).toLocaleDateString()}` : ""}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="rounded-[20px] border border-[var(--app-line)] bg-white/5 px-4 py-3 text-sm text-[var(--app-text-soft)]">
                  {assignmentOptions.length > 0
                    ? `${assignmentOptions.length} assignment${assignmentOptions.length === 1 ? "" : "s"} available in this room.`
                    : "Add a deadline-style post in this room to unlock assignment submissions."}
                </div>

                <div className="grid gap-2">
                  <label className="text-xs uppercase tracking-[0.18em] text-[var(--app-text-muted)]" htmlFor={`assignment-file-${roomId}`}>
                    Upload file
                  </label>
                  <div className="rounded-[24px] border border-[var(--app-line)] bg-white/[0.04] p-4">
                    <div className="flex items-center gap-3 text-sm text-[var(--app-text-soft)]">
                      <FileUp size={16} className="text-[var(--app-primary-strong)]" />
                      <p>Attach any file type up to 5 MB. The file is stored with the submission for review.</p>
                    </div>
                    <input
                      id={`assignment-file-${roomId}`}
                      type="file"
                      accept="*/*"
                      onChange={handleFileChange}
                      className="mt-3 w-full text-sm text-[var(--app-text-muted)] file:mr-4 file:rounded-full file:border-0 file:bg-white/10 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-white/15"
                    />
                    {form.attachmentName ? (
                      <p className="mt-3 text-xs text-[var(--app-text-muted)]">
                        Selected file: <span className="text-white">{form.attachmentName}</span>
                      </p>
                    ) : null}
                  </div>
                </div>

                <div className="grid gap-2">
                  <label className="text-xs uppercase tracking-[0.18em] text-[var(--app-text-muted)]" htmlFor={`assignment-note-${roomId}`}>
                    Submission note
                  </label>
                  <textarea
                    id={`assignment-note-${roomId}`}
                    value={form.content}
                    onChange={(event) => setForm((current) => ({ ...current, content: event.target.value }))}
                    rows={5}
                    placeholder="Write a summary, answer, or submission note..."
                    className="app-textarea min-h-[11rem]"
                  />
                </div>

                {status ? <div className="rounded-[20px] border border-[var(--app-line)] bg-white/5 px-4 py-3 text-sm text-[var(--app-text-soft)]">{status}</div> : null}

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-xs text-[var(--app-text-muted)]">The selected assignment is sent to the room creator for review.</p>
                  <div className="flex gap-3">
                    <Dialog.Close asChild>
                      <button type="button" className="app-button app-button-secondary">
                        Cancel
                      </button>
                    </Dialog.Close>
                    <button
                      type="submit"
                      disabled={isSubmitting || !form.assignmentPostId.trim() || !form.content.trim()}
                      className="app-button app-button-primary disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <Send size={14} />
                      {isSubmitting ? "Submitting..." : "Submit"}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </section>
  );
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error("Unable to read the selected file."));
    reader.readAsDataURL(file);
  });
}
