"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { BookOpen, Search, Sparkles } from "lucide-react";
import { postAi } from "@/lib/ai/client";
import type { AiEnvelope, KnowledgeAnswer } from "@/lib/ai/contracts";

export default function KnowledgeBasePage() {
  const [draftQuestion, setDraftQuestion] = useState("");
  const [submittedQuestion, setSubmittedQuestion] = useState<string | null>(null);
  const [result, setResult] = useState<AiEnvelope<KnowledgeAnswer> | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  async function runQuestion(question: string) {
    setIsLoading(true);
    setError("");
    setSubmittedQuestion(question);

    try {
      const payload = await postAi<KnowledgeAnswer>("/api/v1/ai/knowledge/query", { question });
      setResult(payload);
    } catch (requestError) {
      setResult(null);
      setError(requestError instanceof Error ? requestError.message : "Unable to answer this question.");
    } finally {
      setIsLoading(false);
    }
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!draftQuestion.trim()) {
      return;
    }
    void runQuestion(draftQuestion.trim());
  }

  return (
    <div className="app-scroll">
      <div className="page-wrap page-stack content-column">
        <section className="spotlight-ring glass-panel page-hero ai-glow">
          <div className="max-w-3xl">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05]">
              <BookOpen size={20} className="text-[var(--app-primary-strong)]" />
            </div>
            <p className="section-eyebrow text-[var(--app-violet)]">Knowledge Base</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-white">Grounded course answers, not chat noise.</h1>
            <p className="mt-2 text-sm leading-7 text-[var(--app-text-soft)]">
              Ask a study question over the rooms you can access and inspect the grounded evidence before trusting the answer.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mt-6">
            <div className="flex items-center gap-3 rounded-[24px] border border-[var(--app-line)] bg-white/[0.04] px-4 py-4">
              <Search size={18} className="text-[var(--app-text-muted)]" />
              <input
                value={draftQuestion}
                onChange={(event) => setDraftQuestion(event.target.value)}
                placeholder="Ask about an assignment, concept, room decision, or resource..."
                className="w-full bg-transparent text-sm text-white outline-none placeholder:text-[var(--app-text-muted)]"
              />
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {["What changed in the database design?", "Which deadline is closest?", "Where was normalization explained?"].map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => {
                    setDraftQuestion(prompt);
                    void runQuestion(prompt);
                  }}
                  className="panel-chip rounded-2xl px-4 py-2 text-sm"
                >
                  <Sparkles size={12} />
                  {prompt}
                </button>
              ))}
            </div>
          </form>
        </section>

        {error ? (
          <section className="glass-panel rounded-[28px] border border-red-400/20 p-5 text-sm text-red-100">
            {error}
          </section>
        ) : null}

        {submittedQuestion ? (
          <section className="glass-panel rounded-[28px] p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-[var(--app-text-muted)]">Generated answer</p>
                <h2 className="mt-2 text-2xl font-semibold text-white">{submittedQuestion}</h2>
              </div>
              {result ? (
                <span
                  className={
                    result.data?.confidenceBand === "high"
                      ? "rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-medium text-emerald-100"
                      : result.data?.confidenceBand === "medium"
                        ? "rounded-full bg-amber-500/15 px-3 py-1 text-xs font-medium text-amber-100"
                        : "rounded-full bg-red-500/15 px-3 py-1 text-xs font-medium text-red-100"
                  }
                >
                  {result.meta.mode === "openai"
                    ? result.data?.confidenceBand === "high"
                      ? "Grounded answer"
                      : "Grounded with caution"
                    : "Fallback mode"}
                </span>
              ) : (
                <span className="rounded-full bg-white/5 px-3 py-1 text-xs text-[var(--app-text-muted)]">Answering...</span>
              )}
            </div>

            <div className="mt-5 rounded-[24px] border border-[var(--app-line)] bg-black/20 p-5">
              {isLoading ? (
                <div className="h-32 animate-pulse rounded-[20px] bg-white/5" />
              ) : (
                <div className="space-y-3">
                  <p className="whitespace-pre-wrap text-sm leading-8 text-[var(--app-text-soft)]">{result?.data?.answer}</p>
                  {result?.data?.followUp ? (
                    <p className="text-sm text-[var(--app-text-muted)]">Next best prompt: {result.data.followUp}</p>
                  ) : null}
                </div>
              )}
            </div>

            {result?.data?.sources.length ? (
              <div className="mt-5">
                <p className="text-xs uppercase tracking-[0.2em] text-[var(--app-text-muted)]">Sources</p>
                <div className="mt-3 flex flex-wrap gap-3">
                  {result.data.sources.map((source) => (
                    <Link
                      key={source.postId}
                      href={`/rooms/${source.roomId}?post=${source.postId}`}
                      className="rounded-2xl border border-[var(--app-line)] bg-white/5 px-4 py-3 text-sm text-[var(--app-text-soft)] transition hover:bg-white/10"
                    >
                      <span className="font-medium text-white">{source.roomName}</span>
                      <span className="ml-2 text-[var(--app-text-muted)]">{source.title}</span>
                      <span className="mt-2 block text-xs text-[var(--app-text-muted)]">{source.quote}</span>
                    </Link>
                  ))}
                </div>
              </div>
            ) : null}
          </section>
        ) : null}
      </div>
    </div>
  );
}
