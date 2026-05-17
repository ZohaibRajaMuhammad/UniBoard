"use client";

import { useState } from "react";
import { ArrowUp } from "lucide-react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { cn } from "@/lib/utils";

export function UpvoteButton({
  postId,
  upvoteCount,
  label = "Upvote"
}: {
  postId: Id<"posts">;
  upvoteCount: number;
  label?: string;
}) {
  const toggleVote = useMutation(api.votes.toggle);
  const currentVote = useQuery(api.posts.getUserVote, { postId });
  const [optimisticCount, setOptimisticCount] = useState<number | null>(null);
  const [optimisticVote, setOptimisticVote] = useState<boolean | null>(null);

  const hasVoted = optimisticVote ?? Boolean(currentVote);
  const count = optimisticCount ?? upvoteCount;

  async function handleVote() {
    setOptimisticVote(!hasVoted);
    setOptimisticCount(count + (hasVoted ? -1 : 1));

    try {
      await toggleVote({ postId });
    } catch {
      setOptimisticVote(null);
      setOptimisticCount(null);
      return;
    }

    setTimeout(() => {
      setOptimisticVote(null);
      setOptimisticCount(null);
    }, 300);
  }

  return (
    <button
      onClick={() => void handleVote()}
      className={cn(
        "app-action-button",
        hasVoted ? "app-action-button-active" : ""
      )}
    >
      <ArrowUp size={14} />
      <span>{label}</span>
      <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-white">{count}</span>
    </button>
  );
}
