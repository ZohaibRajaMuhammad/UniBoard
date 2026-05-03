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
        "inline-flex items-center gap-2 rounded-2xl border px-3 py-2 text-sm font-medium transition",
        hasVoted ? "border-brand-400/40 bg-brand-500/10 text-brand-100" : "border-white/10 bg-white/5 text-gray-300 hover:bg-white/10"
      )}
    >
      <ArrowUp size={14} />
      <span>{label}</span>
      <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-white">{count}</span>
    </button>
  );
}
