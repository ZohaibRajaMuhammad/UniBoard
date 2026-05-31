"use client";

import { useMutation, useQuery } from "convex/react";
import { ShieldCheck, UserCog, Users2 } from "lucide-react";
import { api } from "../../../../convex/_generated/api";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { Skeleton } from "@/components/ui/Skeleton";

export default function AdminPage() {
  const currentUser = useCurrentUser();
  const teacherRequests = useQuery(api.users.listTeacherAccessRequests);
  const users = useQuery(api.users.listGovernanceUsers);
  const rooms = useQuery(api.rooms.getAdminRoomOverview);
  const setUserRole = useMutation(api.users.setUserRoleBySuperAdmin);
  const setArchiveState = useMutation(api.rooms.setArchiveStateBySuperAdmin);

  if (currentUser === undefined) {
    return <Skeleton className="m-4 h-48 rounded-[28px] sm:m-6" />;
  }

  if (currentUser?.role !== "super_admin") {
    return <div className="flex flex-1 items-center justify-center text-[var(--app-text-muted)]">Super admin access required.</div>;
  }

  return (
    <div className="app-scroll">
      <div className="page-wrap page-stack shell-content-column">
        <section className="glass-panel rounded-[28px] p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[rgba(109,140,255,0.25)] bg-[rgba(77,117,255,0.1)] text-[var(--app-primary-strong)]">
              <ShieldCheck size={20} />
            </div>
            <div>
              <p className="section-eyebrow text-[var(--app-primary-strong)]">Administration</p>
              <h1 className="mt-2 text-3xl font-bold text-white">Portal governance and access control</h1>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--app-text-soft)]">
                Review teacher access requests, supervise room governance, and keep the academic workspace aligned with platform policy.
              </p>
            </div>
          </div>
        </section>

        <section className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
          <div className="glass-panel rounded-[28px] p-6">
            <div className="flex items-center gap-3">
              <UserCog size={18} className="text-[var(--app-primary-strong)]" />
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-[var(--app-text-muted)]">Teacher requests</p>
                <h2 className="mt-2 text-2xl font-semibold text-white">Pending elevated access</h2>
              </div>
            </div>
            <div className="mt-5 space-y-4">
              {(teacherRequests ?? []).length === 0 ? (
                <div className="rounded-[24px] border border-[var(--app-line)] bg-white/5 p-4 text-sm text-[var(--app-text-soft)]">
                  No pending teacher access requests right now.
                </div>
              ) : (
                teacherRequests?.map((request) => (
                  <div key={request._id} className="rounded-[24px] border border-[var(--app-line)] bg-white/5 p-4">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-white">{request.name}</h3>
                        <p className="mt-1 text-sm text-[var(--app-text-muted)]">{request.email}</p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {request.batch ? <span className="app-chip">{request.batch}</span> : null}
                          {request.department ? <span className="app-chip">{request.department}</span> : null}
                        </div>
                        {request.bio ? <p className="mt-3 text-sm leading-7 text-[var(--app-text-soft)]">{request.bio}</p> : null}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => void setUserRole({ userId: request._id, role: "teacher" })}
                          className="app-button app-button-primary min-h-[2.6rem] rounded-2xl px-4 py-2 text-sm"
                        >
                          Approve teacher
                        </button>
                        <button
                          type="button"
                          onClick={() => void setUserRole({ userId: request._id, role: "student" })}
                          className="app-button app-button-secondary min-h-[2.6rem] rounded-2xl px-4 py-2 text-sm"
                        >
                          Approve as student
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="glass-panel rounded-[28px] p-6">
            <div className="flex items-center gap-3">
              <Users2 size={18} className="text-[var(--app-primary-strong)]" />
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-[var(--app-text-muted)]">Room oversight</p>
                <h2 className="mt-2 text-2xl font-semibold text-white">Recent governed rooms</h2>
              </div>
            </div>
            <div className="mt-5 space-y-4">
              {(rooms ?? []).map((room) => (
                <div key={room._id} className="rounded-[24px] border border-[var(--app-line)] bg-white/5 p-4">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-white">{room.name}</h3>
                      <p className="mt-1 text-sm text-[var(--app-text-muted)]">{room.subject} · {room.batch} · owner: {room.ownerName}</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <span className="app-chip">{room.isPublic ? "Public" : "Private"}</span>
                        <span className="app-chip">{room.aiEnabled ? "AI enabled" : "AI off"}</span>
                        <span className="app-chip">{room.memberCount} members</span>
                        <span className="app-chip">{room.postCount} posts</span>
                        {room.isArchived ? <span className="app-chip">Archived</span> : null}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => void setArchiveState({ roomId: room._id, archived: !room.isArchived })}
                      className="app-button app-button-secondary min-h-[2.6rem] rounded-2xl px-4 py-2 text-sm"
                    >
                      {room.isArchived ? "Restore room" : "Archive room"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="glass-panel rounded-[28px] p-6">
          <div className="flex items-center gap-3">
            <Users2 size={18} className="text-[var(--app-primary-strong)]" />
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--app-text-muted)]">User directory</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">Governed accounts</h2>
            </div>
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {(users ?? []).map((user) => (
              <div key={user._id} className="rounded-[24px] border border-[var(--app-line)] bg-white/5 p-4">
                <h3 className="text-lg font-semibold text-white">{user.name}</h3>
                <p className="mt-1 text-sm text-[var(--app-text-muted)]">{user.email}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="app-chip">{user.role}</span>
                  {user.batch ? <span className="app-chip">{user.batch}</span> : null}
                  {user.department ? <span className="app-chip">{user.department}</span> : null}
                  <span className="app-chip">{user.theme}</span>
                </div>
                {user.badges.length > 0 ? (
                  <p className="mt-3 text-sm leading-7 text-[var(--app-text-soft)]">
                    Badges: {user.badges.join(", ")}
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
