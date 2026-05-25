"use client";

import Link from "next/link";
import { useDeferredValue, useMemo, useState } from "react";
import { useQuery } from "convex/react";
import { ArrowUpRight, Search, Sparkles } from "lucide-react";
import { api } from "../../../../convex/_generated/api";
import type { FeedPost } from "@/components/feed/PostFeed";
import type { Room } from "@/types";
import { formatRelativeTime } from "@/lib/utils";

type SearchResultRecord = Partial<FeedPost> & {
  room?: Partial<Room> | null;
  relevance?: string;
  snippet?: string;
};

export default function SearchPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const deferredQuery = useDeferredValue(searchQuery);
  const results = useQuery(api.posts.search, { searchQuery: deferredQuery });
  const rawSuggestions = useQuery(api.posts.getSearchSuggestions);
  const suggestions = Array.isArray(rawSuggestions) ? rawSuggestions.filter((item): item is string => typeof item === "string") : [];
  const enrichedResults = useMemo(() => {
    const query = deferredQuery.trim().toLowerCase();
    if (!Array.isArray(results)) {
      return [];
    }

    return (results as SearchResultRecord[])
      .map((result) => {
        const safeId = typeof result._id === "string" ? result._id : null;
        const safeRoomId = typeof result.roomId === "string" ? result.roomId : null;
        const safeContent = typeof result.content === "string" ? result.content : "";
        const safeDeadlineTitle = typeof result.deadlineTitle === "string" ? result.deadlineTitle : "";
        const safeResourceTitle = typeof result.resourceTitle === "string" ? result.resourceTitle : "";
        const safeType = typeof result.type === "string" ? result.type : "note";
        const safeCreatedAt = typeof result.createdAt === "number" && Number.isFinite(result.createdAt) ? result.createdAt : null;
        const safeRoomName = typeof result.room?.name === "string" ? result.room.name : "Room";
        const safeAuthorName = typeof result.author?.name === "string" ? result.author.name : "Unknown author";
        const safeTags = Array.isArray(result.tags) ? result.tags.filter((tag): tag is string => typeof tag === "string") : [];

        if (!safeId || !safeRoomId || !safeCreatedAt) {
          return null;
        }

        const title = (safeDeadlineTitle || safeResourceTitle).toLowerCase();
        const body = safeContent.toLowerCase();
        const tagLine = safeTags.join(" ").toLowerCase();

        const relevance = title.includes(query)
          ? "Title match"
          : tagLine.includes(query)
            ? "Tag match"
            : "Body match";

        return {
          ...result,
          _id: safeId,
          roomId: safeRoomId,
          type: safeType,
          createdAt: safeCreatedAt,
          deadlineTitle: safeDeadlineTitle,
          resourceTitle: safeResourceTitle,
          content: safeContent,
          tags: safeTags,
          room: {
            ...(result.room ?? {}),
            name: safeRoomName
          },
          author: {
            ...(result.author ?? {}),
            name: safeAuthorName
          },
          relevance,
          snippet: buildSnippet(safeContent, query)
        };
      })
      .filter((result): result is NonNullable<typeof result> => result !== null);
  }, [deferredQuery, results]);

  return (
    <div className="app-scroll">
      <div className="page-wrap page-stack content-column">
        <section className="spotlight-ring glass-panel page-hero">
          <div className="max-w-3xl">
            <p className="section-eyebrow text-[var(--app-primary-strong)]">Search</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-white">Search the live knowledge stream.</h1>
            <p className="mt-2 text-sm leading-7 text-[var(--app-text-soft)]">
              Search across posts, deadlines, and resources in rooms you belong to, with results tuned for fast academic recall.
            </p>
          </div>

          <div className="mt-6 flex items-center gap-3 rounded-[24px] border border-[var(--app-line)] bg-white/[0.04] px-4 py-4">
            <Search size={18} className="text-[var(--app-text-muted)]" />
            <input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search for notes, deadlines, resources, or concepts..."
              className="w-full bg-transparent text-sm text-white outline-none placeholder:text-[var(--app-text-muted)]"
            />
          </div>

          <div className="mt-3 flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-[var(--app-text-muted)]">
            <Sparkles size={12} />
            Room-scoped retrieval across accessible posts and resources
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {suggestions.map((item) => (
              <button
                key={item}
                onClick={() => setSearchQuery(item)}
                className="panel-chip rounded-2xl px-4 py-2 text-sm"
              >
                <Sparkles size={12} />
                {item}
              </button>
            ))}
          </div>
        </section>

        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-[var(--app-text-muted)]">
            {deferredQuery.trim().length < 2 ? "Type at least 2 characters to search." : `Results for "${deferredQuery}"`}
          </p>
          <p className="text-xs uppercase tracking-[0.22em] text-[var(--app-text-muted)]">
            {enrichedResults.length} matches
          </p>
        </div>

        <section className="space-y-3">
          {results === undefined ? (
            deferredQuery.length >= 2 ? (
              <div className="glass-panel rounded-[28px] p-6 text-sm text-[var(--app-text-muted)]">Searching...</div>
            ) : null
          ) : enrichedResults.length === 0 ? (
            <div className="glass-panel rounded-[28px] p-6 text-sm text-[var(--app-text-muted)]">No matching posts found.</div>
          ) : (
            enrichedResults.map((result) => (
              <Link
                key={result._id}
                href={`/rooms/${result.roomId}?post=${result._id}`}
                className="glass-panel block rounded-[28px] p-5 transition hover:border-[rgba(109,140,255,0.24)]"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="panel-chip rounded-2xl px-3 py-1 text-[11px] uppercase tracking-[0.18em]">
                        {result.type}
                      </span>
                      <span className="panel-chip rounded-2xl px-3 py-1 text-[11px]">
                        {result.relevance}
                      </span>
                      <span className="text-xs text-[var(--app-text-muted)]">{result.room?.name ?? "Room"}</span>
                    </div>
                    <p className="mt-3 text-base font-semibold text-white">{result.deadlineTitle || result.resourceTitle || "Search result"}</p>
                    <p className="mt-2 text-sm leading-7 text-[var(--app-text-soft)]">{result.snippet}</p>
                    <p className="mt-3 text-xs text-[var(--app-text-muted)]">by {result.author?.name ?? "Unknown author"}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <span className="text-xs text-[var(--app-text-muted)]">{formatRelativeTime(result.createdAt)}</span>
                    <span className="mt-2 inline-flex items-center gap-1 text-xs text-[var(--app-primary-strong)]">
                      Open match
                      <ArrowUpRight size={12} />
                    </span>
                  </div>
                </div>
              </Link>
            ))
          )}
        </section>
      </div>
    </div>
  );
}

function buildSnippet(content: string, query: string) {
  if (!query) {
    return content;
  }

  const lower = content.toLowerCase();
  const index = lower.indexOf(query);
  if (index === -1) {
    return content;
  }

  const start = Math.max(0, index - 84);
  const end = Math.min(content.length, index + query.length + 120);
  const prefix = start > 0 ? "..." : "";
  const suffix = end < content.length ? "..." : "";
  return `${prefix}${content.slice(start, end).trim()}${suffix}`;
}
