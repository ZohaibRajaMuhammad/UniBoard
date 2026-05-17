"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import {
  Bookmark,
  CheckCircle2,
  EyeOff,
  Flag,
  Link2,
  MessageSquare,
  MoreHorizontal,
  PenSquare,
  Pin,
  RotateCcw,
  Trash2
} from "lucide-react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { CommentThread } from "./CommentThread";
import { DeadlineCountdown } from "./DeadlineCountdown";
import type { FeedPost } from "./PostFeed";
import { ReactionBar } from "./ReactionBar";
import { UpvoteButton } from "./UpvoteButton";
import { ProfileAvatar } from "@/components/ui/ProfileAvatar";
import { cn, formatRelativeTime } from "@/lib/utils";

const typeConfig: Record<string, string> = {
  note: "bg-blue-500/10 text-blue-200",
  deadline: "bg-red-500/10 text-red-200",
  question: "bg-amber-500/10 text-amber-200",
  resource: "bg-emerald-500/10 text-emerald-200",
  announcement: "bg-brand-500/10 text-brand-200",
  poll: "bg-fuchsia-500/10 text-fuchsia-200",
  project: "bg-cyan-500/10 text-cyan-200"
};

export function PostCard({
  post,
  roomId,
  highlighted = false
}: {
  post: FeedPost;
  roomId: Id<"rooms">;
  highlighted?: boolean;
}) {
  const currentUser = useQuery(api.users.getCurrentUser);
  const removePost = useMutation(api.posts.remove);
  const togglePin = useMutation(api.posts.togglePin);
  const markResolved = useMutation(api.posts.markResolved);
  const reportPost = useMutation(api.posts.reportPost);
  const savePost = useMutation(api.posts.savePost);
  const repost = useMutation(api.posts.repost);
  const editPost = useMutation(api.posts.editPost);
  const hidePost = useMutation(api.posts.hidePost);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [draftContent, setDraftContent] = useState(post.content);
  const [draftTags, setDraftTags] = useState((post.tags ?? []).join(", "));
  const [actionError, setActionError] = useState("");

  const isOwner = Boolean(currentUser && !post.isAnonymous && post.authorId === currentUser._id);
  const canDelete = Boolean(
    currentUser && (isOwner || currentUser.role === "teacher" || currentUser.role === "super_admin")
  );
  const canPin = Boolean(currentUser && (currentUser.role === "teacher" || currentUser.role === "super_admin"));
  const canResolve = Boolean(
    currentUser &&
      post.type === "question" &&
      !post.isResolved &&
      (isOwner || currentUser.role === "teacher" || currentUser.role === "super_admin")
  );
  const canEdit = Boolean(isOwner && !post.isHidden);
  const canHide = Boolean(isOwner);
  const canReport = Boolean(currentUser && !canDelete);
  const canOpenMenu = canPin || canResolve || canDelete || canEdit || canHide || canReport || Boolean(currentUser);

  const pollOptions = useMemo(() => {
    if (post.type !== "poll") {
      return [];
    }

    const marker = "Poll options:\n";
    const markerIndex = post.content.indexOf(marker);
    if (markerIndex === -1) {
      return [];
    }

    return post.content
      .slice(markerIndex + marker.length)
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.startsWith("- "))
      .map((line) => line.slice(2));
  }, [post.content, post.type]);

  async function saveEdit() {
    setActionError("");
    try {
      await editPost({
        postId: post._id,
        content: draftContent,
        tags: draftTags
          .split(",")
          .map((tag) => tag.trim().toLowerCase().replace(/^#/, ""))
          .filter(Boolean)
      });
      setIsEditing(false);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Unable to save changes.");
    }
  }

  return (
    <article
      id={`post-${post._id}`}
      className={cn(
        "feed-post-card overflow-hidden p-5 sm:p-6",
        post.isPinned && "border-amber-400/30 shadow-[0_0_0_1px_rgba(245,158,11,0.08),0_25px_70px_rgba(4,8,18,0.48)]",
        highlighted && "border-brand-400/40 shadow-[0_0_0_1px_rgba(63,115,255,0.18),0_30px_80px_rgba(10,20,48,0.42)]"
      )}
    >
      <div className="flex items-start gap-4 sm:gap-5">
        <ProfileAvatar name={post.author.name} imageUrl={post.author.imageUrl} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold text-[var(--app-text)]">{post.author.name}</p>
            <span className={cn("rounded-full px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.18em]", typeConfig[post.type] ?? typeConfig.note)}>
              {post.type}
            </span>
            {post.isPinned ? <span className="inline-flex items-center gap-1 text-xs text-amber-300"><Pin size={12} />Pinned</span> : null}
            {post.isResolved ? <span className="inline-flex items-center gap-1 text-xs text-emerald-300"><CheckCircle2 size={12} />Resolved</span> : null}
            {post.isHidden ? <span className="inline-flex items-center gap-1 text-xs text-[var(--app-text-muted)]"><EyeOff size={12} />Hidden</span> : null}
            {post.isEdited ? <span className="text-xs text-[var(--app-text-muted)]">Edited</span> : null}
            <span className="ml-auto text-xs text-[var(--app-text-muted)]">{formatRelativeTime(post.createdAt)}</span>

            {canOpenMenu ? (
              <div className="relative">
                <button onClick={() => setMenuOpen((current) => !current)} className="rounded-xl p-2 text-[var(--app-text-muted)] transition hover:bg-white/5 hover:text-[var(--app-text)]">
                  <MoreHorizontal size={16} />
                </button>
                {menuOpen ? (
                  <div className="app-surface-soft absolute right-0 top-10 z-20 min-w-[220px] rounded-2xl p-1 shadow-2xl">
                    {canEdit ? (
                      <ActionButton
                        icon={<PenSquare size={14} />}
                        label={isEditing ? "Close editor" : "Edit post"}
                        onClick={async () => {
                          setIsEditing((current) => !current);
                          setMenuOpen(false);
                        }}
                      />
                    ) : null}
                    {canHide ? (
                      <ActionButton
                        icon={<EyeOff size={14} />}
                        label={post.isHidden ? "Unhide post" : "Hide post"}
                        onClick={async () => {
                          await hidePost({ postId: post._id });
                          setMenuOpen(false);
                        }}
                      />
                    ) : null}
                    {canPin ? (
                      <ActionButton
                        icon={<Pin size={14} />}
                        label={post.isPinned ? "Unpin post" : "Pin post"}
                        onClick={async () => {
                          await togglePin({ postId: post._id });
                          setMenuOpen(false);
                        }}
                      />
                    ) : null}
                    {canResolve ? (
                      <ActionButton
                        icon={<CheckCircle2 size={14} />}
                        label="Mark resolved"
                        onClick={async () => {
                          await markResolved({ postId: post._id });
                          setMenuOpen(false);
                        }}
                      />
                    ) : null}
                    {currentUser ? (
                      <>
                        <ActionButton
                          icon={<Bookmark size={14} />}
                          label="Save post"
                          onClick={async () => {
                            await savePost({ postId: post._id });
                            setMenuOpen(false);
                          }}
                        />
                        <ActionButton
                          icon={<RotateCcw size={14} />}
                          label="Share or repost"
                          onClick={async () => {
                            await repost({ originalPostId: post._id });
                            setMenuOpen(false);
                          }}
                        />
                      </>
                    ) : null}
                    {canReport ? (
                      <ActionButton
                        icon={<Flag size={14} />}
                        label="Report post"
                        onClick={async () => {
                          await reportPost({ postId: post._id });
                          setMenuOpen(false);
                        }}
                      />
                    ) : null}
                    {canDelete ? (
                      <ActionButton
                        icon={<Trash2 size={14} />}
                        label="Delete post"
                        tone="danger"
                        onClick={async () => {
                          await removePost({ postId: post._id });
                          setMenuOpen(false);
                        }}
                      />
                    ) : null}
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>

          {post.tags?.length ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {post.tags.map((tag) => (
                <span key={tag} className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[11px] text-[var(--app-text-soft)]">
                  #{tag}
                </span>
              ))}
            </div>
          ) : null}

          {isEditing ? (
            <div className="app-surface-muted mt-4 space-y-3 rounded-3xl p-4">
              <textarea
                value={draftContent}
                onChange={(event) => setDraftContent(event.target.value)}
                rows={5}
                className="app-textarea"
              />
              <input
                value={draftTags}
                onChange={(event) => setDraftTags(event.target.value)}
                className="app-input"
                placeholder="revision, urgent, architecture"
              />
              <div className="flex flex-wrap gap-3">
                <button onClick={() => void saveEdit()} className="app-button app-button-primary">
                  Save changes
                </button>
                <button
                  onClick={() => {
                    setDraftContent(post.content);
                    setDraftTags((post.tags ?? []).join(", "));
                    setIsEditing(false);
                  }}
                  className="app-button app-button-secondary"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              <p className="mt-4 whitespace-pre-wrap text-[15px] leading-8 text-[var(--app-text-soft)]">
                {post.type === "poll" ? post.content.split("\n\nPoll options:\n")[0] : post.content}
              </p>

              {post.type === "poll" && pollOptions.length > 0 ? (
                <div className="mt-4 space-y-2 rounded-2xl border border-fuchsia-400/20 bg-fuchsia-500/5 p-4">
                  {pollOptions.map((option) => (
                    <div key={option} className="app-surface-soft rounded-2xl px-4 py-3 text-sm text-[var(--app-text)]">
                      {option}
                    </div>
                  ))}
                  <p className="text-xs text-[var(--app-text-muted)]">Use the vote button below to register support for this poll.</p>
                </div>
              ) : null}
            </>
          )}

          {post.type === "deadline" && post.deadlineDate ? <DeadlineCountdown deadlineDate={post.deadlineDate} title={post.deadlineTitle} /> : null}

          {post.type === "resource" && post.resourceUrl ? (
            <a
              href={post.resourceUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-4 inline-flex items-center gap-2 rounded-2xl border border-emerald-400/20 bg-emerald-400/5 px-4 py-2 text-sm text-emerald-200 transition hover:bg-emerald-400/10"
            >
              <Link2 size={14} />
              {post.resourceTitle || post.resourceUrl}
            </a>
          ) : null}

          {actionError ? <p className="mt-3 text-sm text-red-300">{actionError}</p> : null}

          <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-white/10 pt-4">
            <UpvoteButton postId={post._id} upvoteCount={post.upvoteCount} label={post.type === "poll" ? "Vote" : "Upvote"} />
            <button
              onClick={() => setShowComments((current) => !current)}
              className={cn("app-action-button", showComments ? "app-action-button-active" : "")}
            >
              <MessageSquare size={14} />
              <span>Comments</span>
              <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-[var(--app-text)]">{post.commentCount ?? 0}</span>
            </button>
            <ReactionBar postId={post._id} />
          </div>

          {showComments ? (
            <div className="mt-4">
              <CommentThread postId={post._id} roomId={roomId} />
            </div>
          ) : null}
        </div>
      </div>
    </article>
  );
}

function ActionButton({
  icon,
  label,
  onClick,
  tone = "default"
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => Promise<void>;
  tone?: "default" | "danger";
}) {
  return (
    <button
      onClick={() => void onClick()}
      className={cn(
        "flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm transition hover:bg-white/5",
        tone === "danger" ? "text-red-300" : "text-[var(--app-text)]"
      )}
    >
      {icon}
      {label}
    </button>
  );
}
