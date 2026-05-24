"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { BookOpenCheck, GraduationCap, UserCircle2 } from "lucide-react";
import { api } from "../../../../convex/_generated/api";
import { PostCard } from "@/components/feed/PostCard";
import { ProfileAvatar } from "@/components/ui/ProfileAvatar";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { BATCHES, DEPARTMENTS } from "@/lib/constants";

export default function ProfilePage() {
  const user = useCurrentUser();
  const savedPosts = useQuery(api.posts.getSavedPosts);
  const updateProfile = useMutation(api.users.updateProfile);
  const completeOnboarding = useMutation(api.users.completeOnboarding);
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmittingAccess, setIsSubmittingAccess] = useState(false);
  const [status, setStatus] = useState("");
  const [form, setForm] = useState<{
    name: string;
    bio: string;
    batch: string;
    department: string;
    studentId: string;
  }>({
    name: "",
    bio: "",
    batch: BATCHES[0],
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
      batch: user.batch ?? BATCHES[0],
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
        batch: form.batch,
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

  async function handleAccessSetup(role: "student" | "teacher") {
    setIsSubmittingAccess(true);
    setStatus("");
    try {
      await completeOnboarding({
        role,
        batch: form.batch,
        department: form.department || undefined,
        studentId: form.studentId || undefined,
        bio: form.bio || undefined
      });
      setStatus(role === "teacher" ? "Teacher access request submitted for super-admin review." : "Student access activated.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Unable to update access.");
    } finally {
      setIsSubmittingAccess(false);
    }
  }

  return (
    <div className="app-scroll">
      <div className="page-wrap page-stack shell-content-column">
        <section className="spotlight-ring glass-panel page-hero">
          <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
            <div>
              <p className="section-eyebrow text-[var(--app-primary-strong)]">Profile</p>
              <div className="mt-3 flex items-center gap-4">
                <div className="relative">
                  <ProfileAvatar name={user?.name ?? "UniBoard User"} imageUrl={user?.imageUrl ?? null} size="lg" />
                  <div className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full border border-[var(--app-line)] bg-[var(--app-panel-strong)] text-[var(--app-primary-strong)] shadow-[0_10px_24px_rgba(9,16,28,0.2)]">
                    <UserCircle2 size={14} />
                  </div>
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-[var(--app-text)]">{user?.name ?? "Loading profile..."}</h1>
                  <p className="mt-1 text-sm text-[var(--app-text-muted)]">{user?.email ?? " "}</p>
                </div>
              </div>
              <p className="mt-5 max-w-2xl text-sm leading-7 text-[var(--app-text-soft)]">
                Represent your academic identity clearly, keep your details current, and maintain a profile that feels professional rather than social.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
              <InfoCard label="Role" value={user?.role ?? "Loading"} />
              <InfoCard label="Batch" value={user?.batch ?? "Not set"} />
              <InfoCard label="Department" value={user?.department ?? "Not set"} />
            </div>
          </div>
        </section>

        <section className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="glass-panel rounded-[28px] p-6">
            <h2 className="text-2xl font-semibold text-[var(--app-text)]">Profile details</h2>
            <p className="mt-2 text-sm text-[var(--app-text-muted)]">Keep editable identity fields explicit and easy to review.</p>

            {user ? (
              <div className="mt-6 space-y-4">
                {user.role === "pending" ? (
                  <div className="rounded-[24px] border border-[rgba(109,140,255,0.24)] bg-[rgba(77,117,255,0.08)] p-5">
                    <div className="flex items-start gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[rgba(109,140,255,0.25)] bg-[rgba(77,117,255,0.1)] text-[var(--app-primary-strong)]">
                        <GraduationCap size={18} />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-[var(--app-text)]">Finish access setup</h3>
                        <p className="mt-2 text-sm leading-7 text-[var(--app-text-soft)]">
                          Students can activate access immediately. Teacher access is reviewed by a super admin before elevated workspace controls are unlocked.
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <Field label="Batch">
                        <select
                          value={form.batch}
                          onChange={(event) => setForm((current) => ({ ...current, batch: event.target.value }))}
                          className="app-select"
                        >
                          {BATCHES.map((batch) => (
                            <option key={batch} value={batch}>
                              {batch}
                            </option>
                          ))}
                        </select>
                      </Field>
                      <Field label="Department">
                        <select
                          value={form.department}
                          onChange={(event) => setForm((current) => ({ ...current, department: event.target.value }))}
                          className="app-select"
                        >
                          <option value="">Select department</option>
                          {DEPARTMENTS.map((department) => (
                            <option key={department} value={department}>
                              {department}
                            </option>
                          ))}
                        </select>
                      </Field>
                    </div>
                    <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                      <button
                        onClick={() => void handleAccessSetup("student")}
                        disabled={isSubmittingAccess}
                        className="app-button app-button-primary w-full sm:w-auto"
                      >
                        Continue as student
                      </button>
                      <button
                        onClick={() => void handleAccessSetup("teacher")}
                        disabled={isSubmittingAccess}
                        className="app-button app-button-secondary w-full sm:w-auto"
                      >
                        Request teacher access
                      </button>
                    </div>
                  </div>
                ) : null}
                <Field label="Name">
                  <input
                    value={form.name}
                    onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                    className="app-input"
                  />
                </Field>
                <Field label="Bio">
                  <textarea
                    value={form.bio}
                    onChange={(event) => setForm((current) => ({ ...current, bio: event.target.value }))}
                    className="app-textarea min-h-[8rem]"
                  />
                </Field>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Batch">
                    <select
                      value={form.batch}
                      onChange={(event) => setForm((current) => ({ ...current, batch: event.target.value }))}
                      className="app-select"
                    >
                      {BATCHES.map((batch) => (
                        <option key={batch} value={batch}>
                          {batch}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Department">
                    <input
                      value={form.department}
                      onChange={(event) => setForm((current) => ({ ...current, department: event.target.value }))}
                      className="app-input"
                    />
                  </Field>
                  <Field label="Student ID">
                    <input
                      value={form.studentId}
                      onChange={(event) => setForm((current) => ({ ...current, studentId: event.target.value }))}
                      className="app-input"
                    />
                  </Field>
                </div>
                {status ? <p className="text-sm text-[var(--app-text-soft)]">{status}</p> : null}
                <button onClick={() => void handleSave()} disabled={isSaving} className="app-button app-button-primary w-full sm:w-auto">
                  {isSaving ? "Saving..." : "Save profile"}
                </button>
              </div>
            ) : (
              <div className="mt-6 text-sm text-[var(--app-text-muted)]">Loading profile...</div>
            )}
          </div>

          <div className="glass-panel rounded-[28px] p-6">
            <div className="flex items-center gap-3">
              <BookOpenCheck size={18} className="text-[var(--app-violet)]" />
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-[var(--app-text-muted)]">Learning posture</p>
                <h2 className="mt-2 text-2xl font-semibold text-[var(--app-text)]">Account context</h2>
              </div>
            </div>
            <div className="mt-5 space-y-3">
              <InfoCard label="Email" value={user?.email ?? "Loading"} />
              <InfoCard label="Badges" value={user?.badges?.join(", ") || "None yet"} />
              <div className="app-surface-muted rounded-[24px] p-5">
                <p className="text-xs uppercase tracking-[0.2em] text-[var(--app-text-muted)]">AI profile note</p>
                <p className="mt-2 text-sm leading-7 text-[var(--app-text-soft)]">
                  Profile identity is direct user data. AI-driven learning inference appears in the reputation surfaces where confidence labeling is available.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="glass-panel rounded-[28px] p-6">
          <h2 className="text-2xl font-bold text-[var(--app-text)]">Saved posts</h2>
          <p className="mt-2 text-sm text-[var(--app-text-muted)]">Posts you bookmarked for later review.</p>
          <div className="mt-6 space-y-4">
            {savedPosts === undefined ? (
              Array.from({ length: 2 }).map((_, index) => <div key={index} className="h-32 animate-pulse rounded-[24px] bg-white/5" />)
            ) : savedPosts.length === 0 ? (
              <div className="app-surface-muted rounded-2xl p-4 text-sm text-[var(--app-text-muted)]">No saved posts yet.</div>
            ) : (
              savedPosts.map((post) => <PostCard key={post._id} post={post} roomId={post.roomId} />)
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-semibold text-[var(--app-text-soft)]">{label}</span>
      {children}
    </label>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="app-surface-muted rounded-[24px] p-5">
      <p className="text-xs uppercase tracking-[0.2em] text-[var(--app-text-muted)]">{label}</p>
      <p className="mt-2 text-lg font-semibold text-[var(--app-text)]">{value}</p>
    </div>
  );
}
