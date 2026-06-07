import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { assertPortalAccess, canModerateRoom, createNotification, getCurrentUserOrThrow, getMembership } from "./lib";

export const getForRoom = query({
  args: {
    roomId: v.id("rooms")
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);
    const membership = await getMembership(ctx, args.roomId, user._id);
    if (!membership || membership.isBanned) {
      return [];
    }

    const room = await ctx.db.get(args.roomId);
    if (!room) {
      return [];
    }

    const canReview = canModerateRoom(user, membership) || room.createdBy === user._id;
    const submissions = await ctx.db
      .query("assignmentSubmissions")
      .withIndex("by_roomId_createdAt", (query) => query.eq("roomId", args.roomId))
      .order("desc")
      .take(50);

    const visibleSubmissions = canReview ? submissions : submissions.filter((submission) => submission.submittedByUserId === user._id);

    return Promise.all(
      visibleSubmissions.map(async (submission) => {
        const submittedBy = await ctx.db.get(submission.submittedByUserId);
        const reviewer = await ctx.db.get(submission.reviewerUserId);
        return {
          ...submission,
          submittedBy: submittedBy
            ? {
                userId: submittedBy._id,
                name: submittedBy.name,
                role: submittedBy.role
              }
            : null,
          reviewer: reviewer
            ? {
                userId: reviewer._id,
                name: reviewer.name,
                role: reviewer.role
              }
            : null
        };
      })
    );
  }
});

export const submit = mutation({
  args: {
    roomId: v.id("rooms"),
    title: v.string(),
    content: v.string(),
    attachmentUrl: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);
    assertPortalAccess(user);
    const membership = await getMembership(ctx, args.roomId, user._id);
    if (!membership || membership.isBanned) {
      throw new Error("Not a member of this room");
    }

    const room = await ctx.db.get(args.roomId);
    if (!room) {
      throw new Error("Room not found");
    }
    if (room.isArchived) {
      throw new Error("Room is archived");
    }

    const title = args.title.trim();
    const content = args.content.trim();
    const attachmentUrl = args.attachmentUrl?.trim() || undefined;

    if (!title) {
      throw new Error("Assignment title is required");
    }
    if (!content) {
      throw new Error("Assignment content is required");
    }
    if (title.length > 140) {
      throw new Error("Assignment title is too long");
    }
    if (content.length > 4000) {
      throw new Error("Assignment submission is too long");
    }

    const now = Date.now();
    const submissionId = await ctx.db.insert("assignmentSubmissions", {
      roomId: room._id,
      submittedByUserId: user._id,
      reviewerUserId: room.createdBy,
      title,
      content,
      attachmentUrl,
      status: "submitted",
      createdAt: now,
      updatedAt: now
    });

    if (room.createdBy !== user._id) {
      await createNotification(ctx, {
        userId: room.createdBy,
        type: "assignment_submission",
        roomId: room._id,
        fromUserId: user._id,
        message: `${user.name} submitted an assignment in ${room.name}`,
        isRead: false,
        createdAt: now
      });
    }

    return submissionId;
  }
});
