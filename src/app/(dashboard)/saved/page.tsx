"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { Bookmark, ExternalLink } from "lucide-react";
import { api } from "../../../../convex/_generated/api";
import type { FeedPost } from "@/components/feed/PostFeed";
import { formatRelativeTime, truncate } from "@/lib/utils";

export default function SavedPage() {
  const savedPosts = useQuery(api.posts.getSavedPosts);
  const savePost = useMutation(api.posts.savePost);
  const [activeType, setActiveType] = useState<string>("all");
  const items = useMemo(() => {
    const source = (savedPosts as FeedPost[] | undefined) ?? [];
    return activeType === "all" ? source : source.filter((item) => item.type === activeType);
  }, [activeType, savedPosts]);
  const availableTypes = useMemo(() => {
    const source = (savedPosts as FeedPost[] | undefined) ?? [];
    return ["all", ...new Set(source.map((item) => item.type))];
  }, [savedPosts]);

  return (
    <div className="app-scroll">
      <div className="page-wrap page-stack">
        <section className="spotlight-ring glass-panel rounded-[34px] p-6 sm:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05]">
                <Bookmark size={20} className="text-brand-200" />
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-white">Saved content</h1>
              <p className="mt-2 text-sm leading-6 text-gray-300">
                Return to valuable notes, resources, and deadlines without searching the workspace again.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-gray-300">
              {(savedPosts as FeedPost[] | undefined)?.length ?? 0} saved item{((savedPosts as FeedPost[] | undefined)?.length ?? 0) === 1 ? "" : "s"}
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            {availableTypes.map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setActiveType(type)}
                className={activeType === type ? "rounded-2xl bg-brand-500 px-4 py-2 text-sm font-medium text-white" : "rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-gray-300"}
              >
                {type === "all" ? "All saved" : type}
              </button>
            ))}
          </div>
        </section>

        <section className="glass-panel rounded-[28px] p-4 sm:p-6">
          {savedPosts === undefined ? (
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="h-28 animate-pulse rounded-[24px] bg-white/5" />
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="rounded-[24px] border border-dashed border-white/10 bg-black/20 p-10 text-center">
              <h2 className="text-xl font-semibold text-white">No saved items yet</h2>
              <p className="mt-3 text-sm leading-6 text-gray-400">
                Use the post menu in any room to save material that deserves a second pass later.
              </p>
              <Link href="/rooms" className="mt-5 inline-flex text-sm font-medium text-brand-100 transition hover:text-white">
                Browse rooms
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item) => (
                <div key={item._id} className="rounded-[24px] border border-white/10 bg-black/20 p-5">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="panel-chip rounded-2xl px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-gray-200">{item.type}</span>
                        <span className="text-xs text-gray-500">{formatRelativeTime(item.createdAt)}</span>
                      </div>
                      <p className="mt-3 text-lg font-semibold text-white">{truncate(item.deadlineTitle || item.resourceTitle || item.content, 120)}</p>
                      <p className="mt-2 text-sm leading-6 text-gray-300">{truncate(item.content, 220)}</p>
                      <p className="mt-3 text-xs text-gray-500">Saved from room activity by {item.author.name}</p>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      <Link
                        href={`/rooms/${item.roomId}?post=${item._id}`}
                        className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-white transition hover:bg-white/10"
                      >
                        <ExternalLink size={14} />
                        Open source
                      </Link>
                      <button
                        type="button"
                        onClick={() => void savePost({ postId: item._id })}
                        className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-gray-300 transition hover:bg-white/5"
                      >
                        Unsave
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
