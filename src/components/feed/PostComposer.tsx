"use client";

import { KeyboardEvent, useMemo, useState } from "react";
import { ChevronDown, Eye, EyeOff, Send } from "lucide-react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { POST_TYPE_CONFIG, POST_TYPES } from "@/lib/constants";
import { cn } from "@/lib/utils";

const postTypes = POST_TYPES.map((type) => ({
  value: type,
  label: POST_TYPE_CONFIG[type].label,
  emoji: POST_TYPE_CONFIG[type].emoji
}));

export function PostComposer({ roomId }: { roomId: Id<"rooms"> }) {
  const createPost = useMutation(api.posts.create);
  const [content, setContent] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [postType, setPostType] = useState<(typeof postTypes)[number]["value"]>("note");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showTypes, setShowTypes] = useState(false);
  const [deadlineDate, setDeadlineDate] = useState("");
  const [deadlineTitle, setDeadlineTitle] = useState("");
  const [resourceUrl, setResourceUrl] = useState("");
  const [resourceTitle, setResourceTitle] = useState("");

  async function handleSubmit() {
    if (!content.trim() || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    try {
      await createPost({
        roomId,
        content: content.trim(),
        type: postType,
        isAnonymous,
        deadlineDate: deadlineDate ? new Date(deadlineDate).getTime() : undefined,
        deadlineTitle: deadlineTitle || undefined,
        resourceUrl: resourceUrl || undefined,
        resourceTitle: resourceTitle || undefined
      });

      setContent("");
      setDeadlineDate("");
      setDeadlineTitle("");
      setResourceUrl("");
      setResourceTitle("");
    } finally {
      setIsSubmitting(false);
    }
  }

  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
      event.preventDefault();
      void handleSubmit();
    }
  }

  const selectedType = postTypes.find((type) => type.value === postType) ?? postTypes[0];
  const helperLabel = useMemo(() => {
    if (postType === "deadline") {
      return "Use a short description and add the due date so students can act on it quickly.";
    }

    if (postType === "resource") {
      return "Paste the source link and give it a clear title so the room stays organized.";
    }

    if (postType === "announcement") {
      return "Announcements are pinned by default. Keep them concise and operational.";
    }

    return "Keep updates direct, useful, and easy to scan on mobile.";
  }, [postType]);

  return (
    <div className="mx-auto max-w-6xl p-4 sm:p-6">
      <div className="spotlight-ring glass-panel rounded-[30px] p-4 sm:p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-gray-500">Compose update</p>
            <p className="mt-2 max-w-2xl text-sm leading-7 text-gray-300">{helperLabel}</p>
          </div>

          <button
            onClick={() => setIsAnonymous((current) => !current)}
            className={cn(
              "inline-flex items-center justify-center gap-2 self-start rounded-2xl border px-4 py-2 text-sm transition",
              isAnonymous ? "border-brand-400/40 bg-brand-500/10 text-brand-100" : "border-white/10 bg-white/5 text-gray-300"
            )}
          >
            {isAnonymous ? <EyeOff size={14} /> : <Eye size={14} />}
            {isAnonymous ? "Anonymous mode" : "Visible identity"}
          </button>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <div className="relative">
            <button
              onClick={() => setShowTypes((current) => !current)}
              className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white"
            >
              <span>{selectedType.emoji}</span>
              {selectedType.label}
              <ChevronDown size={14} />
            </button>

            {showTypes ? (
              <div className="absolute bottom-full left-0 z-20 mb-2 min-w-[220px] rounded-2xl border border-white/10 bg-gray-900 p-2 shadow-2xl">
                {postTypes.map((type) => (
                  <button
                    key={type.value}
                    onClick={() => {
                      setPostType(type.value);
                      setShowTypes(false);
                    }}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm text-gray-200 transition hover:bg-white/5"
                  >
                    <span>{type.emoji}</span>
                    <span>{type.label}</span>
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          <div className="panel-chip text-gray-300">{selectedType.label} format selected</div>
        </div>

        {postType === "deadline" ? (
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <input
              value={deadlineTitle}
              onChange={(event) => setDeadlineTitle(event.target.value)}
              placeholder="Assignment title"
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-brand-400"
            />
            <input
              type="datetime-local"
              value={deadlineDate}
              onChange={(event) => setDeadlineDate(event.target.value)}
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-brand-400"
            />
          </div>
        ) : null}

        {postType === "resource" ? (
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <input
              value={resourceUrl}
              onChange={(event) => setResourceUrl(event.target.value)}
              placeholder="https://resource-link"
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-brand-400"
            />
            <input
              value={resourceTitle}
              onChange={(event) => setResourceTitle(event.target.value)}
              placeholder="Resource title"
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-brand-400"
            />
          </div>
        ) : null}

        <div className="mt-4 rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.01))] p-1">
          <textarea
            value={content}
            onChange={(event) => setContent(event.target.value)}
            onKeyDown={onKeyDown}
            maxLength={1000}
            rows={4}
            placeholder="Share something useful with the room..."
            className="min-h-[120px] w-full rounded-[24px] border border-transparent bg-black/15 px-5 py-4 text-sm leading-7 text-white outline-none transition focus:border-brand-400"
          />
        </div>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <span className="text-xs text-gray-500">{content.length}/1000 • Press Ctrl/Cmd + Enter to post</span>
          <button
            onClick={() => void handleSubmit()}
            disabled={!content.trim() || isSubmitting}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-brand-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Send size={14} />
            {isSubmitting ? "Posting..." : "Post"}
          </button>
        </div>
      </div>
    </div>
  );
}
