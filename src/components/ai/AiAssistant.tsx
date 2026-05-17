"use client";

import { FormEvent, KeyboardEvent, useEffect, useRef, useState } from "react";
import { Bot, Loader2, Send, Sparkles, X } from "lucide-react";
import { postAi } from "@/lib/ai/client";
import type { AiEnvelope, AssistantReply } from "@/lib/ai/contracts";
import { cn } from "@/lib/utils";

type Message = {
  id: string;
  role: "assistant" | "user";
  text: string;
  confidenceBand?: "low" | "medium" | "high";
  degraded?: boolean;
};

const quickActions = [
  "Summarize what needs attention this week",
  "What should I study next?",
  "Find the most urgent upcoming deadline"
];

export function AiAssistant() {
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
          degraded: payload.meta.mode !== "openai"
        }
      ]);
      setStatus("idle");
    } catch (requestError) {
      const messageText =
        requestError instanceof Error ? requestError.message : "The AI assistant is temporarily unavailable.";
      setError(messageText);
      setStatus(messageText.toLowerCase().includes("timeout") ? "timeout" : "unavailable");
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

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="ai-pulse fixed bottom-6 right-4 z-40 hidden min-h-[52px] min-w-[52px] items-center gap-3 rounded-full border border-[rgba(154,140,255,0.24)] bg-[linear-gradient(135deg,rgba(77,117,255,0.92),rgba(110,85,255,0.92))] px-4 py-3 text-sm font-semibold text-white shadow-[0_18px_42px_rgba(30,38,88,0.42)] transition hover:-translate-y-0.5 md:flex"
        aria-expanded={open}
        aria-controls="ai-assistant-panel"
      >
        <Bot size={18} />
        <span className="hidden lg:inline">AI Assistant</span>
      </button>

      <button
        type="button"
        onClick={() => setOpen(true)}
        className="ai-pulse fixed bottom-24 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full border border-[rgba(154,140,255,0.24)] bg-[linear-gradient(135deg,rgba(77,117,255,0.92),rgba(110,85,255,0.92))] text-white shadow-[0_18px_42px_rgba(30,38,88,0.42)] md:hidden"
        aria-label="Open AI assistant"
      >
        <Bot size={20} />
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-end justify-end bg-[rgba(3,7,12,0.4)] p-3 backdrop-blur-sm md:items-end md:justify-end md:bg-transparent md:p-4">
          <section
            id="ai-assistant-panel"
            className="ai-glow glass-panel flex h-[min(82dvh,44rem)] w-full max-w-[24rem] flex-col overflow-hidden rounded-[28px] md:h-[38rem]"
          >
            <header className="flex items-center justify-between border-b border-white/10 px-5 py-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                  <p className="text-sm font-semibold text-white">Academic Copilot</p>
                </div>
                <p className="mt-1 text-xs text-[var(--app-text-muted)]">
                  Grounded guidance only. Low-confidence answers are labeled.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="touch-target rounded-2xl border border-white/10 bg-white/5 p-2 text-[var(--app-text-muted)] transition hover:bg-white/10 hover:text-white"
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

            <div ref={scrollerRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
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
                      {message.degraded ? <span>fallback mode</span> : null}
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
                <div className="rounded-[22px] border border-red-400/25 bg-red-500/10 px-4 py-3 text-sm text-red-100">
                  {error}
                </div>
              ) : null}
            </div>

            <form onSubmit={handleSubmit} className="border-t border-white/10 px-4 py-4">
              <div className="rounded-[24px] border border-white/10 bg-[rgba(255,255,255,0.03)] p-2">
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
          </section>
        </div>
      ) : null}
    </>
  );
}
