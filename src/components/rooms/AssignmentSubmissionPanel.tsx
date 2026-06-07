"use client";

import { FormEvent, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { CheckSquare2, FileUp, Inbox, Link2, Send } from "lucide-react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { useNotifier } from "@/components/providers/NotificationProvider";
import { Skeleton } from "@/components/ui/Skeleton";
import { cn, formatRelativeTime } from "@/lib/utils";

type AssignmentSubmission = {
  _id: string;
  title: string;
  content: string;
  attachmentUrl?: string;
  status: "submitted" | "reviewed" | "returned";
  createdAt: number;
  submittedBy: { userId: string; name: string; role: string } | null;
  reviewer: { userId: string; name: string; role: string } | null;
};

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
  const submissions = useQuery(api.assignments.getForRoom, { roomId }) as AssignmentSubmission[] | undefined;
  const submitAssignment = useMutation(api.assignments.submit);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [attachmentUrl, setAttachmentUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState("");

  const visibleSubmissions = submissions ?? [];

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!title.trim() || !content.trim() || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setStatus("");

    try {
      await submitAssignment({
        roomId,
        title,
        content,
        attachmentUrl: attachmentUrl.trim() || undefined
      });

      setTitle("");
      setContent("");
      setAttachmentUrl("");
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
        Submissions are sent to the room creator. Room admins can review every submission; students only see their own history.
      </p>

      <form onSubmit={handleSubmit} className="mt-4 grid gap-3">
        <div className="grid gap-3 md:grid-cols-2">
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Assignment title"
            className="app-input"
          />
          <input
            value={attachmentUrl}
            onChange={(event) => setAttachmentUrl(event.target.value)}
            placeholder="Attachment URL or cloud link"
            className="app-input"
          />
        </div>
        <textarea
          value={content}
          onChange={(event) => setContent(event.target.value)}
          rows={4}
          placeholder="Write the submission note, summary, or answer"
          className="app-textarea min-h-[9rem]"
        />

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-[var(--app-text-muted)]">
            {canReview ? "This form can be used to add test submissions for review." : "Press submit to send the assignment directly to the room admin."}
          </p>
          <button type="submit" disabled={isSubmitting || !title.trim() || !content.trim()} className="app-button app-button-primary disabled:cursor-not-allowed disabled:opacity-60">
            <Send size={14} />
            {isSubmitting ? "Submitting..." : "Submit assignment"}
          </button>
        </div>
      </form>

      {status ? (
        <div className="mt-4 rounded-[20px] border border-[var(--app-line)] bg-white/5 px-4 py-3 text-sm text-[var(--app-text-soft)]">
          {status}
        </div>
      ) : null}

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
                      {submission.submittedBy?.name ?? "Unknown"} · {formatRelativeTime(submission.createdAt)}
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
                    className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-[var(--app-primary-strong)] transition hover:text-white"
                  >
                    <Link2 size={13} />
                    Open attachment
                  </a>
                ) : null}
              </article>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
