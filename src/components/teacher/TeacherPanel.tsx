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
  const analytics = useQuery(api.analytics.getRoomAnalytics, { roomId, days: 7 });
  const removePost = useMutation(api.posts.remove);
  const muteOrBan = useMutation(api.rooms.muteOrBanMember);

  const tabs = [
    { id: "flagged" as const, label: "Flagged", icon: <Flag size={14} /> },
    { id: "members" as const, label: "Members", icon: <Users size={14} /> },
    { id: "analytics" as const, label: "Stats", icon: <BarChart2 size={14} /> }
  ];

  return (
    <div className="flex h-full flex-col border-l border-white/10 bg-[linear-gradient(180deg,rgba(8,16,28,0.98),rgba(7,12,22,0.98))]">
      <div className="border-b border-white/10 px-4 py-4">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-200">
          <Shield size={14} className="text-brand-300" />
          Teacher Panel
        </h2>
      </div>

      <div className="flex border-b border-white/10">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex flex-1 items-center justify-center gap-2 px-3 py-3 text-xs font-medium transition",
              activeTab === tab.id ? "border-b border-brand-400 text-white" : "text-gray-500 hover:text-white"
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
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-gray-500">No reported posts.</div>
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
              <div key={member._id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-white">{member.user.name}</p>
                    <p className="text-xs text-gray-500">{member.role}</p>
                  </div>
                  {member.role !== "owner" && !member.isMuted ? (
                    <button
                      onClick={() => void muteOrBan({ roomId, targetUserId: member.userId, action: "mute", muteDurationHours: 24 })}
                      className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-gray-200 transition hover:bg-white/10"
                    >
                      Mute 24h
                    </button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        ) : null}

        {activeTab === "analytics" && analytics ? (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <StatCard label="Posts (7d)" value={analytics.totalPosts} />
              <StatCard label="Members" value={analytics.totalMembers} />
              <StatCard label="Resolved" value={analytics.resolvedQuestions} />
              <StatCard label="Anonymous" value={analytics.anonymousPosts} />
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
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
