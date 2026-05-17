import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import {
  canModerateRoom,
  createNotification,
  getCurrentUser,
  getCurrentUserOrThrow,
  getMembership,
  getRoomWithMembershipOrThrow,
  logModerationAction,
  sanitizeAuthor
} from "./lib";
import { postTypeValidator } from "./schema";

export const getByRoom = query({
  args: {
    roomId: v.id("rooms"),
    postType: v.optional(v.string()),
    limit: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);
    if (!currentUser) {
      return [];
    }

    const membership = await getMembership(ctx, args.roomId, currentUser._id);
    if (!membership || membership.isBanned) {
      return [];
    }

    const posts = await ctx.db
      .query("posts")
      .withIndex("by_roomId_createdAt", (query) => query.eq("roomId", args.roomId))
      .order("desc")
      .take(args.limit ?? 50);

    const filteredPosts = posts.filter(
      (post) =>
        !post.isDeleted &&
        !post.isHidden &&
        (!args.postType || post.type === args.postType)
    );

    return Promise.all(
      filteredPosts.map(async (post) => {
        const author = post.authorId ? await ctx.db.get(post.authorId) : null;
        return {
          ...post,
          ...sanitizeAuthor(post, author)
        };
      })
    );
  }
});

export const getPinnedPosts = query({
  args: { roomId: v.id("rooms") },
  handler: async (ctx, args) => {
    const posts = await ctx.db
      .query("posts")
      .withIndex("by_roomId_pinned", (query) => query.eq("roomId", args.roomId).eq("isPinned", true))
      .collect();

    return posts.filter((post) => !post.isDeleted && !post.isHidden);
  }
});

export const getById = query({
  args: { postId: v.id("posts") },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);
    if (!currentUser) {
      return null;
    }

    const post = await ctx.db.get(args.postId);
    if (!post || post.isDeleted || post.isHidden) {
      return null;
    }

    const membership = await getMembership(ctx, post.roomId, currentUser._id);
    if (!membership || membership.isBanned) {
      return null;
    }

    const author = post.authorId ? await ctx.db.get(post.authorId) : null;
    return {
      ...post,
      ...sanitizeAuthor(post, author)
    };
  }
});

export const getUpcomingDeadlines = query({
  args: { roomId: v.optional(v.id("rooms")) },
  handler: async (ctx, args) => {
    const now = Date.now();
    const posts = args.roomId
      ? await ctx.db
          .query("posts")
          .withIndex("by_roomId_type", (query) => query.eq("roomId", args.roomId!).eq("type", "deadline"))
          .collect()
      : await ctx.db.query("posts").withIndex("by_type", (query) => query.eq("type", "deadline")).collect();

    return posts
      .filter((post) => !post.isDeleted && !post.isHidden && !!post.deadlineDate && post.deadlineDate > now)
      .sort((a, b) => (a.deadlineDate ?? 0) - (b.deadlineDate ?? 0));
  }
});

export const getUserVote = query({
  args: { postId: v.id("posts") },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      return null;
    }

    return ctx.db
      .query("votes")
      .withIndex("by_targetId_userId", (query) => query.eq("targetId", args.postId).eq("userId", user._id))
      .unique();
  }
});

export const getPostReactions = query({
  args: { postId: v.id("posts") },
  handler: async (ctx, args) => {
    const reactions = await ctx.db
      .query("reactions")
      .withIndex("by_postId", (query) => query.eq("postId", args.postId))
      .collect();

    const grouped = new Map<string, { emoji: string; count: number; userIds: string[] }>();
    for (const reaction of reactions) {
      const current = grouped.get(reaction.emoji) ?? { emoji: reaction.emoji, count: 0, userIds: [] };
      current.count += 1;
      current.userIds.push(reaction.userId);
      grouped.set(reaction.emoji, current);
    }

    return [...grouped.values()].sort((a, b) => b.count - a.count);
  }
});

export const getReportedPosts = query({
  args: { roomId: v.id("rooms") },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      throw new Error("Unauthenticated");
    }

    const membership = await getMembership(ctx, args.roomId, user._id);
    if (!canModerateRoom(user, membership)) {
      throw new Error("Teacher only");
    }

    return ctx.db
      .query("posts")
      .withIndex("by_roomId_isReported", (query) => query.eq("roomId", args.roomId).eq("isReported", true))
      .collect();
  }
});

