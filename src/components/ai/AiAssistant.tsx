"use client";

import { FormEvent, KeyboardEvent, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Bot, Loader2, MoveUpRight, Send, Sparkles, X } from "lucide-react";
import { useNotifier } from "@/components/providers/NotificationProvider";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { postAi } from "@/lib/ai/client";
import type { AiEnvelope, AssistantReply, KnowledgeSource } from "@/lib/ai/contracts";
import { cn } from "@/lib/utils";

type Message = {
  id: string;
  role: "assistant" | "user";
  text: string;
  confidenceBand?: "low" | "medium" | "high";
  degraded?: boolean;
  suggestions?: string[];
  sources?: KnowledgeSource[];
};

const quickActions = [
  "Summarize what needs attention this week",
  "What should I study next?",
  "Find the most urgent upcoming deadline"
];

export function AiAssistant() {
  const currentUser = useCurrentUser();
  const { notify, permission, requestPermission } = useNotifier();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      text: "I can answer grounded academic questions, summarize visible workspace signal, and help plan the next step.",
      confidenceBand: "medium"
    }
  ]);
  const [status, setStatus] = useState<"idle" | "sending" | "typing" | "timeout" | "unavailable">("idle");
  const [error, setError] = useState("");
  const scrollerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    scrollerRef.current?.scrollTo({ top: scrollerRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, open]);

  useEffect(() => {
    if (open && permission === "default") {
      void requestPermission();
    }
  }, [open, permission, requestPermission]);

  async function sendMessage(message: string) {
    const trimmed = message.trim();
    if (!trimmed) {
      return;
    }

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      text: trimmed
    };

    setMessages((current) => [...current, userMessage]);
    setDraft("");
    setStatus("sending");
    setError("");

    try {
      setStatus("typing");
      const payload = await postAi<AssistantReply>("/api/v1/ai/assistant", { message: trimmed });
      const reply = payload.data?.reply ?? "I could not produce a reliable answer from the current workspace signal.";
      setMessages((current) => [
        ...current,
        {
          id: `assistant-${payload.meta.requestId}`,
          role: "assistant",
          text: reply,
          confidenceBand: payload.data?.confidenceBand,
          degraded: payload.meta.mode !== "openai",
          suggestions: payload.data?.suggestions ?? [],
          sources: payload.data?.sources ?? []
        }
      ]);
      notify({
        title: "AI response ready",
        message: reply,
        tone: "ai",
        priority: "normal",
        tag: "assistant-reply"
      });
      setStatus("idle");
    } catch (requestError) {
      const messageText =
        requestError instanceof Error ? requestError.message : "The AI assistant is temporarily unavailable.";
      setError(messageText);
      setStatus(messageText.toLowerCase().includes("timeout") ? "timeout" : "unavailable");
      notify({
        title: "AI assistant unavailable",
        message: messageText,
        tone: "error",
        priority: "high",
        tag: "assistant-error"
      });
    }
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    void sendMessage(draft);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void sendMessage(draft);
    }
  }

  if (currentUser?.role === "pending") {
    return null;
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="fixed bottom-5 right-5 z-40 hidden min-h-[56px] items-center gap-3 rounded-full border border-[var(--app-line)] bg-[var(--app-panel-strong)] px-3 py-3 text-sm font-semibold text-white shadow-[0_22px_48px_rgba(9,16,28,0.26)] transition hover:-translate-y-0.5 md:flex"
        aria-expanded={open}
        aria-controls="ai-assistant-panel"
      >
        <span className="relative flex h-9 w-9 items-center justify-center rounded-full border border-[rgba(109,140,255,0.28)] bg-[rgba(77,117,255,0.14)] text-[var(--app-primary-strong)]">
          <Bot size={17} />
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--app-violet)] text-[8px] font-bold text-white">
            AI
          </span>
        </span>
        <span className="hidden min-w-0 lg:block">
          <span className="block text-left text-[11px] uppercase tracking-[0.18em] text-[var(--app-text-muted)]">Academic copilot</span>
          <span className="block text-left text-sm font-semibold text-white">Ask UniBoard AI</span>
        </span>
      </button>

      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-24 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full border border-[var(--app-line)] bg-[var(--app-panel-strong)] text-[var(--app-primary-strong)] shadow-[0_22px_48px_rgba(9,16,28,0.26)] md:hidden"
        aria-label="Open AI assistant"
      >
        <span className="relative flex h-10 w-10 items-center justify-center rounded-full border border-[rgba(109,140,255,0.28)] bg-[rgba(77,117,255,0.14)]">
          <Bot size={18} />
        </span>
      </button>

      <AnimatePresence>
        {open ? (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-end bg-[rgba(3,7,12,0.4)] p-3 backdrop-blur-sm md:items-end md:justify-end md:bg-transparent md:p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
        >
          <motion.section
            id="ai-assistant-panel"
            className="glass-panel flex h-[min(82dvh,44rem)] w-full max-w-[24rem] flex-col overflow-hidden rounded-[30px] border-[var(--app-line-strong)] shadow-[0_28px_80px_rgba(7,14,28,0.32)] md:h-[40rem] xl:max-w-[32rem]"
            initial={{ opacity: 0, y: 18, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 14, scale: 0.97 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          >
            <header className="flex items-center justify-between border-b border-white/10 px-5 py-4">
              <div className="flex min-w-0 items-center gap-3">
                <div className="relative flex h-11 w-11 items-center justify-center rounded-[18px] border border-[rgba(109,140,255,0.24)] bg-[rgba(77,117,255,0.14)] text-[var(--app-primary-strong)]">
                  <Bot size={18} />
                  <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full border border-[var(--app-line)] bg-[var(--app-panel-strong)] text-[9px] font-bold text-white">
                    AI
                  </span>
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                    <p className="text-sm font-semibold text-white">Academic Copilot</p>
                  </div>
                  <p className="mt-1 text-xs text-[var(--app-text-muted)]">
                    Grounded guidance only. Low-confidence answers are labeled.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="icon-frame touch-target transition hover:bg-white/10 hover:text-white"
                aria-label="Close AI assistant"
              >
                <X size={16} />
              </button>
            </header>

            <div className="border-b border-white/10 px-4 py-3">
              <div className="flex flex-wrap gap-2">
                {quickActions.map((action) => (
                  <button
                    key={action}
                    type="button"
                    onClick={() => void sendMessage(action)}
                    className="panel-chip rounded-2xl px-3 py-2 text-left text-xs"
                  >
                    <Sparkles size={12} />
                    {action}
                  </button>
                ))}
              </div>
            </div>

            <div ref={scrollerRef} className="app-scroll flex-1 space-y-3 px-4 py-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "max-w-[92%] rounded-[22px] border px-4 py-3 text-sm leading-6",
                    message.role === "assistant"
                      ? "border-white/10 bg-white/5 text-[var(--app-text-soft)]"
                      : "ml-auto border-[rgba(104,139,255,0.28)] bg-[rgba(77,117,255,0.16)] text-white"
                  )}
                >
                  <p>{message.text}</p>
                  {message.role === "assistant" && message.confidenceBand ? (
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-[var(--app-text-muted)]">
                      <span>{message.confidenceBand} confidence</span>
                      {message.degraded ? <span>live context mode</span> : null}
                    </div>
                  ) : null}
                  {message.role === "assistant" && (message.suggestions?.length ?? 0) > 0 ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {message.suggestions?.slice(0, 2).map((suggestion) => (
                        <button
                          key={suggestion}
                          type="button"
                          onClick={() => void sendMessage(suggestion)}
                          className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-[var(--app-text-soft)] transition hover:bg-white/10"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  ) : null}
                  {message.role === "assistant" && (message.sources?.length ?? 0) > 0 ? (
                    <div className="mt-3 grid gap-2">
                      {message.sources?.slice(0, 2).map((source) => (
                        <Link
                          key={`${message.id}-${source.postId}`}
                          href={`/rooms/${source.roomId}?post=${source.postId}`}
                          className="rounded-[18px] border border-white/10 bg-black/15 px-3 py-2 text-xs leading-5 text-[var(--app-text-soft)] transition hover:bg-white/10"
                        >
                          <span className="flex items-center justify-between gap-2 text-white">
                            <span className="truncate">{source.roomName}</span>
                            <MoveUpRight size={12} />
                          </span>
                          <span className="mt-1 block truncate text-[var(--app-text-muted)]">{source.title}</span>
                        </Link>
                      ))}
                    </div>
                  ) : null}
                </div>
              ))}

              {status === "typing" ? (
                <div className="max-w-[92%] rounded-[22px] border border-white/10 bg-white/5 px-4 py-3 text-sm text-[var(--app-text-muted)]">
                  <div className="flex items-center gap-2">
                    <Loader2 size={14} className="animate-spin" />
                    Thinking over accessible workspace context...
                  </div>
                </div>
              ) : null}

              {error ? (
                <div className="rounded-[22px] border border-red-400/25 bg-red-500/10 px-4 py-3 text-sm text-[var(--app-text)]">
                  {error}
                </div>
              ) : null}
            </div>

            <form onSubmit={handleSubmit} className="border-t border-white/10 px-4 py-4">
              <div className="rounded-[26px] border border-white/10 bg-white/[0.03] p-2">
                <textarea
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  onKeyDown={handleKeyDown}
                  rows={3}
                  placeholder="Ask for a grounded explanation, summary, or next action..."
                  className="min-h-[88px] w-full resize-none rounded-[18px] bg-transparent px-3 py-2 text-sm text-white outline-none placeholder:text-[var(--app-text-muted)]"
                />
                <div className="flex items-center justify-between gap-3 px-2 pb-1">
                  <p className="text-xs text-[var(--app-text-muted)]">
                    {status === "timeout"
                      ? "Request timed out"
                      : status === "unavailable"
                        ? "Assistant unavailable"
                        : "Press Enter to send. Use Shift+Enter for a new line."}
                  </p>
                  <button
                    type="submit"
                    disabled={!draft.trim() || status === "sending" || status === "typing"}
                    className="app-button app-button-primary min-h-[44px] rounded-2xl px-4 py-2 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Send size={14} />
                    Send
                  </button>
                </div>
              </div>
            </form>
          </motion.section>
        </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
