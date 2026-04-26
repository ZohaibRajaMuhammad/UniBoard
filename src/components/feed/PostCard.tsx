"use client";

import { useState } from "react";
import Image from "next/image";
import { useMutation, useQuery } from "convex/react";
import { Bookmark, CheckCircle2, Flag, Link2, MessageSquare, MoreHorizontal, Pin, RotateCcw, Trash2 } from "lucide-react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { CommentThread } from "./CommentThread";
import { DeadlineCountdown } from "./DeadlineCountdown";
import type { FeedPost } from "./PostFeed";
import { ReactionBar } from "./ReactionBar";
import { UpvoteButton } from "./UpvoteButton";
import { cn, formatRelativeTime, initials } from "@/lib/utils";

const typeConfig: Record<string, string> = {
  note: "bg-blue-500/10 text-blue-200",
  deadline: "bg-red-500/10 text-red-200",
  question: "bg-amber-500/10 text-amber-200",
  resource: "bg-emerald-500/10 text-emerald-200",
  announcement: "bg-brand-500/10 text-brand-200"
};

export function PostCard({ post, roomId }: { post: FeedPost; roomId: Id<"rooms"> }) {
  const currentUser = useQuery(api.users.getCurrentUser);
  const removePost = useMutation(api.posts.remove);
  const togglePin = useMutation(api.posts.togglePin);
  const markResolved = useMutation(api.posts.markResolved);
  const reportPost = useMutation(api.posts.reportPost);
  const savePost = useMutation(api.posts.savePost);
  const repost = useMutation(api.posts.repost);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showComments, setShowComments] = useState(false);

  const membershipDelete = currentUser && ((!post.isAnonymous && post.authorId === currentUser._id) || currentUser.role === "teacher" || currentUser.role === "super_admin");
  const canPin = currentUser && (currentUser.role === "teacher" || currentUser.role === "super_admin");
  const canResolve = currentUser && post.type === "question" && !post.isResolved && ((!post.isAnonymous && post.authorId === currentUser._id) || currentUser.role === "teacher" || currentUser.role === "super_admin");

  return (
    <article className={cn("glass-panel rounded-[30px] p-5", post.isPinned && "border-amber-400/30 shadow-[0_0_0_1px_rgba(245,158,11,0.08),0_25px_70px_rgba(4,8,18,0.48)]")}>
      <div className="flex items-start gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-sm font-semibold text-white">
          {post.author.imageUrl ? (
            <Image
              src={post.author.imageUrl}
              alt={`${post.author.name} avatar`}
              width={44}
              height={44}
              className="h-11 w-11 rounded-full object-cover"
            />
          ) : initials(post.author.name)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold text-white">{post.author.name}</p>
            <span className={cn("rounded-full px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.18em]", typeConfig[post.type] ?? typeConfig.note)}>
              {post.type}
            </span>
            {post.isPinned ? <span className="inline-flex items-center gap-1 text-xs text-amber-300"><Pin size={12} />Pinned</span> : null}
            {post.isResolved ? <span className="inline-flex items-center gap-1 text-xs text-emerald-300"><CheckCircle2 size={12} />Resolved</span> : null}
            {post.isEdited ? <span className="text-xs text-gray-500">Edited</span> : null}
            <span className="ml-auto text-xs text-gray-500">{formatRelativeTime(post.createdAt)}</span>
            {(membershipDelete || canPin || canResolve) ? (
              <div className="relative">
                <button onClick={() => setMenuOpen((current) => !current)} className="rounded-xl p-2 text-gray-500 transition hover:bg-white/5 hover:text-white">
                  <MoreHorizontal size={16} />
                </button>
                {menuOpen ? (
                  <div className="absolute right-0 top-10 z-20 min-w-[190px] rounded-2xl border border-white/10 bg-gray-900 p-1 shadow-2xl">
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
                      label="Repost"
                      onClick={async () => {
                        await repost({ originalPostId: post._id });
                        setMenuOpen(false);
                      }}
                    />
                    {!membershipDelete ? (
                      <ActionButton
                        icon={<Flag size={14} />}
                        label="Report post"
                        onClick={async () => {
                          await reportPost({ postId: post._id });
                          setMenuOpen(false);
                        }}
                      />
                    ) : null}
                    {membershipDelete ? (
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
            <div className="mt-2 flex flex-wrap gap-2">
              {post.tags.map((tag) => (
                <span key={tag} className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[11px] text-gray-300">
                  #{tag}
                </span>
              ))}
            </div>
          ) : null}

          <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-gray-200">{post.content}</p>

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

          <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-white/10 pt-4">
            <UpvoteButton postId={post._id} upvoteCount={post.upvoteCount} />
            <button
              onClick={() => setShowComments((current) => !current)}
              className={cn(
                "inline-flex items-center gap-2 rounded-2xl border px-3 py-2 text-sm font-medium transition",
              showComments ? "border-brand-400/40 bg-brand-500/10 text-brand-100" : "border-white/10 bg-white/5 text-gray-300 hover:bg-white/10"
              )}
            >
              <MessageSquare size={14} />
              {post.commentCount ?? 0}
            </button>
            <ReactionBar postId={post._id} />
          </div>

          {showComments ? (
            <div className="mt-4">
              <CommentThread postId={post._id} />
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
        tone === "danger" ? "text-red-300" : "text-gray-200"
      )}
    >
      {icon}
      {label}
    </button>
  );
}
