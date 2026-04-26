import { Pin } from "lucide-react";
import type { Doc } from "../../../convex/_generated/dataModel";

export function PinnedPostsBanner({ posts }: { posts: Doc<"posts">[] }) {
  return (
    <div className="border-b border-amber-400/20 bg-[linear-gradient(180deg,rgba(245,158,11,0.10),rgba(245,158,11,0.03))] px-4 py-4 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <div className="flex items-center gap-2 text-amber-200">
          <Pin size={14} />
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em]">Pinned focus</p>
        </div>

        <div className="mt-3 flex snap-x gap-3 overflow-x-auto pb-1">
          {posts.map((post) => (
            <div key={post._id} className="min-w-[260px] max-w-sm rounded-[24px] border border-amber-400/20 bg-black/15 p-4 text-sm text-amber-50">
              <p className="line-clamp-3 leading-7">{post.content}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
