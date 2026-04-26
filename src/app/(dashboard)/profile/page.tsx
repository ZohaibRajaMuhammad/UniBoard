"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { PostCard } from "@/components/feed/PostCard";
import { useCurrentUser } from "@/hooks/useCurrentUser";

export default function ProfilePage() {
  const user = useCurrentUser();
  const savedPosts = useQuery(api.posts.getSavedPosts);

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-6">
      <div className="mx-auto max-w-4xl">
        <div className="glass-panel rounded-[28px] p-6">
          <h1 className="text-3xl font-bold">Profile</h1>
          <p className="mt-2 text-sm text-gray-400">Your application identity as synchronized from Clerk into Convex.</p>
          {user ? (
            <dl className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <dt className="text-xs uppercase tracking-[0.2em] text-gray-500">Name</dt>
                <dd className="mt-2 text-lg font-semibold">{user.name}</dd>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <dt className="text-xs uppercase tracking-[0.2em] text-gray-500">Email</dt>
                <dd className="mt-2 text-lg font-semibold">{user.email}</dd>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <dt className="text-xs uppercase tracking-[0.2em] text-gray-500">Role</dt>
                <dd className="mt-2 text-lg font-semibold">{user.role}</dd>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <dt className="text-xs uppercase tracking-[0.2em] text-gray-500">Batch</dt>
                <dd className="mt-2 text-lg font-semibold">{user.batch ?? "Not set"}</dd>
              </div>
            </dl>
          ) : (
            <div className="mt-6 text-sm text-gray-500">Loading profile...</div>
          )}
        </div>

        <div className="mt-6 glass-panel rounded-[28px] p-6">
          <h2 className="text-2xl font-bold text-white">Saved posts</h2>
          <p className="mt-2 text-sm text-gray-400">Posts you bookmarked for later review.</p>
          <div className="mt-6 space-y-4">
            {savedPosts === undefined ? (
              Array.from({ length: 2 }).map((_, index) => <div key={index} className="h-32 animate-pulse rounded-[24px] bg-white/5" />)
            ) : savedPosts.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-gray-500">No saved posts yet.</div>
            ) : (
              savedPosts.map((post) => <PostCard key={post._id} post={post} roomId={post.roomId} />)
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
