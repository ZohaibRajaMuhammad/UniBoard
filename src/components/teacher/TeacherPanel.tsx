"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { AlertTriangle, BarChart3, Flag, ShieldCheck, Users, X } from "lucide-react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { cn } from "@/lib/utils";

type Tab = "flagged" | "members" | "analytics";

export function TeacherPanel({
  roomId,
  onClose
}: {
  roomId: Id<"rooms">;
  onClose?: () => void;
}) {
  const [activeTab, setActiveTab] = useState<Tab>("flagged");
  const reportedPosts = useQuery(api.posts.getReportedPosts, { roomId });
  const members = useQuery(api.rooms.getMembers, { roomId });
  const analytics = useQuery(api.analytics.getRoomAnalytics, { roomId, days: 14 });
  const removePost = useMutation(api.posts.remove);
  const muteOrBan = useMutation(api.rooms.muteOrBanMember);
  const setMemberRole = useMutation(api.rooms.setMemberRole);

  const tabs = [
    { id: "flagged" as const, label: "Flagged", icon: Flag },
    { id: "members" as const, label: "Members", icon: Users },
    { id: "analytics" as const, label: "Analytics", icon: BarChart3 }
  ];

  return (
    <div className="flex h-full min-h-0 flex-col border-l border-[var(--app-line)] bg-[var(--app-panel-strong)] text-[var(--app-text)]">
      <div className="border-b border-[var(--app-line)] bg-[var(--app-panel)] px-5 py-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-[rgba(49,92,243,0.14)] bg-[rgba(49,92,243,0.08)] text-[var(--app-primary)]">
                <ShieldCheck size={18} />
              </span>
              <div>
                <p className="section-eyebrow">Room governance</p>
                <h2 className="mt-1 text-base font-semibold tracking-[-0.02em] text-[var(--app-text)]">Teacher control rail</h2>
              </div>
            </div>
            <p className="mt-3 text-sm leading-6 text-[var(--app-text-soft)]">
              Moderate flagged content, manage room roles, and inspect the short-term collaboration signal without leaving the feed.
            </p>
          </div>
          {onClose ? (
            <button
              type="button"
              onClick={onClose}
              className="touch-target rounded-2xl border border-[var(--app-line)] bg-[var(--app-panel-soft)] p-2 text-[var(--app-text-muted)] transition hover:border-[var(--app-line-strong)] hover:bg-[var(--app-panel)] hover:text-[var(--app-text)]"
              aria-label="Close teacher panel"
            >
              <X size={16} />
            </button>
          ) : null}
        </div>
      </div>

      <div className="border-b border-[var(--app-line)] bg-[var(--app-panel-soft)] px-4 py-3">
        <div className="grid grid-cols-3 gap-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "rounded-2xl border px-3 py-3 text-xs font-semibold transition",
                  isActive
                    ? "border-[rgba(49,92,243,0.22)] bg-[color-mix(in_srgb,var(--app-primary)_12%,var(--app-panel-strong))] text-[var(--app-primary-strong)]"
                    : "border-[var(--app-line)] bg-[var(--app-panel)] text-[var(--app-text-muted)] hover:border-[var(--app-line-strong)] hover:bg-[var(--app-panel-soft)] hover:text-[var(--app-text)]"
                )}
              >
                <span className="flex items-center justify-center gap-2">
                  <Icon size={14} />
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
        {activeTab === "flagged" ? (
          <div className="app-tab-panel space-y-3">
            <section className="app-surface-muted rounded-[22px] p-4">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-[rgba(198,64,95,0.1)] text-[var(--app-danger)]">
                  <AlertTriangle size={16} />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[var(--app-text)]">Flag review queue</p>
                  <p className="mt-1 text-sm leading-6 text-[var(--app-text-soft)]">
                    Review reported content quickly. Permanent removal should be used only for clear policy violations or duplicate spam.
                  </p>
                </div>
              </div>
            </section>

            {reportedPosts === undefined ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div key={index} className="h-28 animate-pulse rounded-[22px] border border-[var(--app-line)] bg-[var(--app-panel-soft)]" />
                ))}
              </div>
            ) : reportedPosts.length === 0 ? (
              <EmptyPanelState
                title="No flagged posts"
                detail="Nothing currently requires teacher intervention. The room feed is operating without active content reports."
              />
            ) : (
              reportedPosts.map((post) => (
                <article key={post._id} className="rounded-[22px] border border-[rgba(198,64,95,0.18)] bg-[color-mix(in_srgb,var(--app-danger)_8%,var(--app-panel-strong))] p-4 shadow-[0_14px_32px_rgba(16,8,12,0.12)]">
                  <div className="flex items-center justify-between gap-3">
                    <p className="metric-kicker text-[var(--app-danger)]">Reported content</p>
                    <span className="rounded-full border border-[rgba(198,64,95,0.14)] bg-[rgba(198,64,95,0.08)] px-3 py-1 text-[11px] font-semibold text-[var(--app-danger)]">
                      Needs decision
                    </span>
                  </div>
                  <p className="mt-3 text-sm leading-7 text-[var(--app-text)]">{post.content}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => void removePost({ postId: post._id, reason: "Flagged content" })}
                      className="rounded-2xl border border-[rgba(198,64,95,0.16)] bg-[rgba(198,64,95,0.08)] px-4 py-2 text-xs font-semibold text-[var(--app-danger)] transition hover:bg-[rgba(198,64,95,0.14)]"
                    >
                      Remove post
                    </button>
                  </div>
                </article>
              ))
            )}
          </div>
        ) : null}

        {activeTab === "members" ? (
          <div className="app-tab-panel space-y-3">
            {members === undefined ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, index) => (
                  <div key={index} className="h-24 animate-pulse rounded-[22px] border border-[var(--app-line)] bg-[var(--app-panel-soft)]" />
                ))}
              </div>
            ) : members.length === 0 ? (
              <EmptyPanelState
                title="No members found"
                detail="This room currently has no visible members in the moderation list."
              />
            ) : (
              members.map((member) => (
                <article key={member._id} className="app-surface-muted rounded-[22px] p-4 shadow-[0_16px_36px_rgba(6,12,24,0.18)]">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-[var(--app-text)]">{member.user.name}</p>
                      <p className="mt-1 text-xs uppercase tracking-[0.18em] text-[var(--app-text-muted)]">{member.role}</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {member.isMuted ? <StatusPill tone="warning" label="Muted" /> : null}
                        {member.isBanned ? <StatusPill tone="danger" label="Banned" /> : null}
                        {!member.isMuted && !member.isBanned ? <StatusPill tone="neutral" label="Active" /> : null}
                      </div>
                    </div>
                  </div>

                  {member.role !== "owner" ? (
                    <div className="mt-4 flex flex-wrap gap-2">
                      <MemberAction
                        label={member.role === "moderator" ? "Demote to member" : "Promote to moderator"}
                        onClick={() =>
                          setMemberRole({
                            roomId,
                            targetUserId: member.userId,
                            newRole: member.role === "moderator" ? "member" : "moderator"
                          })
                        }
                      />
                      <MemberAction
                        label={member.isMuted ? "Remove mute" : "Mute for 24h"}
                        tone="warning"
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
                        label={member.isBanned ? "Restore access" : "Ban member"}
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
                </article>
              ))
            )}
          </div>
        ) : null}

        {activeTab === "analytics" ? (
          analytics ? (
            <div className="app-tab-panel space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <StatCard label="Posts in 14 days" value={analytics.totalPosts} />
                <StatCard label="Members" value={analytics.totalMembers} />
                <StatCard label="Resolved questions" value={analytics.resolvedQuestions} />
                <StatCard label="Anonymous posts" value={analytics.anonymousPosts} />
              </div>

              <section className="app-surface-muted rounded-[22px] p-4">
                <div className="section-heading">
                  <div>
                    <p className="metric-kicker">Content mix</p>
                    <h3 className="mt-1 text-sm font-semibold text-[var(--app-text)]">Post type distribution</h3>
                  </div>
                  <p className="text-xs text-[var(--app-text-muted)]">14-day view</p>
                </div>
                <div className="mt-4 space-y-3">
                  {Object.entries(analytics.byType).map(([type, count]) => {
                    const width = analytics.totalPosts > 0 ? (count / analytics.totalPosts) * 100 : 0;
                    return (
                      <div key={type} className="space-y-1.5">
                        <div className="flex items-center justify-between gap-3 text-xs">
                          <span className="font-medium capitalize text-[var(--app-text-soft)]">{type}</span>
                          <span className="text-[var(--app-text-muted)]">{count}</span>
                        </div>
                        <div className="h-2.5 overflow-hidden rounded-full bg-[rgba(49,92,243,0.08)]">
                          <div
                            className="h-full rounded-full bg-[linear-gradient(90deg,var(--app-primary),var(--app-primary-strong))]"
                            style={{ width: `${width}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>

              <section className="app-surface-muted rounded-[22px] p-4">
                <p className="metric-kicker">Posting cadence</p>
                <h3 className="mt-1 text-sm font-semibold text-[var(--app-text)]">Day-by-day activity</h3>
                <div className="mt-4 space-y-2">
                  {Object.entries(analytics.byDay).map(([day, count]) => {
                    const width = analytics.totalPosts > 0 ? Math.max((count / analytics.totalPosts) * 100, count > 0 ? 12 : 0) : 0;
                    return (
                      <div key={day} className="rounded-2xl border border-[var(--app-line)] bg-[rgba(49,92,243,0.03)] px-3 py-3">
                        <div className="flex items-center justify-between gap-3 text-xs">
                          <span className="font-medium text-[var(--app-text-soft)]">{day}</span>
                          <span className="text-[var(--app-text-muted)]">{count}</span>
                        </div>
                        <div className="mt-2 h-2 overflow-hidden rounded-full bg-[rgba(49,92,243,0.08)]">
                          <div
                            className="h-full rounded-full bg-[linear-gradient(90deg,var(--app-violet),var(--app-primary))]"
                            style={{ width: `${width}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>

              <section className="app-surface-muted rounded-[22px] p-4">
                <p className="metric-kicker">Top contributors</p>
                <div className="mt-3 space-y-2">
                  {analytics.topContributors.length === 0 ? (
                    <p className="text-sm text-[var(--app-text-muted)]">No contributor activity is available yet.</p>
                  ) : (
                    analytics.topContributors.map((contributor, index) => (
                      <div
                        key={contributor.userId}
                        className="flex items-center justify-between gap-3 rounded-2xl border border-[var(--app-line)] bg-[rgba(49,92,243,0.03)] px-3 py-3"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-[var(--app-text)]">{contributor.name}</p>
                          <p className="mt-1 text-xs text-[var(--app-text-muted)]">Rank #{index + 1}</p>
                        </div>
                        <span className="rounded-full bg-[rgba(49,92,243,0.08)] px-3 py-1 text-xs font-semibold text-[var(--app-primary)]">
                          {contributor.postCount} posts
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </section>
            </div>
          ) : (
            <div className="app-tab-panel space-y-3">
              {Array.from({ length: 4 }).map((_, index) => (
                  <div key={index} className="h-28 animate-pulse rounded-[22px] border border-[var(--app-line)] bg-[var(--app-panel-soft)]" />
              ))}
            </div>
          )
        ) : null}
      </div>
    </div>
  );
}

function EmptyPanelState({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="rounded-[22px] border border-dashed border-[var(--app-line-strong)] bg-[var(--app-panel-soft)] p-5">
      <p className="text-sm font-semibold text-[var(--app-text)]">{title}</p>
      <p className="mt-2 text-sm leading-6 text-[var(--app-text-soft)]">{detail}</p>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="stat-card rounded-[22px] p-4">
      <p className="metric-kicker">{label}</p>
      <p className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-[var(--app-text)]">{value}</p>
    </div>
  );
}

function StatusPill({ label, tone }: { label: string; tone: "neutral" | "warning" | "danger" }) {
  return (
    <span
      className={cn(
        "rounded-full px-2.5 py-1 text-[11px] font-semibold",
        tone === "danger"
          ? "bg-[rgba(198,64,95,0.08)] text-[var(--app-danger)]"
          : tone === "warning"
            ? "bg-[rgba(185,109,17,0.1)] text-[var(--app-warning)]"
            : "bg-[rgba(49,92,243,0.08)] text-[var(--app-primary)]"
      )}
    >
      {label}
    </span>
  );
}

function MemberAction({
  label,
  onClick,
  tone = "default"
}: {
  label: string;
  onClick: () => Promise<unknown>;
  tone?: "default" | "warning" | "danger";
}) {
  return (
    <button
      type="button"
      onClick={() => void onClick()}
      className={cn(
        "rounded-2xl border px-3.5 py-2 text-xs font-semibold transition",
        tone === "danger"
          ? "border-[rgba(198,64,95,0.16)] bg-[rgba(198,64,95,0.08)] text-[var(--app-danger)] hover:bg-[rgba(198,64,95,0.14)]"
          : tone === "warning"
            ? "border-[rgba(185,109,17,0.16)] bg-[rgba(185,109,17,0.08)] text-[var(--app-warning)] hover:bg-[rgba(185,109,17,0.14)]"
            : "border-[var(--app-line)] bg-[var(--app-panel)] text-[var(--app-text-soft)] hover:border-[var(--app-line-strong)] hover:bg-[var(--app-panel-soft)] hover:text-[var(--app-text)]"
      )}
    >
      {label}
    </button>
  );
}