export const getSavedPosts = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      return [];
    }

    const savedEntries = await ctx.db
      .query("savedPosts")
      .withIndex("by_userId", (query) => query.eq("userId", user._id))
      .collect();

    const posts = await Promise.all(savedEntries.map((entry) => ctx.db.get(entry.postId)));
    const filteredPosts = posts.filter((post): post is NonNullable<typeof post> => post !== null && !post.isDeleted);

    return Promise.all(
      filteredPosts.map(async (post) => {
        const author = post.authorId ? await ctx.db.get(post.authorId) : null;
        return {
          ...post,
          ...sanitizeAuthor(post, author)
        };
      })
    );
  }
});

export const search = query({
  args: {
    searchQuery: v.string(),
    roomId: v.optional(v.id("rooms")),
    postType: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user || args.searchQuery.trim().length < 2) {
      return [];
    }

    const memberships = await ctx.db
      .query("roomMembers")
      .withIndex("by_userId", (query) => query.eq("userId", user._id))
      .collect();
    const allowedRoomIds = new Set(memberships.filter((membership) => !membership.isBanned).map((membership) => membership.roomId));

    const posts = args.roomId
      ? await ctx.db.query("posts").withIndex("by_roomId", (query) => query.eq("roomId", args.roomId!)).collect()
      : await ctx.db.query("posts").collect();

    const searchQuery = args.searchQuery.toLowerCase();
    const matched = posts.filter((post) => {
      if (post.isDeleted || post.isHidden || !allowedRoomIds.has(post.roomId)) {
        return false;
      }

      if (args.postType && post.type !== args.postType) {
        return false;
      }

      const haystacks = [post.content, post.deadlineTitle, post.resourceTitle, ...(post.tags ?? [])].filter(Boolean);
      return haystacks.some((value) => value!.toLowerCase().includes(searchQuery));
    });

    return Promise.all(
      matched.slice(0, 30).map(async (post) => {
        const room = await ctx.db.get(post.roomId);
        const author = post.authorId ? await ctx.db.get(post.authorId) : null;
        return {
          ...post,
          room,
          ...sanitizeAuthor(post, author)
        };
      })
    );
  }
});

export const getSearchSuggestions = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      return [];
    }

    const memberships = await ctx.db
      .query("roomMembers")
      .withIndex("by_userId", (query) => query.eq("userId", user._id))
      .collect();
    const allowedRoomIds = new Set(memberships.filter((membership) => !membership.isBanned).map((membership) => membership.roomId));
    const posts = await ctx.db.query("posts").collect();
    const tagCounts = new Map<string, number>();

    for (const post of posts) {
      if (post.isDeleted || post.isHidden || !allowedRoomIds.has(post.roomId)) {
        continue;
      }

      for (const tag of post.tags ?? []) {
        const normalized = tag.trim().toLowerCase();
        if (normalized.length < 3) {
          continue;
        }
        tagCounts.set(normalized, (tagCounts.get(normalized) ?? 0) + 1);
      }
    }

    return [...tagCounts.entries()]
      .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
      .slice(0, 6)
      .map(([term]) => term);
  }
});

export const create = mutation({
  args: {
    roomId: v.id("rooms"),
    content: v.string(),
    type: postTypeValidator,
    isAnonymous: v.boolean(),
    tags: v.optional(v.array(v.string())),
    deadlineDate: v.optional(v.number()),
    deadlineTitle: v.optional(v.string()),
    resourceUrl: v.optional(v.string()),
    resourceTitle: v.optional(v.string()),
    resourceType: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);
    const { room, membership } = await getRoomWithMembershipOrThrow(ctx, args.roomId, user._id);

    if (room.isArchived) {
      throw new Error("Room is archived");
    }

    if (membership.isMuted && (!membership.mutedUntil || membership.mutedUntil > Date.now())) {
      throw new Error("You are muted in this room");
    }

    if (args.type === "announcement" && user.role !== "teacher" && user.role !== "super_admin") {
      throw new Error("Only teachers can post announcements");
    }

    if (!room.allowAnonymous && args.isAnonymous) {
      throw new Error("Anonymous posting is disabled in this room");
    }

    const content = args.content.trim();
    if (!content) {
      throw new Error("Content is empty");
    }
    if (content.length > 2000) {
      throw new Error("Post too long");
    }

    const now = Date.now();
    const postId = await ctx.db.insert("posts", {
      roomId: args.roomId,
      authorId: args.isAnonymous ? undefined : user._id,
      content,
      type: args.type,
      deadlineDate: args.deadlineDate,
      deadlineTitle: args.deadlineTitle?.trim() || undefined,
      resourceUrl: args.resourceUrl?.trim() || undefined,
      resourceTitle: args.resourceTitle?.trim() || undefined,
      resourceType: args.resourceType?.trim() || undefined,
      tags: args.tags?.map((tag) => tag.trim()).filter(Boolean),
      upvoteCount: 0,
      commentCount: 0,
      shareCount: 0,
      isPinned: args.type === "announcement",
      isResolved: false,
      isAnonymous: args.isAnonymous,
      isEdited: false,
      isHidden: false,
      isDeleted: false,
      isReported: false,
      reportCount: 0,
      isFlagged: false,
      createdAt: now
    });

    await ctx.db.patch(room._id, {
      postCount: room.postCount + 1,
      lastPostAt: now,
      pinnedPostId: args.type === "announcement" ? postId : room.pinnedPostId,
      updatedAt: now
    });

    await ctx.db.patch(user._id, {
      postCount: (user.postCount ?? 0) + 1
    });

    await ctx.db.patch(membership._id, {
      lastSeenAt: now
    });

    const members = await ctx.db
      .query("roomMembers")
      .withIndex("by_roomId", (query) => query.eq("roomId", args.roomId))
      .collect();

    for (const member of members) {
      if (member.userId === user._id || member.isBanned) {
        continue;
      }
      if (args.type !== "announcement" && !member.notificationsEnabled) {
        continue;
      }

      await createNotification(ctx, {
        userId: member.userId,
        type: args.type === "announcement" ? "announcement" : "new_post",
        postId,
        roomId: args.roomId,
        fromUserId: args.isAnonymous ? undefined : user._id,
        message:
          args.type === "announcement"
            ? `New announcement in ${room.name}`
            : args.isAnonymous
              ? `Anonymous posted in ${room.name}`
              : `${user.name} posted in ${room.name}`,
        isRead: false,
        createdAt: now
      });
    }

    return postId;
  }
});

