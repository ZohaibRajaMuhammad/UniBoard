"use client";

import type { Id } from "../../../convex/_generated/dataModel";
import { FilePlus2 } from "lucide-react";
import { PostCard } from "./PostCard";

export interface FeedPost {
  _id: Id<"posts">;
  roomId: Id<"rooms">;
  authorId?: Id<"users">;
  content: string;
  type: string;
  upvoteCount: number;
  commentCount?: number;
  shareCount?: number;
  isPinned: boolean;
  isResolved: boolean;
  isEdited?: boolean;
  isHidden?: boolean;
  isDeleted: boolean;
  isAnonymous: boolean;
  createdAt: number;
  tags?: string[];
  deadlineDate?: number;
  deadlineTitle?: string;
  resourceUrl?: string;
  resourceTitle?: string;
  author: {
    name: string;
    imageUrl: string | null;
    role: string;
  };
}

export function PostFeed({
  posts,
  roomId,
  emptyStateLabel = "No posts yet",
  highlightedPostId
}: {
  posts: FeedPost[] | undefined;
  roomId: Id<"rooms">;
  emptyStateLabel?: string;
  highlightedPostId?: Id<"posts">;
}) {
  if (posts === undefined) {
    return (
      <div className="space-y-4 p-4 sm:p-6">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="h-32 animate-pulse rounded-[28px] bg-white/5" />
        ))}
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="mx-auto flex max-w-3xl flex-col items-center justify-center px-4 py-20 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full border border-white/10 bg-white/5 text-[var(--app-primary-strong)]">
          <FilePlus2 size={28} />
        </div>
        <h2 className="mt-5 text-2xl font-semibold text-white">{emptyStateLabel}</h2>
        <p className="mt-2 max-w-md text-sm leading-7 text-gray-400">
          Start with a note, question, resource, or deadline so the room becomes useful immediately for everyone else.
        </p>
      </div>
    );
  }

  return (
    <div className="feed-column mx-auto space-y-5 p-4 sm:p-6">
      {posts.map((post) => (
        <PostCard key={post._id} post={post} roomId={roomId} highlighted={highlightedPostId === post._id} />
      ))}
      <div className="h-24" />
    </div>
  );
}
