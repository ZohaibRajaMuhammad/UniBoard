"use client";

import { KeyboardEvent, useEffect, useMemo, useState } from "react";
import { ChevronDown, Eye, EyeOff, Plus, Send, Sparkles, Tags } from "lucide-react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { POST_TYPE_CONFIG, POST_TYPES, ROOM_MENTION_AI } from "@/lib/constants";
import { postAi } from "@/lib/ai/client";
import type { AssistantReply, ComposerSuggestion } from "@/lib/ai/contracts";
import { buildAssistantPrompt, containsAiMention, formatAssistantComment } from "@/lib/ai/mentions";
import { getPostTypeIcon } from "@/lib/ui-icons";
import { cn } from "@/lib/utils";

const postTypes = POST_TYPES.map((type) => ({
  value: type,
  label: POST_TYPE_CONFIG[type].label,
  emoji: POST_TYPE_CONFIG[type].emoji
}));

export function PostComposer({ roomId }: { roomId: Id<"rooms"> }) {
  const user = useCurrentUser();
  const room = useQuery(api.rooms.getById, { roomId });
  const members = useQuery(api.rooms.getMembers, { roomId });
  const createPost = useMutation(api.posts.create);
  const createAiReply = useMutation(api.comments.createAiReply);
  const [content, setContent] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [postType, setPostType] = useState<(typeof postTypes)[number]["value"]>("note");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showTypes, setShowTypes] = useState(false);
  const [deadlineDate, setDeadlineDate] = useState("");
  const [deadlineTitle, setDeadlineTitle] = useState("");
  const [resourceUrl, setResourceUrl] = useState("");
  const [resourceTitle, setResourceTitle] = useState("");
  const [pollOptions, setPollOptions] = useState("Option 1\nOption 2");
  const [tagInput, setTagInput] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [isAiDrafting, setIsAiDrafting] = useState(false);
  const [aiDraftStatus, setAiDraftStatus] = useState("");

  const canPostAnnouncement = user?.role === "teacher" || user?.role === "super_admin";
  const allowsAnonymous = room?.allowAnonymous ?? true;
  const isRoomArchived = room?.isArchived ?? false;
  const availablePostTypes = useMemo(
    () => postTypes.filter((type) => canPostAnnouncement || type.value !== "announcement"),
    [canPostAnnouncement]
  );

  useEffect(() => {
    if (!canPostAnnouncement && postType === "announcement") {
      setPostType("note");
    }
  }, [canPostAnnouncement, postType]);

  useEffect(() => {
    if (!allowsAnonymous && isAnonymous) {
      setIsAnonymous(false);
    }
  }, [allowsAnonymous, isAnonymous]);

  const mentionableNames = useMemo(() => {
    const names = (members ?? [])
      .map((member) => member.user.name)
      .filter((name, index, array) => array.indexOf(name) === index)
      .slice(0, 8);

    return [ROOM_MENTION_AI, ...names.map((name) => `@${name.replace(/\s+/g, "")}`)];
  }, [members]);

  const selectedType = availablePostTypes.find((type) => type.value === postType) ?? availablePostTypes[0];

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

    if (postType === "poll") {
      return "Set a clear question, add options, and let the room use the vote controls to signal the winning choice.";
    }

    if (postType === "project") {
      return "Use project posts for milestones, blockers, ownership, and demo-readiness updates.";
    }

    return `Keep updates direct, useful, and easy to scan on mobile. Mention ${ROOM_MENTION_AI} for an automated follow-up reply.`;
  }, [postType]);

  function insertMention(mention: string) {
    setContent((current) => `${current.trimEnd()}${current.trim() ? " " : ""}${mention} `);
  }

  function buildContent() {
    if (postType !== "poll") {
      return content.trim();
    }

    const options = pollOptions
      .split(/\r?\n/)
      .map((option) => option.trim())
      .filter(Boolean)
      .slice(0, 6);

    if (options.length < 2) {
      return content.trim();
    }

    return `${content.trim()}\n\nPoll options:\n${options.map((option) => `- ${option}`).join("\n")}`;
  }

  async function handleSubmit() {
    if (!content.trim() || isSubmitting || isRoomArchived) {
      return;
    }

    if (!canPostAnnouncement && postType === "announcement") {
      setSubmitError("Only teachers and super admins can post announcements.");
      setPostType("note");
      return;
    }

    const finalContent = buildContent();

    setIsSubmitting(true);
    setSubmitError("");
    try {
      const postId = await createPost({
        roomId,
        content: finalContent,
        type: postType,
        isAnonymous,
        tags: tagInput
          .split(",")
          .map((tag) => tag.trim().toLowerCase().replace(/^#/, ""))
          .filter(Boolean)
          .slice(0, 8),
        deadlineDate: deadlineDate ? new Date(deadlineDate).getTime() : undefined,
        deadlineTitle: deadlineTitle || undefined,
        resourceUrl: resourceUrl || undefined,
        resourceTitle: resourceTitle || undefined
      });

      if ((room?.aiEnabled ?? false) && containsAiMention(finalContent)) {
        void postAi<AssistantReply>("/api/v1/ai/assistant", {
          message: buildAssistantPrompt(finalContent, {
            postType,
            postTitle: deadlineTitle || resourceTitle || null,
            postContent: finalContent
          }),
          roomId
        })
          .then((payload) =>
            createAiReply({
              postId,
              content: formatAssistantComment(payload.data?.reply ?? "I could not ground a reliable answer for that mention.", payload.data?.suggestions)
            })
          )
          .catch(() => null);
      }

      setContent("");
      setDeadlineDate("");
      setDeadlineTitle("");
      setResourceUrl("");
      setResourceTitle("");
      setPollOptions("Option 1\nOption 2");
      setTagInput("");
      setIsAnonymous(false);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Unable to create post.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleAiDraft() {
    if (isAiDrafting || isRoomArchived || !(room?.aiEnabled ?? false)) {
      return;
    }

    setIsAiDrafting(true);
    setAiDraftStatus("");

    try {
      const payload = await postAi<ComposerSuggestion>("/api/v1/ai/composer/suggest", {
        prompt: content.trim() || `Draft a ${selectedType.label.toLowerCase()} post for this room.`,
        roomId
      });

      setContent(payload.data?.body ?? content);
      if (payload.data?.tags?.length) {
        setTagInput(payload.data.tags.join(", "));
      }
      setAiDraftStatus(payload.data?.disclaimer ?? "AI draft inserted.");
    } catch (error) {
      setAiDraftStatus(error instanceof Error ? error.message : "AI draft suggestion is unavailable.");
    } finally {
      setIsAiDrafting(false);
    }
  }

  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
      event.preventDefault();
      void handleSubmit();
    }
  }

  return (
    <div className="mx-auto max-w-6xl p-4 sm:p-6">
      <div className="spotlight-ring glass-panel rounded-[30px] p-4 sm:p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-gray-500">
              <Plus size={14} />
              Compose update
            </p>
            <p className="mt-2 max-w-2xl text-sm leading-7 text-gray-300">{helperLabel}</p>
          </div>

          <button
            onClick={() => {
              if (!allowsAnonymous || isRoomArchived) {
                return;
              }
              setIsAnonymous((current) => !current);
            }}
            disabled={!allowsAnonymous || isRoomArchived}
            className={cn(
              "inline-flex items-center justify-center gap-2 self-start rounded-2xl border px-4 py-2 text-sm transition disabled:cursor-not-allowed disabled:opacity-60",
              isAnonymous ? "border-brand-400/40 bg-brand-500/10 text-brand-100" : "border-white/10 bg-white/5 text-gray-300"
            )}
          >
            {isAnonymous ? <EyeOff size={14} /> : <Eye size={14} />}
            {!allowsAnonymous ? "Anonymous disabled in this room" : isAnonymous ? "Anonymous mode" : "Visible identity"}
          </button>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <div className="relative">
            <button
              onClick={() => setShowTypes((current) => !current)}
              className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white"
            >
              {(() => {
                const SelectedTypeIcon = getPostTypeIcon(selectedType.value);
                return <SelectedTypeIcon size={16} />;
              })()}
              {selectedType.label}
              <ChevronDown size={14} />
            </button>

            {showTypes ? (
              <div className="absolute left-0 top-full z-20 mt-2 max-h-72 min-w-[240px] overflow-y-auto rounded-2xl border border-white/10 bg-gray-900 p-2 shadow-2xl">
                {availablePostTypes.map((type) => (
                  <button
                    key={type.value}
                    onClick={() => {
                      setPostType(type.value);
                      setShowTypes(false);
                    }}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm text-gray-200 transition hover:bg-white/5"
                  >
                    {(() => {
                      const TypeIcon = getPostTypeIcon(type.value);
                      return <TypeIcon size={16} />;
                    })()}
                    <span>{type.label}</span>
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          <div className="panel-chip text-gray-300">{selectedType.label} format selected</div>
          {canPostAnnouncement ? <div className="panel-chip text-brand-100">Announcement access enabled</div> : null}
          {!allowsAnonymous ? <div className="panel-chip text-amber-100">Anonymous posting disabled by room policy</div> : null}
          {isRoomArchived ? <div className="panel-chip text-red-200">Archived rooms are read-only</div> : null}
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <div className="panel-chip rounded-2xl px-4 py-2 text-gray-300">
            <Sparkles size={14} />
            Mentions
          </div>
          {mentionableNames.map((mention) => (
            <button
              key={mention}
              type="button"
              onClick={() => insertMention(mention)}
              className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-gray-200 transition hover:bg-white/10"
            >
              {mention}
            </button>
          ))}
          <button
            type="button"
            onClick={() => void handleAiDraft()}
            disabled={isAiDrafting || !(room?.aiEnabled ?? false)}
            className="rounded-full border border-[rgba(154,140,255,0.24)] bg-[rgba(154,140,255,0.1)] px-3 py-1.5 text-xs text-[var(--app-text-soft)] transition hover:bg-[rgba(154,140,255,0.16)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isAiDrafting ? "Drafting..." : "Draft with AI"}
          </button>
        </div>

        {postType === "deadline" ? (
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <input
              value={deadlineTitle}
              onChange={(event) => setDeadlineTitle(event.target.value)}
              placeholder="Assignment title"
              className="app-input"
            />
            <input
              type="datetime-local"
              value={deadlineDate}
              onChange={(event) => setDeadlineDate(event.target.value)}
              className="app-input"
            />
          </div>
        ) : null}

        {postType === "resource" ? (
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <input
              value={resourceUrl}
              onChange={(event) => setResourceUrl(event.target.value)}
              placeholder="https://resource-link"
              className="app-input"
            />
            <input
              value={resourceTitle}
              onChange={(event) => setResourceTitle(event.target.value)}
              placeholder="Resource title"
              className="app-input"
            />
          </div>
        ) : null}

        {postType === "poll" ? (
          <div className="mt-4">
            <textarea
              value={pollOptions}
              onChange={(event) => setPollOptions(event.target.value)}
              rows={4}
              className="app-textarea"
              placeholder={"Option 1\nOption 2\nOption 3"}
            />
            <p className="mt-2 text-xs text-gray-500">Each option should be on its own line. Polls use the post vote controls for room feedback.</p>
          </div>
        ) : null}

        <div className="mt-4 grid gap-3 md:grid-cols-[minmax(0,1fr)_auto]">
          <div>
            <label className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
              <Tags size={13} />
              Tags
            </label>
            <input
              value={tagInput}
              onChange={(event) => setTagInput(event.target.value)}
              placeholder="revision, urgent, architecture"
              className="app-input"
            />
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-xs leading-6 text-gray-400">
            Use comma-separated tags.
            <br />
            Mention teammates or {ROOM_MENTION_AI} directly in the post body.
          </div>
        </div>

        <div className="mt-4 rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.01))] p-1">
          <textarea
            value={content}
            onChange={(event) => setContent(event.target.value)}
            onKeyDown={onKeyDown}
            maxLength={1000}
            rows={4}
            placeholder="Share something useful with the room..."
            className="min-h-[140px] w-full rounded-[24px] border border-transparent bg-black/15 px-5 py-4 text-sm leading-7 text-white outline-none transition focus:border-brand-400"
          />
        </div>

        {submitError ? <p className="mt-3 text-sm text-red-300">{submitError}</p> : null}
        {aiDraftStatus ? <p className="mt-3 text-sm text-[var(--app-text-muted)]">{aiDraftStatus}</p> : null}

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <span className="text-xs text-gray-500">{content.length}/1000 • Press Ctrl/Cmd + Enter to post</span>
          <button
            onClick={() => void handleSubmit()}
            disabled={!content.trim() || isSubmitting || isRoomArchived}
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
