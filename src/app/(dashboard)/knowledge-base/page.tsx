"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { BookOpen, Compass, LibraryBig, Search, ShieldCheck, Sparkles } from "lucide-react";
import { postAi } from "@/lib/ai/client";
import type { AiEnvelope, KnowledgeAnswer } from "@/lib/ai/contracts";
import { cn } from "@/lib/utils";

const promptSuggestions = [
  "What changed in the database design?",
  "Which deadline is closest?",
  "Where was normalization explained?",
  "Which room discussed API authentication tradeoffs?"
];

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
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(18rem,0.8fr)]">
            <div className="max-w-3xl">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05]">
                <BookOpen size={20} className="text-[var(--app-primary-strong)]" />
              </div>
              <p className="section-eyebrow text-[var(--app-violet)]">Knowledge Base</p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight text-white">The central intelligence surface for Uniboard.</h1>
              <p className="mt-3 text-sm leading-7 text-[var(--app-text-soft)]">
                Ask grounded questions across your authorized rooms, inspect supporting evidence, and move from answer to action without leaving the knowledge layer.
              </p>

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
                  {promptSuggestions.map((prompt) => (
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
            </div>

            <div className="grid gap-3">
              <div className="rounded-[26px] border border-[var(--app-line)] bg-white/5 p-4">
                <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--app-text-muted)]">
                  <LibraryBig size={14} />
                  Knowledge posture
                </div>
                <p className="mt-3 text-sm leading-7 text-[var(--app-text-soft)]">
                  Answers should be concise, evidence-backed, and source-aware. When confidence is low, the system should abstain clearly instead of improvising.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                <div className="rounded-[24px] border border-[var(--app-line)] bg-white/5 p-4">
                  <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--app-text-muted)]">
                    <ShieldCheck size={14} />
                    Grounding
                  </div>
                  <p className="mt-3 text-sm leading-7 text-[var(--app-text-soft)]">Sources are tied back to visible room material before the answer is trusted.</p>
                </div>
                <div className="rounded-[24px] border border-[var(--app-line)] bg-white/5 p-4">
                  <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--app-text-muted)]">
                    <Compass size={14} />
                    Navigation
                  </div>
                  <p className="mt-3 text-sm leading-7 text-[var(--app-text-soft)]">Each answer should make the next action obvious: inspect, refine, or jump into the room thread.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {error ? (
          <section className="glass-panel rounded-[28px] border border-red-400/20 p-5 text-sm text-[var(--app-text)]">
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
                    result.data?.abstained || (result.data?.sources.length ?? 0) === 0
                      ? "rounded-full bg-amber-500/15 px-3 py-1 text-xs font-medium text-[var(--app-text)]"
                      : result.data?.confidenceBand === "high"
                      ? "rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-medium text-[var(--app-text)]"
                      : result.data?.confidenceBand === "medium"
                        ? "rounded-full bg-amber-500/15 px-3 py-1 text-xs font-medium text-[var(--app-text)]"
                        : "rounded-full bg-red-500/15 px-3 py-1 text-xs font-medium text-[var(--app-text)]"
                  }
                >
                  {result.data?.confidenceBand === "high"
                    ? "Grounded answer"
                    : result.data?.confidenceBand === "medium"
                      ? "Grounded with caution"
                      : "Low-confidence answer"}
                </span>
              ) : (
                <span className="rounded-full bg-white/5 px-3 py-1 text-xs text-[var(--app-text-muted)]">Answering...</span>
              )}
            </div>

            <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(18rem,0.8fr)]">
              <div className="rounded-[24px] border border-[var(--app-line)] bg-black/20 p-5">
                {isLoading ? (
                  <div className="h-32 animate-pulse rounded-[20px] bg-white/5" />
                ) : (
                  <div className="space-y-4">
                    {result?.data && (result.data.sources.length ?? 0) > 0 ? (
                      <div className="rounded-[20px] border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-sm text-[var(--app-text-soft)]">
                        <p className="text-xs uppercase tracking-[0.2em] text-emerald-200">Correct option</p>
                        <p className="mt-2 leading-7 text-white">{result.data.answer}</p>
                      </div>
                    ) : result?.data?.answer ? (
                      <div className="rounded-[20px] border border-amber-400/20 bg-amber-500/10 px-4 py-3 text-sm text-[var(--app-text-soft)]">
                        <p className="text-xs uppercase tracking-[0.2em] text-amber-200">Best grounded option</p>
                        <p className="mt-2 leading-7 text-white">{result.data.answer}</p>
                      </div>
                    ) : result?.data?.abstained ? (
                      <div className="rounded-[20px] border border-amber-400/20 bg-amber-500/10 px-4 py-3 text-sm text-[var(--app-text-soft)]">
                        The answer is cautious, but it still points to visible room evidence below. Review the sources before using it as a final decision.
                      </div>
                    ) : null}
                    <p className="whitespace-pre-wrap text-sm leading-8 text-[var(--app-text-soft)]">{result?.data?.answer}</p>
                    {result?.data?.followUp ? (
                      <div className="rounded-[20px] border border-[var(--app-line)] bg-white/5 px-4 py-3 text-sm text-[var(--app-text-soft)]">
                        <span className="font-semibold text-white">Next best prompt:</span> {result.data.followUp}
                      </div>
                    ) : null}
                  </div>
                )}
              </div>

              <aside className="grid gap-4">
                <div className="rounded-[24px] border border-[var(--app-line)] bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-[var(--app-text-muted)]">Answer quality</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {["high", "medium", "low"].map((band) => (
                      <span
                        key={band}
                        className={cn(
                          "rounded-full px-3 py-1 text-xs font-medium uppercase tracking-[0.16em]",
                          result?.data?.confidenceBand === band
                            ? band === "high"
                              ? "bg-emerald-500/15 text-[var(--app-text)]"
                              : band === "medium"
                                ? "bg-amber-500/15 text-[var(--app-text)]"
                                : "bg-red-500/15 text-[var(--app-text)]"
                            : "bg-white/5 text-[var(--app-text-muted)]"
                        )}
                      >
                        {band}
                      </span>
                    ))}
                  </div>
                  <p className="mt-3 text-sm leading-7 text-[var(--app-text-soft)]">
                    Strong answers should cite visible evidence. Lower-confidence answers should prompt refinement rather than false certainty.
                  </p>
                </div>

                <div className="rounded-[24px] border border-[var(--app-line)] bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-[var(--app-text-muted)]">System behavior</p>
                <p className="mt-3 text-sm leading-7 text-[var(--app-text-soft)]">
                  {(result?.data?.sources.length ?? 0) === 0
                    ? "The system could not find enough visible room evidence yet. Add a clearer room, deadline, concept, or artifact to improve grounding."
                    : result?.data?.abstained
                      ? "The response stayed cautious, but the system still returned the strongest visible evidence it could find."
                      : "The response is optimized to stay concise, professional, and grounded in authorized room knowledge."}
                </p>
              </div>
            </aside>
          </div>

            {result?.data?.sources.length ? (
              <div className="mt-5">
                <p className="text-xs uppercase tracking-[0.2em] text-[var(--app-text-muted)]">Sources</p>
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  {result.data.sources.map((source, index) => (
                    <Link
                      key={source.postId}
                      href={`/rooms/${source.roomId}?post=${source.postId}`}
                      className={cn(
                        "rounded-[24px] border px-4 py-4 text-sm transition hover:bg-white/10",
                        index === 0
                          ? "border-emerald-400/20 bg-emerald-500/10 text-[var(--app-text-soft)]"
                          : "border-[var(--app-line)] bg-white/5 text-[var(--app-text-soft)]"
                      )}
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium text-white">{source.roomName}</span>
                        <span className="app-chip">{source.type}</span>
                        {index === 0 ? <span className="app-chip bg-emerald-500/15 text-emerald-100">Correct option</span> : null}
                      </div>
                      <span className="mt-3 block font-medium text-white">{source.title}</span>
                      <span className="mt-2 block text-xs leading-6 text-[var(--app-text-muted)]">{source.quote}</span>
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
