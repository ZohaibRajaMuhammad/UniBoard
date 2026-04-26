import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getCurrentUser } from "./lib";

export const getMyNotifications = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      return [];
    }

    return ctx.db
      .query("notifications")
      .withIndex("by_userId_createdAt", (query) => query.eq("userId", user._id))
      .order("desc")
      .take(30);
  }
});

export const getUnreadNotificationCount = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      return 0;
    }

    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_userId_isRead", (query) => query.eq("userId", user._id).eq("isRead", false))
      .collect();

    return notifications.length;
  }
});

export const markAllRead = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      return;
    }

    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_userId_isRead", (query) => query.eq("userId", user._id).eq("isRead", false))
      .collect();

    await Promise.all(notifications.map((notification) => ctx.db.patch(notification._id, { isRead: true })));
  }
});

export const markRead = mutation({
  args: { notificationId: v.id("notifications") },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      return;
    }

    const notification = await ctx.db.get(args.notificationId);
    if (!notification || notification.userId !== user._id) {
      return;
    }

    await ctx.db.patch(notification._id, { isRead: true });
  }
});
