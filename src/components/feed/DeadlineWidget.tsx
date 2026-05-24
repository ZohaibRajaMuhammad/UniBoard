import Link from "next/link";
import type { Doc } from "../../../convex/_generated/dataModel";
import { formatDeadline } from "@/lib/utils";

export function DeadlineWidget({ post }: { post: Doc<"posts"> }) {
  return (
    <Link href={`/rooms/${post.roomId}`} className="glass-panel min-w-[260px] rounded-[28px] p-5 transition hover:border-red-400/30">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--app-danger)]">Deadline</p>
      <h3 className="mt-3 text-lg font-semibold text-white">{post.deadlineTitle ?? "Upcoming milestone"}</h3>
      <p className="mt-2 line-clamp-2 text-sm text-[var(--app-text-muted)]">{post.content}</p>
      <p className="mt-4 text-sm text-[var(--app-danger)]">{formatDeadline(post.deadlineDate)}</p>
    </Link>
  );
}
