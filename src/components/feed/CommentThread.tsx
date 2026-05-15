"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { useMutation, useQuery } from "convex/react";
import { MessageSquare, Send, Sparkles, Trash2 } from "lucide-react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { postAi } from "@/lib/ai/client";
import type { AssistantReply } from "@/lib/ai/contracts";
import { buildAssistantPrompt, containsAiMention, formatAssistantComment } from "@/lib/ai/mentions";
import { ROOM_MENTION_AI } from "@/lib/constants";
import { cn, formatRelativeTime, initials } from "@/lib/utils";

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
      await createComment({
        postId,
        content: content.trim(),
        isAnonymous,
        parentCommentId: replyTo
      });

      if (containsAiMention(content)) {
        const parentComment = replyTo ? (comments ?? []).find((comment) => comment._id === replyTo) : null;
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
              content: formatAssistantComment(payload.data?.reply ?? "I could not ground a reliable answer for that mention.", payload.data?.suggestions)
            })
          )
          .catch(() => null);
      }

      setContent("");
      setReplyTo(undefined);
      setIsAnonymous(false);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Unable to comment.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="rounded-[24px] border border-white/10 bg-black/15 p-4">
      <div className="mb-4 flex items-center gap-2 text-sm font-medium text-white">
        <MessageSquare size={15} />
        Discussion
      </div>

      <div className="space-y-3">
        {topLevelComments.length === 0 ? (
          <p className="text-sm text-gray-500">No comments yet.</p>
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

      <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-3">
        {replyTo ? <p className="mb-2 text-xs text-brand-200">Replying to a comment</p> : null}

        <div className="mb-3 flex flex-wrap gap-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-gray-300">
            <Sparkles size={12} />
            Quick mentions
          </div>
          {mentionableNames.map((mention) => (
            <button
              key={mention}
              type="button"
              onClick={() => insertMention(mention)}
              className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-gray-200 transition hover:bg-white/10"
            >
              {mention}
            </button>
          ))}
        </div>

        <textarea
          value={content}
          onChange={(event) => setContent(event.target.value)}
          rows={3}
          maxLength={500}
          placeholder="Add a comment"
          className="w-full resize-none rounded-xl bg-transparent text-sm text-white outline-none placeholder:text-gray-500"
        />

        {submitError ? <p className="mt-2 text-sm text-red-300">{submitError}</p> : null}

        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <button
            onClick={() => setIsAnonymous((current) => !current)}
            className={cn(
              "rounded-full border px-3 py-1 text-xs transition",
              isAnonymous ? "border-brand-400/40 bg-brand-500/10 text-brand-100" : "border-white/10 text-gray-400"
            )}
          >
            {isAnonymous ? "Anonymous" : "Visible"}
          </button>
          <div className="flex flex-wrap items-center gap-2">
            {replyTo ? (
              <button onClick={() => setReplyTo(undefined)} className="text-xs text-gray-500 transition hover:text-white">
                Cancel reply
              </button>
            ) : null}
            <button
              onClick={() => void handleSubmit()}
              disabled={!content.trim() || isSubmitting}
              className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-3 py-2 text-xs font-semibold text-white transition hover:bg-brand-400 disabled:opacity-60"
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
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-xs font-semibold text-white">
          {comment.author.imageUrl ? (
            <Image
              src={comment.author.imageUrl}
              alt={`${comment.author.name} avatar`}
              width={36}
              height={36}
              className="h-9 w-9 rounded-full object-cover"
            />
          ) : (
            initials(comment.author.name)
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold text-white">{comment.author.name}</p>
            <span className="text-xs text-gray-500">{formatRelativeTime(comment.createdAt)}</span>
          </div>
          <p className={cn("mt-1 whitespace-pre-wrap break-words text-sm leading-6 text-gray-300", compact && "text-[13px]")}>{comment.content}</p>
          <div className="mt-2 flex items-center gap-3">
            {!compact && onReply ? (
              <button onClick={onReply} className="text-xs text-gray-500 transition hover:text-white">
                Reply
              </button>
            ) : null}
            {canDelete && onDelete ? (
              <button onClick={onDelete} className="inline-flex items-center gap-1 text-xs text-red-300 transition hover:text-red-200">
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
