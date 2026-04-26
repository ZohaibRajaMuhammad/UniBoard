"use client";

import { useDeferredValue, useMemo, useState } from "react";
import Link from "next/link";
import { useQuery } from "convex/react";
import { Search, Sparkles } from "lucide-react";
import { api } from "../../../../convex/_generated/api";
import { formatRelativeTime } from "@/lib/utils";
import type { FeedPost } from "@/components/feed/PostFeed";
import type { Room } from "@/types";

export default function SearchPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const deferredQuery = useDeferredValue(searchQuery);
  const results = useQuery(api.posts.search, { searchQuery: deferredQuery });
  const suggestions = useMemo(() => ["deadline", "OpenMP", "architecture", "normalization", "announcement"], []);

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-6">
      <div className="mx-auto max-w-5xl">
        <div className="spotlight-ring glass-panel mb-6 rounded-[34px] p-6 sm:p-8">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05]">
              <Search size={20} className="text-brand-200" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-white">Search the live knowledge stream.</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-300">Search across posts, deadlines, and resources in rooms you belong to, with results tuned for fast recall during class.</p>
            </div>
          </div>

          <div className="mt-6 flex items-center gap-3 rounded-3xl border border-white/10 bg-white/[0.04] px-4 py-4">
            <Search size={18} className="text-gray-500" />
            <input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search for notes, deadlines, or keywords..."
              className="w-full bg-transparent text-sm text-white outline-none placeholder:text-gray-500"
            />
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {suggestions.map((item) => (
              <button key={item} onClick={() => setSearchQuery(item)} className="panel-chip rounded-2xl px-4 py-2 text-sm text-gray-200">
                <Sparkles size={12} />
                {item}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-gray-400">
            {deferredQuery.trim().length < 2 ? "Type at least 2 characters to search." : `Results for "${deferredQuery}"`}
          </p>
          <p className="text-xs uppercase tracking-[0.22em] text-gray-500">{Array.isArray(results) ? results.length : 0} matches</p>
        </div>

        <div className="space-y-4">
          {results === undefined ? (
            deferredQuery.length >= 2 ? <div className="glass-panel rounded-[28px] p-6 text-sm text-gray-500">Searching...</div> : null
          ) : results.length === 0 ? (
            <div className="glass-panel rounded-[28px] p-6 text-sm text-gray-400">No matching posts found.</div>
          ) : (
            ((results as Array<FeedPost & { room?: Room | null }>)).map((result) => (
              <Link
                key={result._id}
                href={`/rooms/${result.roomId}`}
                className="glass-panel block rounded-[28px] p-5 transition hover:border-brand-400/30"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-white">{result.room?.name ?? "Room"}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <span className="panel-chip rounded-2xl px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-gray-200">{result.type}</span>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-gray-300">{result.content}</p>
                    <p className="mt-3 text-xs text-gray-500">by {result.author.name}</p>
                  </div>
                  <span className="text-xs text-gray-500">{formatRelativeTime(result.createdAt)}</span>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
