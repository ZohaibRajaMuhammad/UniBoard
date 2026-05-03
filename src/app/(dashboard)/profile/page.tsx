"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { PostCard } from "@/components/feed/PostCard";
import { useCurrentUser } from "@/hooks/useCurrentUser";

export default function ProfilePage() {
  const user = useCurrentUser();
  const savedPosts = useQuery(api.posts.getSavedPosts);
  const updateProfile = useMutation(api.users.updateProfile);
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState("");
  const [form, setForm] = useState({
    name: "",
    bio: "",
    department: "",
    studentId: ""
  });

  useEffect(() => {
    if (!user) {
      return;
    }

    setForm({
      name: user.name ?? "",
      bio: user.bio ?? "",
      department: user.department ?? "",
      studentId: user.studentId ?? ""
    });
  }, [user]);

  async function handleSave() {
    setIsSaving(true);
    setStatus("");
    try {
      await updateProfile({
        name: form.name,
        bio: form.bio,
        department: form.department,
        studentId: form.studentId
      });
      setStatus("Profile updated.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Unable to update profile.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="app-scroll">
      <div className="page-wrap page-stack">
        <div className="glass-panel rounded-[28px] p-6">
          <h1 className="text-3xl font-bold">Profile</h1>
          <p className="mt-2 text-sm text-gray-400">Edit your academic identity, keep your details current, and review saved content below.</p>

          {user ? (
            <div className="mt-6 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
              <div className="space-y-4">
                <Field label="Name">
                  <input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} className="app-input" />
                </Field>
                <Field label="Bio">
                  <textarea value={form.bio} onChange={(event) => setForm((current) => ({ ...current, bio: event.target.value }))} className="app-textarea min-h-[8rem]" />
                </Field>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Department">
                    <input value={form.department} onChange={(event) => setForm((current) => ({ ...current, department: event.target.value }))} className="app-input" />
                  </Field>
                  <Field label="Student ID">
                    <input value={form.studentId} onChange={(event) => setForm((current) => ({ ...current, studentId: event.target.value }))} className="app-input" />
                  </Field>
                </div>
                {status ? <p className="text-sm text-gray-300">{status}</p> : null}
                <button onClick={() => void handleSave()} disabled={isSaving} className="app-button app-button-primary w-full sm:w-auto">
                  {isSaving ? "Saving..." : "Save profile"}
                </button>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
                <InfoCard label="Email" value={user.email} />
                <InfoCard label="Role" value={user.role} />
                <InfoCard label="Batch" value={user.batch ?? "Not set"} />
                <InfoCard label="Badges" value={user.badges?.join(", ") || "None yet"} />
              </div>
            </div>
          ) : (
            <div className="mt-6 text-sm text-gray-500">Loading profile...</div>
          )}
        </div>

        <div className="glass-panel rounded-[28px] p-6">
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-semibold text-gray-200">{label}</span>
      {children}
    </label>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
      <p className="text-xs uppercase tracking-[0.2em] text-gray-500">{label}</p>
      <p className="mt-2 text-lg font-semibold text-white">{value}</p>
    </div>
  );
}
