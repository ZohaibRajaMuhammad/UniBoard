"use client";

import { KeyboardEvent, useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { MessageSquare, Send, Sparkles, Trash2 } from "lucide-react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { postAi } from "@/lib/ai/client";
import type { AssistantReply } from "@/lib/ai/contracts";
import { buildAssistantPrompt, containsAiMention, formatAssistantComment } from "@/lib/ai/mentions";
import { ROOM_MENTION_AI } from "@/lib/constants";
import { useNotifier } from "@/components/providers/NotificationProvider";
import { ProfileAvatar } from "@/components/ui/ProfileAvatar";
import { cn, formatRelativeTime } from "@/lib/utils";

type Comment = {
  _id: Id<"comments">;
  postId: Id<"posts">;
  roomId: Id<"rooms">;
  parentCommentId?: Id<"comments">;
  content: string;
  isAnonymous: boolean;
  isDeleted: boolean;
  createdAt: number;
  authorId?: Id<"users">;
  author: {
    name: string;
    imageUrl: string | null;
    role: string;
  };
};

export function CommentThread({ postId, roomId }: { postId: Id<"posts">; roomId: Id<"rooms"> }) {
  const { notify } = useNotifier();
  const comments = useQuery(api.comments.getByPost, { postId }) as Comment[] | undefined;
  const post = useQuery(api.posts.getById, { postId });
  const currentUser = useQuery(api.users.getCurrentUser);
  const members = useQuery(api.rooms.getMembers, { roomId });
  const createComment = useMutation(api.comments.create);
  const createAiReply = useMutation(api.comments.createAiReply);
  const deleteComment = useMutation(api.comments.deleteComment);
  const [content, setContent] = useState("");
  const [replyTo, setReplyTo] = useState<Id<"comments"> | undefined>(undefined);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const topLevelComments = (comments ?? []).filter((comment) => !comment.parentCommentId);
  const repliesByParent = new Map<string, Comment[]>();
  for (const comment of comments ?? []) {
    if (!comment.parentCommentId) {
      continue;
    }
    const key = String(comment.parentCommentId);
    const existing = repliesByParent.get(key) ?? [];
    existing.push(comment);
    repliesByParent.set(key, existing);
  }

  const mentionableNames = useMemo(() => {
    const names = (members ?? [])
      .map((member) => member.user.name)
      .filter((name, index, array) => array.indexOf(name) === index)
      .slice(0, 6);

    return [ROOM_MENTION_AI, ...names.map((name) => `@${name.replace(/\s+/g, "")}`)];
  }, [members]);

  function insertMention(mention: string) {
    setContent((current) => `${current.trimEnd()}${current.trim() ? " " : ""}${mention} `);
  }

  async function handleSubmit() {
    if (!content.trim() || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError("");
    try {
      const createdCommentId = await createComment({
        postId,
        content: content.trim(),
        isAnonymous,
        parentCommentId: replyTo
      });

      if (containsAiMention(content)) {
        const parentComment = replyTo ? (comments ?? []).find((comment) => comment._id === replyTo) : null;
        const mentionFailureComment = formatAssistantComment(
          "I could not answer that mention reliably right now. Try again with one direct question and a clearer room-specific concept, artifact, or deadline.",
          ["Ask with a single @UniBoardAI mention and name the exact topic you want explained."]
        );
        void postAi<AssistantReply>("/api/v1/ai/assistant", {
          message: buildAssistantPrompt(content, {
            postTitle: post?.deadlineTitle ?? post?.resourceTitle ?? null,
            postType: post?.type ?? null,
            postContent: post?.content ?? null,
            parentCommentContent: parentComment?.content ?? null
          }),
          roomId
        })
          .then((payload) =>
            createAiReply({
              postId,
              parentCommentId: replyTo ?? createdCommentId,
              content: formatAssistantComment(payload.data?.reply ?? "I could not ground a reliable answer for that mention.", payload.data?.suggestions)
            })
          )
          .then(() => {
            notify({
              title: "AI replied",
              message: "UniBoard AI added a follow-up comment.",
              tone: "ai",
              tag: "comment-ai-reply"
            });
          })
          .catch(() =>
            createAiReply({
              postId,
              parentCommentId: replyTo ?? createdCommentId,
              content: mentionFailureComment
            })
              .then(() => {
                notify({
                  title: "AI mention needs refinement",
                  message: "UniBoard AI could not fully answer, so it left a fallback reply instead of failing silently.",
                  tone: "warning",
                  tag: "comment-ai-reply-fallback"
                });
              })
              .catch(() => {
                notify({
                  title: "AI mention failed",
                  message: "UniBoard AI did not reply to that mention. Try one direct @UniBoardAI question with the exact concept or room topic.",
                  tone: "error",
                  priority: "high",
                  tag: "comment-ai-reply-error"
                });
              })
          );
      }

      setContent("");
      setReplyTo(undefined);
      setIsAnonymous(false);
      notify({
        title: "Comment posted",
        message: "Your discussion update is now live.",
        tone: "success",
        desktop: false,
        tag: "comment-posted"
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to comment.";
      setSubmitError(message);
      notify({
        title: "Comment failed",
        message,
        tone: "error",
        priority: "high",
        tag: "comment-posted-error"
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void handleSubmit();
    }
  }

  return (
    <div className="rounded-[28px] border border-[var(--app-line)] bg-white/[0.03] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
      <div className="mb-4 flex items-center gap-2 text-sm font-medium text-white">
        <MessageSquare size={15} />
        Discussion
      </div>

      <div className="space-y-3">
        {topLevelComments.length === 0 ? (
          <p className="text-sm text-[var(--app-text-muted)]">No comments yet.</p>
        ) : (
          topLevelComments.map((comment) => (
            <div key={comment._id} className="space-y-2">
              <CommentCard
                comment={comment}
                canDelete={Boolean(
                  currentUser &&
                    (!comment.isAnonymous && comment.authorId === currentUser._id ||
                      currentUser.role === "teacher" ||
                      currentUser.role === "super_admin")
                )}
                onDelete={() => void deleteComment({ commentId: comment._id })}
                onReply={() => setReplyTo(comment._id)}
              />
              {(repliesByParent.get(String(comment._id)) ?? []).map((reply) => (
                <div key={reply._id} className="ml-4 sm:ml-8">
                  <CommentCard
                    comment={reply}
                    compact
                    canDelete={Boolean(
                      currentUser &&
                        (!reply.isAnonymous && reply.authorId === currentUser._id ||
                          currentUser.role === "teacher" ||
                          currentUser.role === "super_admin")
                    )}
                    onDelete={() => void deleteComment({ commentId: reply._id })}
                  />
                </div>
              ))}
            </div>
          ))
        )}
      </div>

      <div className="mt-4 rounded-[24px] border border-[var(--app-line)] bg-white/[0.04] p-4">
        {replyTo ? <p className="mb-2 text-xs text-brand-200">Replying to a comment</p> : null}

        <div className="mb-3 flex flex-wrap gap-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-[var(--app-text-soft)]">
            <Sparkles size={12} />
            Quick mentions
          </div>
          {mentionableNames.map((mention) => (
            <button
              key={mention}
              type="button"
              onClick={() => insertMention(mention)}
            className="app-action-button min-h-[2rem] rounded-full px-3 py-1 text-xs"
            >
              {mention}
            </button>
          ))}
        </div>

        <textarea
          value={content}
          onChange={(event) => setContent(event.target.value)}
          onKeyDown={onKeyDown}
          rows={3}
          maxLength={500}
          placeholder="Add a comment"
          className="w-full resize-none rounded-xl bg-transparent text-sm text-[var(--app-text)] outline-none placeholder:text-[var(--app-text-muted)]"
        />

        {submitError ? <p className="mt-2 text-sm text-[var(--app-danger)]">{submitError}</p> : null}

        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <button
            onClick={() => setIsAnonymous((current) => !current)}
            className={cn("app-action-button min-h-[2rem] rounded-full px-3 py-1 text-xs", isAnonymous ? "app-action-button-active" : "")}
          >
            {isAnonymous ? "Anonymous" : "Visible"}
          </button>
          <div className="flex flex-wrap items-center gap-2">
            {replyTo ? (
              <button onClick={() => setReplyTo(undefined)} className="text-xs text-[var(--app-text-muted)] transition hover:text-white">
                Cancel reply
              </button>
            ) : null}
            <button
              onClick={() => void handleSubmit()}
              disabled={!content.trim() || isSubmitting}
              className="app-button app-button-primary min-h-[2.4rem] rounded-2xl px-3 py-2 text-xs disabled:opacity-60"
            >
              <Send size={12} />
              {isSubmitting ? "Posting..." : "Comment"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function CommentCard({
  comment,
  compact = false,
  canDelete,
  onDelete,
  onReply
}: {
  comment: Comment;
  compact?: boolean;
  canDelete?: boolean;
  onDelete?: () => void;
  onReply?: () => void;
}) {
  return (
    <div className="rounded-[22px] border border-[var(--app-line)] bg-white/[0.03] p-4">
      <div className="flex items-start gap-3">
        <ProfileAvatar name={comment.author.name} imageUrl={comment.author.imageUrl} size="sm" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold text-white">{comment.author.name}</p>
            <span className="text-xs text-[var(--app-text-muted)]">{formatRelativeTime(comment.createdAt)}</span>
          </div>
          <p className={cn("mt-1 whitespace-pre-wrap break-words text-sm leading-6 text-[var(--app-text-soft)]", compact && "text-[13px]")}>{comment.content}</p>
          <div className="mt-2 flex items-center gap-3">
            {!compact && onReply ? (
              <button onClick={onReply} className="text-xs text-[var(--app-text-muted)] transition hover:text-white">
                Reply
              </button>
            ) : null}
            {canDelete && onDelete ? (
              <button onClick={onDelete} className="inline-flex items-center gap-1 text-xs text-[var(--app-danger)] transition hover:text-[var(--app-text)]">
                <Trash2 size={12} />
                Delete
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
