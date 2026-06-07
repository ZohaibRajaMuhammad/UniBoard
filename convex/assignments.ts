import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { assertPortalAccess, canModerateRoom, createNotification, getCurrentUser, getCurrentUserOrThrow, getMembership } from "./lib";

const attachmentSizeLimit = 256_000;

type AssignmentOption = {
  postId: string;
  title: string;
  dueDate: number | null;
  contentPreview: string;
  roomId: string;
};

function formatAssignmentTitle(post: { deadlineTitle?: string | null; content: string }) {
  const explicitTitle = post.deadlineTitle?.trim();
  if (explicitTitle) {
    return explicitTitle;
  }

  const firstLine = post.content
    .split("\n")
    .map((line) => line.trim())
    .find(Boolean);

  return firstLine ? firstLine.slice(0, 80) : "Assignment";
}

export const getRoomAssignments = query({
  args: {
    roomId: v.id("rooms")
  },
  handler: async (ctx, args): Promise<AssignmentOption[]> => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      return [];
    }

    const membership = await getMembership(ctx, args.roomId, user._id);
    if (!membership || membership.isBanned) {
      return [];
    }

    const room = await ctx.db.get(args.roomId);
    if (!room) {
      return [];
    }

    const posts = await ctx.db
      .query("posts")
      .withIndex("by_roomId_type", (query) => query.eq("roomId", args.roomId).eq("type", "deadline"))
      .order("desc")
      .collect();

    return posts
      .filter((post) => !post.isDeleted && !post.isHidden)
      .map((post) => ({
        postId: post._id,
        title: formatAssignmentTitle(post),
        dueDate: post.deadlineDate ?? null,
        contentPreview: post.content,
        roomId: post.roomId
      }))
      .slice(0, 20);
  }
});

export const getForRoom = query({
  args: {
    roomId: v.id("rooms")
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      return [];
    }

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
    assignmentPostId: v.id("posts"),
    content: v.string(),
    attachmentUrl: v.optional(v.string()),
    attachmentName: v.optional(v.string()),
    attachmentType: v.optional(v.string()),
    attachmentSize: v.optional(v.number())
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

    const assignment = await ctx.db.get(args.assignmentPostId);
    if (!assignment || assignment.roomId !== room._id || assignment.type !== "deadline" || assignment.isDeleted || assignment.isHidden) {
      throw new Error("Assignment not found in this room");
    }

    const title = formatAssignmentTitle(assignment);
    const content = args.content.trim();
    const attachmentUrl = args.attachmentUrl?.trim() || undefined;
    const attachmentName = args.attachmentName?.trim() || undefined;
    const attachmentType = args.attachmentType?.trim() || undefined;
    const attachmentSize = args.attachmentSize;

    if (!content) {
      throw new Error("Assignment content is required");
    }
    if (title.length > 140) {
      throw new Error("Assignment title is too long");
    }
    if (content.length > 4000) {
      throw new Error("Assignment submission is too long");
    }
    if (attachmentSize !== undefined && attachmentSize > attachmentSizeLimit) {
      throw new Error("Attachment is too large for this submission flow");
    }

    const now = Date.now();
    const submissionId = await ctx.db.insert("assignmentSubmissions", {
      roomId: room._id,
      assignmentPostId: assignment._id,
      submittedByUserId: user._id,
      reviewerUserId: room.createdBy,
      title,
      content,
      attachmentUrl,
      attachmentName,
      attachmentType,
      attachmentSize,
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
        message: `${user.name} submitted ${title} in ${room.name}`,
        isRead: false,
        createdAt: now
      });
    }

    return submissionId;
  }
});