export const editPost = mutation({
  args: {
    postId: v.id("posts"),
    content: v.string(),
    tags: v.optional(v.array(v.string()))
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);
    const post = await ctx.db.get(args.postId);
    if (!post || post.isDeleted) {
      throw new Error("Post not found");
    }
    if (post.isAnonymous || post.authorId !== user._id) {
      throw new Error("Permission denied");
    }
    if (Date.now() - post.createdAt > 24 * 60 * 60 * 1000) {
      throw new Error("Posts can only be edited within 24 hours");
    }

    const content = args.content.trim();
    if (!content) {
      throw new Error("Content is empty");
    }

    await ctx.db.patch(post._id, {
      content,
      tags: args.tags?.map((tag) => tag.trim()).filter(Boolean),
      isEdited: true,
      editedAt: Date.now()
    });
  }
});

export const hidePost = mutation({
  args: { postId: v.id("posts") },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);
    const post = await ctx.db.get(args.postId);
    if (!post || post.isDeleted) {
      throw new Error("Post not found");
    }
    if (post.isAnonymous || post.authorId !== user._id) {
      throw new Error("Permission denied");
    }

    await ctx.db.patch(post._id, { isHidden: !post.isHidden });
  }
});

export const togglePin = mutation({
  args: { postId: v.id("posts") },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);
    const post = await ctx.db.get(args.postId);
    if (!post) {
      throw new Error("Post not found");
    }

    const membership = await getMembership(ctx, post.roomId, user._id);
    if (!canModerateRoom(user, membership)) {
      throw new Error("Permission denied");
    }

    const nextPinned = !post.isPinned;
    await ctx.db.patch(post._id, { isPinned: nextPinned });

    const room = await ctx.db.get(post.roomId);
    if (room) {
      await ctx.db.patch(room._id, {
        pinnedPostId: nextPinned ? post._id : room.pinnedPostId === post._id ? undefined : room.pinnedPostId,
        updatedAt: Date.now()
      });
    }

    await logModerationAction(ctx, {
      roomId: post.roomId,
      actorId: user._id,
      targetPostId: post._id,
      action: nextPinned ? "pin_post" : "unpin_post"
    });

    if (nextPinned && post.authorId && post.authorId !== user._id) {
      await createNotification(ctx, {
        userId: post.authorId,
        type: "pinned",
        postId: post._id,
        roomId: post.roomId,
        fromUserId: user._id,
        message: `Your post was pinned by ${user.name}`,
        isRead: false,
        createdAt: Date.now()
      });
    }
  }
});

export const markResolved = mutation({
  args: { postId: v.id("posts") },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);
    const post = await ctx.db.get(args.postId);
    if (!post) {
      throw new Error("Post not found");
    }

    const canResolve =
      (!post.isAnonymous && post.authorId === user._id) ||
      user.role === "teacher" ||
      user.role === "super_admin";
    if (!canResolve) {
      throw new Error("Permission denied");
    }

    await ctx.db.patch(post._id, { isResolved: true });
    await logModerationAction(ctx, {
      roomId: post.roomId,
      actorId: user._id,
      targetPostId: post._id,
      action: "resolve_question"
    });

    if (post.authorId && post.authorId !== user._id) {
      await createNotification(ctx, {
        userId: post.authorId,
        type: "question_answered",
        postId: post._id,
        roomId: post.roomId,
        fromUserId: user._id,
        message: `${user.name} marked your question as resolved`,
        isRead: false,
        createdAt: Date.now()
      });
    }
  }
});

