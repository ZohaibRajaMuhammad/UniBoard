import { AlertTriangle, ArrowRight, Pin } from "lucide-react";
import type { Doc } from "../../../convex/_generated/dataModel";

export function PinnedPostsBanner({ posts }: { posts: Doc<"posts">[] }) {
  const primary = posts[0];
  const remaining = posts.slice(1, 4);

  return (
    <div className="py-4">
      <div className="alert-surface overflow-hidden px-5 py-5 transition-all duration-300 sm:px-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl">
            <div className="flex items-center gap-3 text-amber-700 dark:text-amber-200">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-amber-400/25 bg-amber-500/12">
                <AlertTriangle size={18} />
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em]">Pinned focus</p>
                <h3 className="mt-1 text-xl font-semibold text-[var(--app-text)] dark:text-white">High-priority room guidance</h3>
              </div>
            </div>
            <div className="mt-4 rounded-[24px] border border-amber-400/20 bg-white/70 px-4 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.35)] dark:bg-white/[0.03]">
              <div className="flex items-start gap-3">
                <Pin size={16} className="mt-1 shrink-0 text-amber-600 dark:text-amber-300" />
                <p className="text-sm leading-7 text-[var(--app-text-soft)] dark:text-amber-50">
                  {primary?.content ?? "No pinned focus is currently active for this room."}
                </p>
              </div>
            </div>
          </div>

          <div className="min-w-0 lg:w-[20rem]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-amber-700/80 dark:text-amber-200/80">Additional pinned signal</p>
            <div className="mt-3 space-y-2">
              {remaining.length === 0 ? (
                <div className="rounded-[20px] border border-dashed border-amber-400/20 bg-white/55 px-4 py-3 text-sm text-[var(--app-text-muted)] dark:bg-white/[0.03]">
                  No other pinned notes right now.
                </div>
              ) : (
                remaining.map((post) => (
                  <div key={post._id} className="rounded-[20px] border border-amber-400/16 bg-white/60 px-4 py-3 dark:bg-white/[0.03]">
                    <div className="flex items-start gap-2">
                      <ArrowRight size={14} className="mt-1 shrink-0 text-amber-600 dark:text-amber-300" />
                      <p className="text-sm leading-6 text-[var(--app-text-soft)] dark:text-amber-50">{post.content}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
