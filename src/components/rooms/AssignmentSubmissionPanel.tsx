"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { CheckSquare2, FileUp, Inbox, Link2, Send, X } from "lucide-react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { useNotifier } from "@/components/providers/NotificationProvider";
import { Skeleton } from "@/components/ui/Skeleton";
import { cn, formatRelativeTime } from "@/lib/utils";

type AssignmentOption = {
  postId: string;
  title: string;
  dueDate: number | null;
  contentPreview: string;
  roomId: string;
};

type AssignmentSubmission = {
  _id: string;
  assignmentPostId?: string;
  title: string;
  content: string;
  attachmentUrl?: string;
  attachmentName?: string;
  attachmentType?: string;
  attachmentSize?: number;
  status: "submitted" | "reviewed" | "returned";
  createdAt: number;
  submittedBy: { userId: string; name: string; role: string } | null;
  reviewer: { userId: string; name: string; role: string } | null;
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
  const submissions = useQuery(api.assignments.getForRoom, { roomId }) as AssignmentSubmission[] | undefined;
  const submitAssignment = useMutation(api.assignments.submit);
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState<SubmissionFormState>(defaultFormState);

  const visibleSubmissions = useMemo(() => submissions ?? [], [submissions]);
  const assignmentOptions = useMemo(() => assignments ?? [], [assignments]);
  const selectedAssignment = useMemo(
    () => assignmentOptions.find((assignment) => assignment.postId === form.assignmentPostId) ?? assignmentOptions[0] ?? null,
    [assignmentOptions, form.assignmentPostId]
  );

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
    if (assignmentOptions.length === 0) {
      setStatus("No deadline-style assignments are available in this room yet.");
      return;
    }

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
      setStatus("Attachment must be 256 KB or smaller in this demo submission flow.");
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
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.24em] text-[var(--app-text-muted)]">Assignments</p>
          <h3 className="mt-2 text-lg font-semibold text-white">{canReview ? "Creator inbox" : "Submit assignment"}</h3>
        </div>
        <Inbox size={16} className="mt-1 text-[var(--app-primary-strong)]" />
      </div>

      <p className="mt-3 text-sm leading-7 text-[var(--app-text-soft)]">
        {canReview
          ? "Room creators and moderators can review submissions tied to a specific deadline-style assignment."
          : "Choose an assignment from this room, attach your file or note, and send it directly to the room creator."}
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button type="button" onClick={openDialog} className="app-button app-button-primary min-h-[44px] whitespace-nowrap">
          <Send size={14} />
          Open submission form
        </button>
        {assignmentOptions.length > 0 ? (
          <p className="text-xs text-[var(--app-text-muted)]">
            {assignmentOptions.length} assignment{assignmentOptions.length === 1 ? "" : "s"} available in this room.
          </p>
        ) : (
          <p className="text-xs text-[var(--app-text-muted)]">Add a deadline-style post in this room to unlock assignment submissions.</p>
        )}
      </div>

      {selectedAssignment ? (
        <div className="mt-3 rounded-[22px] border border-[var(--app-line)] bg-white/5 p-4 text-sm leading-7 text-[var(--app-text-soft)]">
          <p className="font-medium text-white">{selectedAssignment.title}</p>
          {selectedAssignment.dueDate ? <p className="mt-1 text-xs text-[var(--app-text-muted)]">Due {new Date(selectedAssignment.dueDate).toLocaleString()}</p> : null}
          <p className="mt-2 line-clamp-2">{selectedAssignment.contentPreview}</p>
        </div>
      ) : (
        <div className="mt-3 rounded-[22px] border border-dashed border-[var(--app-line)] bg-white/5 p-4 text-sm text-[var(--app-text-muted)]">
          Add a deadline-style post in this room to unlock assignment submissions.
        </div>
      )}

      {status ? <div className="mt-4 rounded-[20px] border border-[var(--app-line)] bg-white/5 px-4 py-3 text-sm text-[var(--app-text-soft)]">{status}</div> : null}

      <div className="mt-5">
        <div className="flex items-center gap-2">
          <CheckSquare2 size={15} className="text-[var(--app-primary-strong)]" />
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--app-text-muted)]">{canReview ? "Recent submissions" : "Your submissions"}</p>
        </div>

        <div className="mt-3 space-y-3">
          {submissions === undefined ? (
            Array.from({ length: 3 }).map((_, index) => <Skeleton key={index} className="h-24 rounded-[22px]" />)
          ) : visibleSubmissions.length === 0 ? (
            <div className="rounded-[22px] border border-dashed border-[var(--app-line)] bg-white/5 p-4 text-sm text-[var(--app-text-muted)]">
              {canReview ? "No assignment submissions have arrived yet." : "You have not submitted an assignment in this room yet."}
            </div>
          ) : (
            visibleSubmissions.slice(0, 5).map((submission) => (
              <article key={submission._id} className="rounded-[22px] border border-[var(--app-line)] bg-white/[0.03] p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-white">{submission.title}</p>
                    <p className="mt-1 text-xs text-[var(--app-text-muted)]">
                      {submission.submittedBy?.name ?? "Unknown"} - {formatRelativeTime(submission.createdAt)}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em]",
                      submission.status === "submitted"
                        ? "bg-emerald-500/15 text-emerald-200"
                        : submission.status === "reviewed"
                          ? "bg-brand-500/15 text-[var(--app-primary-strong)]"
                          : "bg-amber-500/15 text-amber-200"
                    )}
                  >
                    {submission.status}
                  </span>
                </div>

                <p className="mt-3 text-sm leading-7 text-[var(--app-text-soft)]">{submission.content}</p>
                {submission.attachmentUrl ? (
                  <a
                    href={submission.attachmentUrl}
                    target="_blank"
                    rel="noreferrer"
                    download={submission.attachmentName}
                    className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-[var(--app-primary-strong)] transition hover:text-white"
                  >
                    <Link2 size={13} />
                    {submission.attachmentName ? `Open ${submission.attachmentName}` : "Open attachment"}
                  </a>
                ) : null}
              </article>
            ))
          )}
        </div>
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
