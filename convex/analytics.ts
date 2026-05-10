import { query } from "./_generated/server";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { canModerateRoom, getCurrentUser, getMembership } from "./lib";

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export const getRoomAnalytics = query({
  args: {
    roomId: v.id("rooms"),
    days: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      throw new Error("Unauthenticated");
    }

    const membership = await getMembership(ctx, args.roomId, user._id);
    if (!canModerateRoom(user, membership)) {
      throw new Error("Teacher only");
    }

    const since = Date.now() - (args.days ?? 30) * 24 * 60 * 60 * 1000;
    const posts = await ctx.db
      .query("posts")
      .withIndex("by_roomId_createdAt", (query) => query.eq("roomId", args.roomId).gt("createdAt", since))
      .collect();

    const livePosts = posts.filter((post) => !post.isDeleted);
    const byType = livePosts.reduce<Record<string, number>>((accumulator, post) => {
      accumulator[post.type] = (accumulator[post.type] ?? 0) + 1;
      return accumulator;
    }, {});

    const byDay = livePosts.reduce<Record<string, number>>((accumulator, post) => {
      const day = new Date(post.createdAt).toISOString().slice(0, 10);
      accumulator[day] = (accumulator[day] ?? 0) + 1;
      return accumulator;
    }, {});

    const contributorCounts = new Map<Id<"users">, number>();
    for (const post of livePosts) {
      if (!post.isAnonymous && post.authorId) {
        contributorCounts.set(post.authorId, (contributorCounts.get(post.authorId) ?? 0) + 1);
      }
    }

    const topContributors = await Promise.all(
      [...contributorCounts.entries()]
        .sort((left, right) => right[1] - left[1])
        .slice(0, 5)
        .map(async ([userId, postCount]) => {
          const member = await ctx.db.get(userId);
          return member
            ? { userId, name: member.name, imageUrl: member.imageUrl ?? null, postCount }
            : null;
        })
    );

    const members = await ctx.db
      .query("roomMembers")
      .withIndex("by_roomId", (query) => query.eq("roomId", args.roomId))
      .collect();

    return {
      totalPosts: livePosts.length,
      byType,
      byDay,
      topContributors: topContributors.filter((value): value is NonNullable<typeof value> => value !== null),
      totalMembers: members.filter((member) => !member.isBanned).length,
      resolvedQuestions: livePosts.filter((post) => post.type === "question" && post.isResolved).length,
      anonymousPosts: livePosts.filter((post) => post.isAnonymous).length
    };
  }
});

export const getWorkspaceAnalytics = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      throw new Error("Unauthenticated");
    }

    const memberships = await ctx.db
      .query("roomMembers")
      .withIndex("by_userId", (query) => query.eq("userId", user._id))
      .collect();
    const allowedRoomIds = new Set(memberships.filter((membership) => !membership.isBanned).map((membership) => membership.roomId));
    const posts = await ctx.db.query("posts").collect();
    const roomPosts = posts.filter((post) => !post.isDeleted && !post.isHidden && allowedRoomIds.has(post.roomId));
    const now = Date.now();
    const last28Days = Array.from({ length: 28 }).map((_, index) => {
      const day = new Date(now - (27 - index) * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
      return {
        day,
        count: roomPosts.filter((post) => new Date(post.createdAt).toISOString().slice(0, 10) === day).length
      };
    });

    const byType = roomPosts.reduce<Record<string, number>>((accumulator, post) => {
      accumulator[post.type] = (accumulator[post.type] ?? 0) + 1;
      return accumulator;
    }, {});

    const upcomingDeadlines = roomPosts
      .filter((post) => post.type === "deadline" && post.deadlineDate && post.deadlineDate > now)
      .sort((left, right) => (left.deadlineDate ?? 0) - (right.deadlineDate ?? 0))
      .slice(0, 5)
      .map((post) => {
        const daysUntilDue = Math.max(0, Math.ceil(((post.deadlineDate ?? now) - now) / (24 * 60 * 60 * 1000)));
        const score = clamp(daysUntilDue <= 1 ? 82 : daysUntilDue <= 3 ? 64 : daysUntilDue <= 7 ? 46 : 24, 20, 88);
        return {
          postId: post._id,
          roomId: post.roomId,
          title: post.deadlineTitle || post.content.slice(0, 72),
          dueDate: post.deadlineDate,
          score,
          band: score >= 70 ? "high" : score >= 45 ? "medium" : "low"
        };
      });

    return {
      totalPosts: roomPosts.length,
      activeRooms: allowedRoomIds.size,
      last28Days,
      byType,
      anonymousPosts: roomPosts.filter((post) => post.isAnonymous).length,
      resolvedQuestions: roomPosts.filter((post) => post.type === "question" && post.isResolved).length,
      upcomingDeadlines
    };
  }
});
