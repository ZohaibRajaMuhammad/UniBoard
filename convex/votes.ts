import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { createNotification, getCurrentUserOrThrow } from "./lib";

const ALLOWED_EMOJIS = ["👍", "❤️", "😂", "🔥", "😮", "😢"] as const;

export const toggle = mutation({
  args: { postId: v.id("posts") },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);
    const post = await ctx.db.get(args.postId);
    if (!post || post.isDeleted) {
      throw new Error("Post not found");
    }

    const existing = await ctx.db
      .query("votes")
      .withIndex("by_targetId_userId", (query) => query.eq("targetId", args.postId).eq("userId", user._id))
      .unique();

    if (existing) {
      await ctx.db.delete(existing._id);
      await ctx.db.patch(post._id, {
        upvoteCount: Math.max(0, post.upvoteCount - 1)
      });

      if (post.authorId) {
        const author = await ctx.db.get(post.authorId);
        if (author) {
          await ctx.db.patch(author._id, {
            upvotesReceived: Math.max(0, (author.upvotesReceived ?? 0) - 1)
          });
        }
      }

      return { voted: false };
    }

    await ctx.db.insert("votes", {
      targetId: args.postId,
      targetType: "post",
      userId: user._id,
      createdAt: Date.now()
    });

    await ctx.db.patch(post._id, {
      upvoteCount: post.upvoteCount + 1
    });

    if (post.authorId && post.authorId !== user._id) {
      const author = await ctx.db.get(post.authorId);
      if (author) {
        await ctx.db.patch(author._id, {
          upvotesReceived: (author.upvotesReceived ?? 0) + 1
        });
      }

      await createNotification(ctx, {
        userId: post.authorId,
        type: "upvote",
        postId: post._id,
        roomId: post.roomId,
        fromUserId: user._id,
        message: `${user.name} upvoted your post`,
        isRead: false,
        createdAt: Date.now()
      });
    }

    return { voted: true };
  }
});

export const toggleReaction = mutation({
  args: {
    postId: v.id("posts"),
    emoji: v.string()
  },
  handler: async (ctx, args) => {
    if (!ALLOWED_EMOJIS.includes(args.emoji as (typeof ALLOWED_EMOJIS)[number])) {
      throw new Error("Invalid emoji");
    }

    const user = await getCurrentUserOrThrow(ctx);
    const reaction = await ctx.db
      .query("reactions")
      .withIndex("by_postId_userId", (query) => query.eq("postId", args.postId).eq("userId", user._id))
      .filter((query) => query.eq(query.field("emoji"), args.emoji))
      .unique();

    if (reaction) {
      await ctx.db.delete(reaction._id);
      return { reacted: false };
    }

    await ctx.db.insert("reactions", {
      postId: args.postId,
      userId: user._id,
      emoji: args.emoji,
      createdAt: Date.now()
    });

    return { reacted: true };
  }
});
