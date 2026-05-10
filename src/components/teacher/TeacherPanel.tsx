"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { BarChart2, Flag, Shield, Users } from "lucide-react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { cn } from "@/lib/utils";

type Tab = "flagged" | "members" | "analytics";

export function TeacherPanel({ roomId }: { roomId: Id<"rooms"> }) {
  const [activeTab, setActiveTab] = useState<Tab>("flagged");
  const reportedPosts = useQuery(api.posts.getReportedPosts, { roomId });
  const members = useQuery(api.rooms.getMembers, { roomId });
  const analytics = useQuery(api.analytics.getRoomAnalytics, { roomId, days: 14 });
  const removePost = useMutation(api.posts.remove);
  const muteOrBan = useMutation(api.rooms.muteOrBanMember);
  const setMemberRole = useMutation(api.rooms.setMemberRole);

  const tabs = [
    { id: "flagged" as const, label: "Flagged", icon: <Flag size={14} /> },
    { id: "members" as const, label: "Members", icon: <Users size={14} /> },
    { id: "analytics" as const, label: "Stats", icon: <BarChart2 size={14} /> }
  ];

  return (
    <div className="flex h-full flex-col border-l border-[var(--app-line)] bg-[linear-gradient(180deg,rgba(8,16,28,0.98),rgba(7,12,22,0.98))]">
      <div className="border-b border-[var(--app-line)] px-4 py-4">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-200">
          <Shield size={14} className="text-[var(--app-primary-strong)]" />
          Teacher Panel
        </h2>
      </div>

      <div className="flex border-b border-[var(--app-line)]">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex flex-1 items-center justify-center gap-2 px-3 py-3 text-xs font-medium transition",
              activeTab === tab.id ? "border-b border-[var(--app-primary)] text-white" : "text-[var(--app-text-muted)] hover:text-white"
            )}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-3">
        {activeTab === "flagged" ? (
          <div className="space-y-2">
            {reportedPosts === undefined ? (
              <div className="space-y-2">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div key={index} className="h-20 animate-pulse rounded-2xl bg-white/5" />
                ))}
              </div>
            ) : reportedPosts.length === 0 ? (
              <div className="rounded-2xl border border-[var(--app-line)] bg-white/[0.03] p-4 text-sm text-[var(--app-text-muted)]">No reported posts.</div>
            ) : (
              reportedPosts.map((post) => (
                <div key={post._id} className="rounded-2xl border border-red-400/20 bg-red-500/5 p-3">
                  <p className="text-sm text-gray-200">{post.content}</p>
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={() => void removePost({ postId: post._id, reason: "Flagged content" })}
                      className="rounded-xl bg-red-500/15 px-3 py-2 text-xs font-semibold text-red-200 transition hover:bg-red-500/25"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : null}

        {activeTab === "members" ? (
          <div className="space-y-2">
            {members?.map((member) => (
              <div key={member._id} className="rounded-2xl border border-[var(--app-line)] bg-white/[0.03] p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-white">{member.user.name}</p>
                    <p className="text-xs text-gray-500">{member.role}</p>
                    {member.isMuted ? <p className="mt-1 text-xs text-amber-300">Muted</p> : null}
                    {member.isBanned ? <p className="mt-1 text-xs text-red-300">Banned</p> : null}
                  </div>
                </div>

                {member.role !== "owner" ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    <MemberAction
                      label={member.role === "moderator" ? "Demote" : "Promote"}
                      onClick={() =>
                        setMemberRole({
                          roomId,
                          targetUserId: member.userId,
                          newRole: member.role === "moderator" ? "member" : "moderator"
                        })
                      }
                    />
                    <MemberAction
                      label={member.isMuted ? "Unmute" : "Mute 24h"}
                      onClick={() =>
                        muteOrBan({
                          roomId,
                          targetUserId: member.userId,
                          action: member.isMuted ? "unmute" : "mute",
                          muteDurationHours: member.isMuted ? undefined : 24
                        })
                      }
                    />
                    <MemberAction
                      label={member.isBanned ? "Unban" : "Ban"}
                      tone={member.isBanned ? "default" : "danger"}
                      onClick={() =>
                        muteOrBan({
                          roomId,
                          targetUserId: member.userId,
                          action: member.isBanned ? "unban" : "ban",
                          reason: member.isBanned ? undefined : "Manual moderation action"
                        })
                      }
                    />
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        ) : null}

        {activeTab === "analytics" && analytics ? (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <StatCard label="Posts (14d)" value={analytics.totalPosts} />
              <StatCard label="Members" value={analytics.totalMembers} />
              <StatCard label="Resolved" value={analytics.resolvedQuestions} />
              <StatCard label="Anonymous" value={analytics.anonymousPosts} />
            </div>

            <div className="rounded-2xl border border-[var(--app-line)] bg-white/[0.03] p-3">
              <p className="text-xs uppercase tracking-[0.18em] text-gray-500">By Type</p>
              <div className="mt-3 space-y-2">
                {Object.entries(analytics.byType).map(([type, count]) => (
                  <div key={type} className="flex items-center gap-2">
                    <span className="w-20 text-xs capitalize text-gray-400">{type}</span>
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/5">
                      <div
                        className="h-full rounded-full bg-brand-500"
                        style={{ width: `${analytics.totalPosts > 0 ? (count / analytics.totalPosts) * 100 : 0}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-400">{count}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-[var(--app-line)] bg-white/[0.03] p-3">
              <p className="text-xs uppercase tracking-[0.18em] text-gray-500">Posting cadence</p>
              <div className="mt-3 space-y-2">
                {Object.entries(analytics.byDay).map(([day, count]) => (
                  <div key={day} className="flex items-center justify-between gap-3 rounded-xl bg-black/20 px-3 py-2 text-xs text-gray-300">
                    <span>{day}</span>
                    <span>{count}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-[var(--app-line)] bg-white/[0.03] p-3">
              <p className="text-xs uppercase tracking-[0.18em] text-gray-500">Top contributors</p>
              <div className="mt-3 space-y-2">
                {analytics.topContributors.map((contributor) => (
                  <div key={contributor.userId} className="flex items-center justify-between gap-3 rounded-xl bg-black/20 px-3 py-2 text-sm text-gray-200">
                    <span className="truncate">{contributor.name}</span>
                    <span className="text-xs text-gray-400">{contributor.postCount} posts</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
      <p className="text-[11px] uppercase tracking-[0.18em] text-gray-500">{label}</p>
      <p className="mt-2 text-2xl font-bold text-white">{value}</p>
    </div>
  );
}

function MemberAction({
  label,
  onClick,
  tone = "default"
}: {
  label: string;
  onClick: () => Promise<unknown>;
  tone?: "default" | "danger";
}) {
  return (
    <button
      onClick={() => void onClick()}
      className={cn(
        "rounded-xl border px-3 py-2 text-xs transition",
        tone === "danger"
          ? "border-red-400/20 bg-red-500/10 text-red-200 hover:bg-red-500/20"
          : "border-white/10 bg-white/5 text-gray-200 hover:bg-white/10"
      )}
    >
      {label}
    </button>
  );
}