export const flagPost = mutation({
  args: {
    postId: v.id("posts"),
    reason: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);
    const post = await ctx.db.get(args.postId);
    if (!post) {
      throw new Error("Post not found");
    }

    const membership = await getMembership(ctx, post.roomId, user._id);
    if (!canModerateRoom(user, membership)) {
      throw new Error("Permission denied");
    }

    await ctx.db.patch(post._id, {
      isFlagged: true,
      flagReason: args.reason?.trim() || undefined
    });

    await logModerationAction(ctx, {
      roomId: post.roomId,
      actorId: user._id,
      targetPostId: post._id,
      action: "flag_post",
      reason: args.reason?.trim() || undefined
    });
  }
});

export const reportPost = mutation({
  args: { postId: v.id("posts") },
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

    await ctx.db.patch(post._id, {
      isReported: true,
      reportCount: (post.reportCount ?? 0) + 1
    });
  }
});

export const remove = mutation({
  args: {
    postId: v.id("posts"),
    reason: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);
    const post = await ctx.db.get(args.postId);
    if (!post) {
      throw new Error("Post not found");
    }

    const membership = await getMembership(ctx, post.roomId, user._id);
    const canDelete =
      (!post.isAnonymous && post.authorId === user._id) || canModerateRoom(user, membership);
    if (!canDelete) {
      throw new Error("Permission denied");
    }

    await ctx.db.patch(post._id, {
      isDeleted: true,
      deletedBy: user._id,
      deletedAt: Date.now()
    });

    if (post.authorId && post.authorId !== user._id) {
      await logModerationAction(ctx, {
        roomId: post.roomId,
        actorId: user._id,
        targetPostId: post._id,
        action: "delete_post",
        reason: args.reason?.trim() || undefined
      });
    }
  }
});

export const repost = mutation({
  args: {
    originalPostId: v.id("posts"),
    targetRoomId: v.optional(v.id("rooms"))
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);
    const originalPost = await ctx.db.get(args.originalPostId);
    if (!originalPost || originalPost.isDeleted) {
      throw new Error("Post not found");
    }

    const targetRoomId = args.targetRoomId ?? originalPost.roomId;
    const { room: targetRoom } = await getRoomWithMembershipOrThrow(ctx, targetRoomId, user._id);
    if (targetRoom.isArchived) {
      throw new Error("Target room is archived");
    }

    const now = Date.now();
    const newPostId = await ctx.db.insert("posts", {
      roomId: targetRoomId,
      authorId: user._id,
      content: originalPost.content,
      type: originalPost.type,
      deadlineDate: originalPost.deadlineDate,
      deadlineTitle: originalPost.deadlineTitle,
      resourceUrl: originalPost.resourceUrl,
      resourceTitle: originalPost.resourceTitle,
      resourceType: originalPost.resourceType,
      tags: originalPost.tags,
      upvoteCount: 0,
      commentCount: 0,
      shareCount: 0,
      isPinned: false,
      isResolved: false,
      isAnonymous: false,
      isEdited: false,
      isHidden: false,
      isDeleted: false,
      isReported: false,
      reportCount: 0,
      isFlagged: false,
      createdAt: now
    });

    await ctx.db.insert("postShares", {
      originalPostId: args.originalPostId,
      sharedByUserId: user._id,
      targetRoomId: args.targetRoomId,
      shareType: args.targetRoomId ? "cross_room" : "repost",
      newPostId,
      createdAt: now
    });

    await ctx.db.patch(originalPost._id, {
      shareCount: (originalPost.shareCount ?? 0) + 1
    });

    await ctx.db.patch(targetRoom._id, {
      postCount: targetRoom.postCount + 1,
      lastPostAt: now,
      updatedAt: now
    });

    return newPostId;
  }
});

export const savePost = mutation({
  args: { postId: v.id("posts") },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);
    const existing = await ctx.db
      .query("savedPosts")
      .withIndex("by_userId_postId", (query) => query.eq("userId", user._id).eq("postId", args.postId))
      .unique();

    if (existing) {
      await ctx.db.delete(existing._id);
      return { saved: false };
    }

    await ctx.db.insert("savedPosts", {
      userId: user._id,
      postId: args.postId,
      createdAt: Date.now()
    });
    return { saved: true };
  }
});
