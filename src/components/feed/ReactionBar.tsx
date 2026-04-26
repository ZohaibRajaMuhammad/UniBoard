"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { Smile } from "lucide-react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { REACTION_EMOJIS } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function ReactionBar({ postId }: { postId: Id<"posts"> }) {
  const reactions = useQuery(api.posts.getPostReactions, { postId });
  const toggleReaction = useMutation(api.votes.toggleReaction);
  const currentUser = useQuery(api.users.getCurrentUser);
  const [showPicker, setShowPicker] = useState(false);

  async function handleReact(emoji: string) {
    try {
      await toggleReaction({ postId, emoji });
    } finally {
      setShowPicker(false);
    }
  }

  return (
    <div className="flex items-center gap-1">
      {reactions?.map((reaction) => (
        <button
          key={reaction.emoji}
          onClick={() => void handleReact(reaction.emoji)}
          className={cn(
            "flex items-center gap-1 rounded-full border px-2 py-1 text-xs transition-colors",
            reaction.userIds.includes(currentUser?._id ?? "")
              ? "border-brand-400/40 bg-brand-500/10 text-brand-100"
              : "border-white/10 bg-white/5 text-gray-300 hover:bg-white/10"
          )}
        >
          <span>{reaction.emoji}</span>
          <span>{reaction.count}</span>
        </button>
      ))}

      <div className="relative">
        <button
          onClick={() => setShowPicker((current) => !current)}
          className="rounded-xl p-2 text-gray-400 transition hover:bg-white/5 hover:text-white"
        >
          <Smile size={14} />
        </button>
        {showPicker ? (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setShowPicker(false)} />
            <div className="absolute bottom-10 left-0 z-20 flex gap-1 rounded-2xl border border-white/10 bg-gray-900 p-2 shadow-2xl">
              {REACTION_EMOJIS.map((emoji) => (
                <button key={emoji} onClick={() => void handleReact(emoji)} className="text-lg transition hover:scale-110">
                  {emoji}
                </button>
              ))}
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
