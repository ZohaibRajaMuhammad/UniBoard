import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getCurrentUserOrThrow } from "./lib";

type PlannerItem = {
  id: string;
  kind: "room_deadline" | "manual_deadline";
  roomId?: string;
  roomName?: string;
  title: string;
  notes?: string;
  dueDate: number;
  estimatedMinutes: number;
  urgency: "low" | "medium" | "high";
  riskScore: number;
  confidence: "high" | "medium";
  explanation: string;
};

function startOfDay(timestamp: number) {
  const date = new Date(timestamp);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}

function addDays(timestamp: number, days: number) {
  const date = new Date(timestamp);
  date.setDate(date.getDate() + days);
  return date.getTime();
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

async function buildPlannerSnapshot(ctx: any) {
  const user = await getCurrentUserOrThrow(ctx);
  const now = Date.now();
  const memberships = await ctx.db
    .query("roomMembers")
    .withIndex("by_userId", (q: any) => q.eq("userId", user._id))
    .collect();
  const activeMemberships = memberships.filter((membership: any) => !membership.isBanned);
  const roomIds = new Set(activeMemberships.map((membership: any) => membership.roomId));

  const [allPosts, manualDeadlines] = await Promise.all([
    ctx.db.query("posts").withIndex("by_type", (q: any) => q.eq("type", "deadline")).collect(),
    ctx.db
      .query("plannerDeadlines")
      .withIndex("by_userId_dueDate", (q: any) => q.eq("userId", user._id))
      .collect()
  ]);

  const roomDeadlines = await Promise.all(
    allPosts
      .filter((post: any) => !post.isDeleted && !post.isHidden && post.deadlineDate && roomIds.has(post.roomId))
      .map(async (post: any) => {
        const room = await ctx.db.get(post.roomId);
        return room
          ? {
              id: post._id,
              kind: "room_deadline" as const,
              roomId: post.roomId,
              roomName: room.name,
              title: post.deadlineTitle || post.content.slice(0, 72),
              notes: post.content,
              dueDate: post.deadlineDate,
              estimatedMinutes: post.content.length > 500 ? 180 : post.content.length > 240 ? 120 : 90,
              urgency: "low" as const,
              riskScore: 0,
              confidence: "high" as const,
              explanation: ""
            }
          : null;
      })
  );

  const accessibleDeadlines = roomDeadlines.filter((item: any) => item !== null);
  const deadlineItems: PlannerItem[] = [
    ...accessibleDeadlines,
    ...manualDeadlines
      .filter((item: any) => !item.completed)
      .map((item: any) => ({
        id: item._id,
        kind: "manual_deadline" as const,
        roomId: item.roomId,
        roomName: undefined,
        title: item.title,
        notes: item.notes,
        dueDate: item.dueDate,
        estimatedMinutes: item.estimatedMinutes ?? 120,
        urgency: "low" as const,
        riskScore: 0,
        confidence: "medium" as const,
        explanation: ""
      }))
  ]
    .filter((item) => item.dueDate > now - 7 * 24 * 60 * 60 * 1000)
    .sort((left, right) => left.dueDate - right.dueDate);

  const recentPosts = await ctx.db.query("posts").collect();
  const itemsWithRisk = deadlineItems.map((item) => {
    const daysUntilDue = Math.max(0, Math.ceil((item.dueDate - now) / (24 * 60 * 60 * 1000)));
    const roomActivity = item.roomId
      ? recentPosts.filter(
          (post: any) =>
            post.roomId === item.roomId &&
            !post.isDeleted &&
            post.createdAt > now - 7 * 24 * 60 * 60 * 1000
        ).length
      : 0;
    const activityPenalty = item.kind === "room_deadline" ? clamp(12 - roomActivity * 2, 0, 12) : 6;
    const duePressure = daysUntilDue <= 1 ? 50 : daysUntilDue <= 3 ? 36 : daysUntilDue <= 7 ? 24 : 12;
    const scopePenalty = item.estimatedMinutes >= 180 ? 12 : item.estimatedMinutes >= 120 ? 8 : 4;
    const riskScore = clamp(duePressure + scopePenalty + activityPenalty, 18, 92);
    const urgency = riskScore >= 70 ? "high" : riskScore >= 45 ? "medium" : "low";
    const explanation =
      urgency === "high"
        ? "The due date is close enough that one missed study block could materially affect delivery."
        : urgency === "medium"
          ? "There is still room to recover, but this work should be scheduled deliberately this week."
          : "The current timeline is manageable if you keep steady progress visible.";

    return {
      ...item,
      riskScore,
      urgency,
      explanation
    };
  });

  const sessions = itemsWithRisk.flatMap((item, index) => {
    const segments = item.riskScore >= 70 ? 3 : item.riskScore >= 45 ? 2 : 1;
    const minutesPerSegment = Math.max(45, Math.round(item.estimatedMinutes / segments / 15) * 15);
    const baseDay = Math.max(0, Math.min(segments, Math.ceil((item.dueDate - now) / (24 * 60 * 60 * 1000)) - 1));

    return Array.from({ length: segments }).map((_, segmentIndex) => {
      const dayOffset = Math.max(0, baseDay - (segments - segmentIndex - 1));
      const slotDate = new Date(startOfDay(addDays(now, dayOffset)));
      slotDate.setHours(18 + ((index + segmentIndex) % 2) * 2, 0, 0, 0);
      const startAt = Math.min(slotDate.getTime(), item.dueDate - 60 * 60 * 1000);
      return {
        id: `${item.id}-${segmentIndex}`,
        linkedDeadlineId: item.id,
        title: `${item.title} study block ${segmentIndex + 1}`,
        startAt,
        endAt: startAt + minutesPerSegment * 60 * 1000,
        urgency: item.urgency,
        reasoning:
          item.riskScore >= 70
            ? "Split across multiple sessions to reduce deadline compression."
            : "Single focused block keeps this deadline moving without over-scheduling."
      };
    });
  });

  const highRiskCount = itemsWithRisk.filter((item) => item.riskScore >= 70).length;
  const dueSoonCount = itemsWithRisk.filter((item) => item.dueDate < now + 7 * 24 * 60 * 60 * 1000).length;
  const plannedMinutes = sessions.reduce((total, session) => total + (session.endAt - session.startAt) / 60000, 0);

  return {
    generatedAt: now,
    metrics: {
      totalDeadlines: itemsWithRisk.length,
      dueSoonCount,
      highRiskCount,
      plannedHours: Math.round((plannedMinutes / 60) * 10) / 10
    },
    items: itemsWithRisk,
    sessions: sessions.sort((left, right) => left.startAt - right.startAt)
  };
}

export const getSnapshot = query({
  args: {},
  handler: async (ctx) => buildPlannerSnapshot(ctx)
});

export const replan = mutation({
  args: {},
  handler: async (ctx) => {
    await getCurrentUserOrThrow(ctx);
    return { generatedAt: Date.now() };
  }
});

export const createManualDeadline = mutation({
  args: {
    title: v.string(),
    dueDate: v.number(),
    notes: v.optional(v.string()),
    estimatedMinutes: v.optional(v.number()),
    roomId: v.optional(v.id("rooms"))
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);
    const title = args.title.trim();

    if (!title) {
      throw new Error("Deadline title is required.");
    }

    if (args.dueDate <= Date.now()) {
      throw new Error("Manual deadlines must be in the future.");
    }

    if (args.estimatedMinutes !== undefined && (args.estimatedMinutes < 30 || args.estimatedMinutes > 1440)) {
      throw new Error("Estimated effort must be between 30 and 1440 minutes.");
    }

    const now = Date.now();
    return ctx.db.insert("plannerDeadlines", {
      userId: user._id,
      roomId: args.roomId,
      title,
      notes: args.notes?.trim() || undefined,
      dueDate: args.dueDate,
      estimatedMinutes: args.estimatedMinutes,
      completed: false,
      createdAt: now,
      updatedAt: now
    });
  }
});

export const exportCalendar = mutation({
  args: {},
  handler: async (ctx) => {
    const snapshot = await buildPlannerSnapshot(ctx);
    const lines = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//UniBoard//Planner//EN"
    ];

    for (const session of snapshot.sessions) {
      lines.push("BEGIN:VEVENT");
      lines.push(`UID:${session.id}@uniboard`);
      lines.push(`DTSTAMP:${new Date(snapshot.generatedAt).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z")}`);
      lines.push(`DTSTART:${new Date(session.startAt).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z")}`);
      lines.push(`DTEND:${new Date(session.endAt).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z")}`);
      lines.push(`SUMMARY:${session.title.replace(/\n/g, " ")}`);
      lines.push(`DESCRIPTION:${session.reasoning.replace(/\n/g, " ")}`);
      lines.push("END:VEVENT");
    }

    lines.push("END:VCALENDAR");
    return {
      filename: `uniboard-study-plan-${new Date(snapshot.generatedAt).toISOString().slice(0, 10)}.ics`,
      content: lines.join("\r\n")
    };
  }
});
