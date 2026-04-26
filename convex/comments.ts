import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { buildPublicAuthor, createNotification, getCurrentUserOrThrow, getMembership } from "./lib";

export const getByPost = query({
  args: { postId: v.id("posts") },
  handler: async (ctx, args) => {
    const comments = await ctx.db
      .query("comments")
      .withIndex("by_postId_createdAt", (query) => query.eq("postId", args.postId))
      .order("asc")
      .collect();

    return Promise.all(
      comments
        .filter((comment) => !comment.isDeleted)
        .map(async (comment) => {
          const author = comment.authorId ? await ctx.db.get(comment.authorId) : null;
          return {
            ...comment,
            ...buildPublicAuthor(comment.isAnonymous, comment.authorId, author)
          };
        })
    );
  }
});

export const create = mutation({
  args: {
    postId: v.id("posts"),
    content: v.string(),
    isAnonymous: v.boolean(),
    parentCommentId: v.optional(v.id("comments"))
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);
    const post = await ctx.db.get(args.postId);
    if (!post || post.isDeleted) {
      throw new Error("Post not found");
    }

    const membership = await getMembership(ctx, post.roomId, user._id);
    if (!membership || membership.isBanned) {
      throw new Error("Not a member of this room");
    }
    if (membership.isMuted && (!membership.mutedUntil || membership.mutedUntil > Date.now())) {
      throw new Error("You are muted in this room");
    }

    const room = await ctx.db.get(post.roomId);
    if (!room) {
      throw new Error("Room not found");
    }
    if (!room.allowAnonymous && args.isAnonymous) {
      throw new Error("Anonymous posting is disabled in this room");
    }

    if (args.parentCommentId) {
      const parentComment = await ctx.db.get(args.parentCommentId);
      if (!parentComment || parentComment.postId !== args.postId || parentComment.parentCommentId) {
        throw new Error("Invalid parent comment");
      }
    }

    const content = args.content.trim();
    if (!content || content.length > 500) {
      throw new Error("Invalid content");
    }

    const now = Date.now();
    const commentId = await ctx.db.insert("comments", {
      postId: args.postId,
      roomId: post.roomId,
      authorId: args.isAnonymous ? undefined : user._id,
      content,
      parentCommentId: args.parentCommentId,
      isAnonymous: args.isAnonymous,
      isDeleted: false,
      isEdited: false,
      upvoteCount: 0,
      createdAt: now
    });

    await ctx.db.patch(post._id, {
      commentCount: (post.commentCount ?? 0) + 1
    });

    if (post.authorId && post.authorId !== user._id) {
      await createNotification(ctx, {
        userId: post.authorId,
        type: "new_comment",
        postId: post._id,
        commentId,
        roomId: post.roomId,
        fromUserId: args.isAnonymous ? undefined : user._id,
        message: args.isAnonymous ? "Someone commented on your post" : `${user.name} commented on your post`,
        isRead: false,
        createdAt: now
      });
    }

    return commentId;
  }
});

export const deleteComment = mutation({
  args: {
    commentId: v.id("comments"),
    reason: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);
    const comment = await ctx.db.get(args.commentId);
    if (!comment || comment.isDeleted) {
      throw new Error("Comment not found");
    }

    const membership = await getMembership(ctx, comment.roomId, user._id);
    const canDelete =
      (!comment.isAnonymous && comment.authorId === user._id) ||
      user.role === "teacher" ||
      user.role === "super_admin" ||
      membership?.role === "owner" ||
      membership?.role === "moderator";
    if (!canDelete) {
      throw new Error("Permission denied");
    }

    await ctx.db.patch(comment._id, { isDeleted: true });
  }
});
