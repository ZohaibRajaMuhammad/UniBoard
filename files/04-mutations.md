# 04 — Convex Mutations (Complete)

## Helper: Permission Guard Pattern

Every mutation reuses this pattern. Keep it DRY with an internal helper:

```typescript
// convex/_utils.ts (internal, not exported to client)
import { MutationCtx } from "./_generated/server";
import { Id } from "./_generated/dataModel";

export async function requireAuth(ctx: MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("UNAUTHENTICATED");

  const user = await ctx.db
    .query("users")
    .withIndex("by_clerkId", q => q.eq("clerkId", identity.subject))
    .unique();
  if (!user) throw new Error("USER_NOT_FOUND");

  return user;
}

export async function requireRoomMembership(
  ctx: MutationCtx,
  userId: Id<"users">,
  roomId: Id<"rooms">
) {
  const membership = await ctx.db
    .query("roomMembers")
    .withIndex("by_roomId_userId", q =>
      q.eq("roomId", roomId).eq("userId", userId))
    .unique();

  if (!membership || membership.isBanned) throw new Error("NOT_A_MEMBER");
  return membership;
}

export async function requireTeacher(ctx: MutationCtx) {
  const user = await requireAuth(ctx);
  if (user.role !== "teacher" && user.role !== "super_admin") {
    throw new Error("TEACHER_ONLY");
  }
  return user;
}

export async function logModerationAction(
  ctx: MutationCtx,
  data: {
    roomId: Id<"rooms">;
    actorId: Id<"users">;
    action: string;
    targetPostId?: Id<"posts">;
    targetUserId?: Id<"users">;
    reason?: string;
  }
) {
  await ctx.db.insert("moderationLogs", {
    ...data,
    action: data.action as any,
    createdAt: Date.now(),
  });
}
```

---

## File: `convex/users.ts` — Mutations

```typescript
import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const upsertFromClerk = mutation({
  args: {
    clerkId: v.string(),
    email: v.string(),
    name: v.string(),
    imageUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_clerkId", q => q.eq("clerkId", args.clerkId))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        name: args.name,
        imageUrl: args.imageUrl,
        lastActiveAt: Date.now(),
        isOnline: true,
      });
      return existing._id;
    }

    return ctx.db.insert("users", {
      clerkId: args.clerkId,
      email: args.email,
      name: args.name,
      imageUrl: args.imageUrl,
      role: "pending",
      postCount: 0,
      upvotesReceived: 0,
      roomsJoined: 0,
      badges: [],
      isOnline: true,
      lastActiveAt: Date.now(),
      joinedAt: Date.now(),
    });
  },
});

export const completeOnboarding = mutation({
  args: {
    role: v.union(v.literal("student"), v.literal("teacher")),
    batch: v.string(),
    department: v.optional(v.string()),
    studentId: v.optional(v.string()),
    bio: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", q => q.eq("clerkId", identity.subject))
      .unique();
    if (!user) throw new Error("User not found");

    await ctx.db.patch(user._id, {
      role: args.role,
      batch: args.batch,
      department: args.department,
      studentId: args.studentId,
      bio: args.bio,
      badges: ["early_adopter"],
    });
  },
});

export const updateProfile = mutation({
  args: {
    name: v.optional(v.string()),
    bio: v.optional(v.string()),
    department: v.optional(v.string()),
    studentId: v.optional(v.string()),
    notifPrefs: v.optional(v.object({
      newPost: v.boolean(),
      upvote: v.boolean(),
      comment: v.boolean(),
      announcement: v.boolean(),
      mention: v.boolean(),
    })),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", q => q.eq("clerkId", identity.subject))
      .unique();
    if (!user) throw new Error("User not found");

    const updates: Record<string, any> = {};
    if (args.name !== undefined) updates.name = args.name;
    if (args.bio !== undefined) updates.bio = args.bio;
    if (args.department !== undefined) updates.department = args.department;
    if (args.studentId !== undefined) updates.studentId = args.studentId;
    if (args.notifPrefs !== undefined) updates.notifPrefs = args.notifPrefs;

    await ctx.db.patch(user._id, updates);
  },
});

export const updatePresence = mutation({
  args: { isOnline: v.boolean() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return;

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", q => q.eq("clerkId", identity.subject))
      .unique();
    if (!user) return;

    await ctx.db.patch(user._id, {
      isOnline: args.isOnline,
      lastActiveAt: Date.now(),
    });
  },
});
```

---

## File: `convex/rooms.ts` — Mutations

```typescript
import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { nanoid } from "nanoid"; // npm install nanoid

export const create = mutation({
  args: {
    name: v.string(),
    subject: v.string(),
    batch: v.string(),
    description: v.optional(v.string()),
    isPublic: v.boolean(),
    color: v.string(),
    emoji: v.string(),
    allowAnonymous: v.boolean(),
    aiEnabled: v.boolean(),
    allowStudentInvite: v.boolean(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", q => q.eq("clerkId", identity.subject))
      .unique();
    if (!user) throw new Error("User not found");

    const joinCode = args.isPublic ? undefined : nanoid(6).toUpperCase();
    const now = Date.now();

    const roomId = await ctx.db.insert("rooms", {
      name: args.name,
      subject: args.subject,
      batch: args.batch,
      description: args.description,
      createdBy: user._id,
      isPublic: args.isPublic,
      isArchived: false,
      color: args.color,
      emoji: args.emoji,
      memberCount: 1,
      postCount: 0,
      allowAnonymous: args.allowAnonymous,
      aiEnabled: args.aiEnabled,
      allowStudentInvite: args.allowStudentInvite,
      joinCode,
      createdAt: now,
      updatedAt: now,
    });

    await ctx.db.insert("roomMembers", {
      roomId,
      userId: user._id,
      role: "owner",
      lastSeenAt: now,
      joinedAt: now,
      notificationsEnabled: true,
      isMuted: false,
      isBanned: false,
    });

    await ctx.db.patch(user._id, { roomsJoined: user.roomsJoined + 1 });
    return roomId;
  },
});

export const join = mutation({
  args: {
    roomId: v.optional(v.id("rooms")),
    joinCode: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", q => q.eq("clerkId", identity.subject))
      .unique();
    if (!user) throw new Error("User not found");

    let room;
    if (args.joinCode) {
      room = await ctx.db
        .query("rooms")
        .withIndex("by_joinCode", q => q.eq("joinCode", args.joinCode!))
        .unique();
      if (!room) throw new Error("Invalid join code");
    } else if (args.roomId) {
      room = await ctx.db.get(args.roomId);
    }
    if (!room) throw new Error("Room not found");
    if (room.isArchived) throw new Error("Room is archived");

    const existing = await ctx.db
      .query("roomMembers")
      .withIndex("by_roomId_userId", q =>
        q.eq("roomId", room!._id).eq("userId", user._id))
      .unique();

    if (existing?.isBanned) throw new Error("You are banned from this room");
    if (existing) return room._id; // Already a member

    const now = Date.now();
    await ctx.db.insert("roomMembers", {
      roomId: room._id,
      userId: user._id,
      role: "member",
      lastSeenAt: now,
      joinedAt: now,
      notificationsEnabled: true,
      isMuted: false,
      isBanned: false,
    });

    await ctx.db.patch(room._id, { memberCount: room.memberCount + 1 });
    await ctx.db.patch(user._id, { roomsJoined: user.roomsJoined + 1 });
    return room._id;
  },
});

export const markSeen = mutation({
  args: { roomId: v.id("rooms") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return;

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", q => q.eq("clerkId", identity.subject))
      .unique();
    if (!user) return;

    const membership = await ctx.db
      .query("roomMembers")
      .withIndex("by_roomId_userId", q =>
        q.eq("roomId", args.roomId).eq("userId", user._id))
      .unique();

    const now = Date.now();
    if (membership) {
      await ctx.db.patch(membership._id, { lastSeenAt: now });
    }
    await ctx.db.patch(user._id, { isOnline: true, lastActiveAt: now });
  },
});

// Teacher: update room settings
export const updateSettings = mutation({
  args: {
    roomId: v.id("rooms"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    emoji: v.optional(v.string()),
    color: v.optional(v.string()),
    isPublic: v.optional(v.boolean()),
    allowAnonymous: v.optional(v.boolean()),
    aiEnabled: v.optional(v.boolean()),
    allowStudentInvite: v.optional(v.boolean()),
    isArchived: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", q => q.eq("clerkId", identity.subject))
      .unique();
    if (!user) throw new Error("User not found");

    const membership = await ctx.db
      .query("roomMembers")
      .withIndex("by_roomId_userId", q =>
        q.eq("roomId", args.roomId).eq("userId", user._id))
      .unique();

    const canEdit =
      user.role === "teacher" ||
      user.role === "super_admin" ||
      membership?.role === "owner";
    if (!canEdit) throw new Error("Permission denied");

    const { roomId, ...updates } = args;
    await ctx.db.patch(roomId, { ...updates, updatedAt: Date.now() });
  },
});

// Teacher: promote a member to moderator
export const setMemberRole = mutation({
  args: {
    roomId: v.id("rooms"),
    targetUserId: v.id("users"),
    newRole: v.union(v.literal("member"), v.literal("moderator")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", q => q.eq("clerkId", identity.subject))
      .unique();
    if (!user) throw new Error("User not found");

    const actorMembership = await ctx.db
      .query("roomMembers")
      .withIndex("by_roomId_userId", q =>
        q.eq("roomId", args.roomId).eq("userId", user._id))
      .unique();

    if (user.role !== "teacher" && actorMembership?.role !== "owner") {
      throw new Error("Owner or teacher only");
    }

    const targetMembership = await ctx.db
      .query("roomMembers")
      .withIndex("by_roomId_userId", q =>
        q.eq("roomId", args.roomId).eq("userId", args.targetUserId))
      .unique();
    if (!targetMembership) throw new Error("Member not found");

    await ctx.db.patch(targetMembership._id, { role: args.newRole });

    await ctx.db.insert("moderationLogs", {
      roomId: args.roomId,
      actorId: user._id,
      targetUserId: args.targetUserId,
      action: args.newRole === "moderator" ? "promote_moderator" : "demote_moderator",
      createdAt: Date.now(),
    });
  },
});

// Teacher: mute/ban member
export const muteOrBanMember = mutation({
  args: {
    roomId: v.id("rooms"),
    targetUserId: v.id("users"),
    action: v.union(v.literal("mute"), v.literal("ban"), v.literal("unmute"), v.literal("unban")),
    reason: v.optional(v.string()),
    muteDurationHours: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", q => q.eq("clerkId", identity.subject))
      .unique();
    if (!user) throw new Error("User not found");

    const actorMembership = await ctx.db
      .query("roomMembers")
      .withIndex("by_roomId_userId", q =>
        q.eq("roomId", args.roomId).eq("userId", user._id))
      .unique();

    const canModerate =
      user.role === "teacher" ||
      user.role === "super_admin" ||
      actorMembership?.role === "owner" ||
      actorMembership?.role === "moderator";
    if (!canModerate) throw new Error("Permission denied");

    const targetMembership = await ctx.db
      .query("roomMembers")
      .withIndex("by_roomId_userId", q =>
        q.eq("roomId", args.roomId).eq("userId", args.targetUserId))
      .unique();
    if (!targetMembership) throw new Error("Member not found");

    const now = Date.now();
    const updates: Record<string, any> = {};

    if (args.action === "mute") {
      updates.isMuted = true;
      updates.mutedUntil = args.muteDurationHours
        ? now + args.muteDurationHours * 3600000
        : undefined;
    } else if (args.action === "ban") {
      updates.isBanned = true;
      updates.bannedBy = user._id;
      updates.bannedAt = now;
      updates.banReason = args.reason;
    } else if (args.action === "unmute") {
      updates.isMuted = false;
      updates.mutedUntil = undefined;
    } else if (args.action === "unban") {
      updates.isBanned = false;
    }

    await ctx.db.patch(targetMembership._id, updates);

    await ctx.db.insert("moderationLogs", {
      roomId: args.roomId,
      actorId: user._id,
      targetUserId: args.targetUserId,
      action: args.action === "mute" ? "mute_member" :
              args.action === "ban" ? "ban_member" :
              args.action === "unmute" ? "unmute_member" : "unban_member",
      reason: args.reason,
      createdAt: now,
    });
  },
});
```

---

## File: `convex/posts.ts` — Mutations

```typescript
import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const create = mutation({
  args: {
    roomId: v.id("rooms"),
    content: v.string(),
    type: v.union(
      v.literal("note"), v.literal("deadline"), v.literal("question"),
      v.literal("resource"), v.literal("announcement"),
      v.literal("poll"), v.literal("project"),
    ),
    isAnonymous: v.boolean(),
    tags: v.optional(v.array(v.string())),
    deadlineDate: v.optional(v.number()),
    deadlineTitle: v.optional(v.string()),
    resourceUrl: v.optional(v.string()),
    resourceTitle: v.optional(v.string()),
    resourceType: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", q => q.eq("clerkId", identity.subject))
      .unique();
    if (!user) throw new Error("User not found");

    const room = await ctx.db.get(args.roomId);
    if (!room) throw new Error("Room not found");
    if (room.isArchived) throw new Error("Room is archived");

    const membership = await ctx.db
      .query("roomMembers")
      .withIndex("by_roomId_userId", q =>
        q.eq("roomId", args.roomId).eq("userId", user._id))
      .unique();

    if (!membership || membership.isBanned) throw new Error("Not a member");
    if (membership.isMuted && (!membership.mutedUntil || membership.mutedUntil > Date.now())) {
      throw new Error("You are muted in this room");
    }

    if (args.type === "announcement" && user.role !== "teacher") {
      throw new Error("Only teachers can post announcements");
    }
    if (!room.allowAnonymous && args.isAnonymous) {
      throw new Error("Anonymous posting is disabled in this room");
    }

    const content = args.content.trim();
    if (!content) throw new Error("Content is empty");
    if (content.length > 2000) throw new Error("Post too long (max 2000 chars)");

    const now = Date.now();
    const postId = await ctx.db.insert("posts", {
      roomId: args.roomId,
      authorId: args.isAnonymous ? undefined : user._id,
      content,
      type: args.type,
      isAnonymous: args.isAnonymous,
      tags: args.tags,
      deadlineDate: args.deadlineDate,
      deadlineTitle: args.deadlineTitle,
      resourceUrl: args.resourceUrl,
      resourceTitle: args.resourceTitle,
      resourceType: args.resourceType,
      upvoteCount: 0,
      commentCount: 0,
      shareCount: 0,
      isPinned: args.type === "announcement",
      isResolved: false,
      isEdited: false,
      isHidden: false,
      isDeleted: false,
      isReported: false,
      reportCount: 0,
      isFlagged: false,
      createdAt: now,
    });

    // Update room counters
    await ctx.db.patch(args.roomId, {
      lastPostAt: now,
      postCount: room.postCount + 1,
    });

    // Update user stats
    await ctx.db.patch(user._id, { postCount: user.postCount + 1 });

    // Create notifications (announcement = notify all; other = notify enabled members)
    const members = await ctx.db
      .query("roomMembers")
      .withIndex("by_roomId", q => q.eq("roomId", args.roomId))
      .collect();

    for (const member of members) {
      if (member.userId === user._id) continue;
      if (args.type !== "announcement" && !member.notificationsEnabled) continue;
      if (member.isBanned || member.isMuted) continue;

      await ctx.db.insert("notifications", {
        userId: member.userId,
        type: "new_post",
        postId,
        roomId: args.roomId,
        fromUserId: args.isAnonymous ? undefined : user._id,
        message: args.type === "announcement"
          ? `📢 New announcement in ${room.name}`
          : args.isAnonymous
          ? `Someone posted in ${room.name}`
          : `${user.name} posted in ${room.name}`,
        isRead: false,
        createdAt: now,
      });
    }

    return postId;
  },
});

export const editPost = mutation({
  args: {
    postId: v.id("posts"),
    content: v.string(),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", q => q.eq("clerkId", identity.subject))
      .unique();
    if (!user) throw new Error("User not found");

    const post = await ctx.db.get(args.postId);
    if (!post || post.isDeleted) throw new Error("Post not found");

    // Only author can edit (not anonymous posts, not if teacher deleted)
    if (post.isAnonymous || post.authorId !== user._id) {
      throw new Error("Permission denied");
    }

    // Can only edit within 24 hours
    if (Date.now() - post.createdAt > 86400000) {
      throw new Error("Posts can only be edited within 24 hours");
    }

    await ctx.db.patch(args.postId, {
      content: args.content.trim(),
      tags: args.tags,
      isEdited: true,
      editedAt: Date.now(),
    });
  },
});

export const hidePost = mutation({
  args: { postId: v.id("posts") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", q => q.eq("clerkId", identity.subject))
      .unique();
    if (!user) throw new Error("User not found");

    const post = await ctx.db.get(args.postId);
    if (!post) throw new Error("Post not found");

    // Only author can hide their own post
    if (!post.isAnonymous && post.authorId !== user._id) {
      throw new Error("Permission denied");
    }

    await ctx.db.patch(args.postId, { isHidden: !post.isHidden });
  },
});

export const togglePin = mutation({
  args: { postId: v.id("posts") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", q => q.eq("clerkId", identity.subject))
      .unique();
    if (!user) throw new Error("User not found");

    const post = await ctx.db.get(args.postId);
    if (!post) throw new Error("Post not found");

    const membership = await ctx.db
      .query("roomMembers")
      .withIndex("by_roomId_userId", q =>
        q.eq("roomId", post.roomId).eq("userId", user._id))
      .unique();

    const canPin =
      user.role === "teacher" ||
      membership?.role === "owner" ||
      membership?.role === "moderator";
    if (!canPin) throw new Error("Permission denied");

    await ctx.db.patch(args.postId, { isPinned: !post.isPinned });

    await ctx.db.insert("moderationLogs", {
      roomId: post.roomId,
      actorId: user._id,
      targetPostId: args.postId,
      action: post.isPinned ? "unpin_post" : "pin_post",
      createdAt: Date.now(),
    });
  },
});

export const markResolved = mutation({
  args: { postId: v.id("posts") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", q => q.eq("clerkId", identity.subject))
      .unique();
    if (!user) throw new Error("User not found");

    const post = await ctx.db.get(args.postId);
    if (!post) throw new Error("Post not found");

    const canResolve =
      (!post.isAnonymous && post.authorId === user._id) ||
      user.role === "teacher";
    if (!canResolve) throw new Error("Permission denied");

    await ctx.db.patch(args.postId, { isResolved: true });

    await ctx.db.insert("moderationLogs", {
      roomId: post.roomId,
      actorId: user._id,
      targetPostId: args.postId,
      action: "resolve_question",
      createdAt: Date.now(),
    });
  },
});

export const flagPost = mutation({
  args: {
    postId: v.id("posts"),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", q => q.eq("clerkId", identity.subject))
      .unique();
    if (!user) throw new Error("User not found");

    const post = await ctx.db.get(args.postId);
    if (!post) throw new Error("Post not found");

    const canFlag = user.role === "teacher" ||
      (await ctx.db
        .query("roomMembers")
        .withIndex("by_roomId_userId", q =>
          q.eq("roomId", post.roomId).eq("userId", user._id))
        .unique())?.role === "moderator";
    if (!canFlag) throw new Error("Moderator or teacher only");

    await ctx.db.patch(args.postId, {
      isFlagged: true,
      flagReason: args.reason,
    });

    await ctx.db.insert("moderationLogs", {
      roomId: post.roomId,
      actorId: user._id,
      targetPostId: args.postId,
      action: "flag_post",
      reason: args.reason,
      createdAt: Date.now(),
    });
  },
});

export const reportPost = mutation({
  args: { postId: v.id("posts") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", q => q.eq("clerkId", identity.subject))
      .unique();
    if (!user) throw new Error("User not found");

    const post = await ctx.db.get(args.postId);
    if (!post) throw new Error("Post not found");

    await ctx.db.patch(args.postId, {
      isReported: true,
      reportCount: post.reportCount + 1,
    });
  },
});

export const remove = mutation({
  args: { postId: v.id("posts"), reason: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", q => q.eq("clerkId", identity.subject))
      .unique();
    if (!user) throw new Error("User not found");

    const post = await ctx.db.get(args.postId);
    if (!post) throw new Error("Post not found");

    const canDelete =
      (!post.isAnonymous && post.authorId === user._id) ||
      user.role === "teacher" ||
      user.role === "super_admin";
    if (!canDelete) throw new Error("Permission denied");

    const now = Date.now();
    await ctx.db.patch(args.postId, {
      isDeleted: true,
      deletedBy: user._id,
      deletedAt: now,
    });

    if (user.role === "teacher" && post.authorId !== user._id) {
      await ctx.db.insert("moderationLogs", {
        roomId: post.roomId,
        actorId: user._id,
        targetPostId: args.postId,
        action: "delete_post",
        reason: args.reason,
        createdAt: now,
      });
    }
  },
});

export const repost = mutation({
  args: {
    originalPostId: v.id("posts"),
    targetRoomId: v.optional(v.id("rooms")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", q => q.eq("clerkId", identity.subject))
      .unique();
    if (!user) throw new Error("User not found");

    const originalPost = await ctx.db.get(args.originalPostId);
    if (!originalPost || originalPost.isDeleted) throw new Error("Post not found");

    const now = Date.now();
    const targetRoom = args.targetRoomId ?? originalPost.roomId;

    // Create the repost
    const newPostId = await ctx.db.insert("posts", {
      roomId: targetRoom,
      authorId: user._id,
      content: originalPost.content,
      type: originalPost.type,
      isAnonymous: false,
      tags: originalPost.tags,
      deadlineDate: originalPost.deadlineDate,
      deadlineTitle: originalPost.deadlineTitle,
      resourceUrl: originalPost.resourceUrl,
      resourceTitle: originalPost.resourceTitle,
      upvoteCount: 0,
      commentCount: 0,
      shareCount: 0,
      isPinned: false,
      isResolved: false,
      isEdited: false,
      isHidden: false,
      isDeleted: false,
      isReported: false,
      reportCount: 0,
      isFlagged: false,
      createdAt: now,
    });

    // Log the share
    await ctx.db.insert("postShares", {
      originalPostId: args.originalPostId,
      sharedByUserId: user._id,
      targetRoomId: args.targetRoomId,
      shareType: args.targetRoomId ? "cross_room" : "repost",
      newPostId,
      createdAt: now,
    });

    // Increment original post share count
    await ctx.db.patch(args.originalPostId, {
      shareCount: originalPost.shareCount + 1,
    });

    return newPostId;
  },
});

export const savePost = mutation({
  args: { postId: v.id("posts") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", q => q.eq("clerkId", identity.subject))
      .unique();
    if (!user) throw new Error("User not found");

    const existing = await ctx.db
      .query("savedPosts")
      .withIndex("by_userId_postId", q =>
        q.eq("userId", user._id).eq("postId", args.postId))
      .unique();

    if (existing) {
      await ctx.db.delete(existing._id);
      return { saved: false };
    } else {
      await ctx.db.insert("savedPosts", {
        userId: user._id,
        postId: args.postId,
        createdAt: Date.now(),
      });
      return { saved: true };
    }
  },
});
```

---

## File: `convex/comments.ts` — Mutations

```typescript
import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const create = mutation({
  args: {
    postId: v.id("posts"),
    content: v.string(),
    isAnonymous: v.boolean(),
    parentCommentId: v.optional(v.id("comments")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", q => q.eq("clerkId", identity.subject))
      .unique();
    if (!user) throw new Error("User not found");

    const post = await ctx.db.get(args.postId);
    if (!post || post.isDeleted) throw new Error("Post not found");

    const content = args.content.trim();
    if (!content || content.length > 500) throw new Error("Invalid content");

    const now = Date.now();
    const commentId = await ctx.db.insert("comments", {
      postId: args.postId,
      roomId: post.roomId,
      authorId: args.isAnonymous ? undefined : user._id,
      content,
      isAnonymous: args.isAnonymous,
      parentCommentId: args.parentCommentId,
      isDeleted: false,
      isEdited: false,
      upvoteCount: 0,
      createdAt: now,
    });

    // Increment post comment count
    await ctx.db.patch(args.postId, { commentCount: post.commentCount + 1 });

    // Notify post author
    if (post.authorId && post.authorId !== user._id) {
      await ctx.db.insert("notifications", {
        userId: post.authorId,
        type: "new_comment",
        postId: args.postId,
        commentId,
        roomId: post.roomId,
        fromUserId: args.isAnonymous ? undefined : user._id,
        message: args.isAnonymous
          ? "Someone commented on your post"
          : `${user.name} commented on your post`,
        isRead: false,
        createdAt: now,
      });
    }

    return commentId;
  },
});

export const deleteComment = mutation({
  args: { commentId: v.id("comments"), reason: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", q => q.eq("clerkId", identity.subject))
      .unique();
    if (!user) throw new Error("User not found");

    const comment = await ctx.db.get(args.commentId);
    if (!comment) throw new Error("Comment not found");

    const canDelete =
      (!comment.isAnonymous && comment.authorId === user._id) ||
      user.role === "teacher";
    if (!canDelete) throw new Error("Permission denied");

    await ctx.db.patch(args.commentId, { isDeleted: true });
  },
});
```

---

## File: `convex/votes.ts` — Mutations

```typescript
import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const togglePostVote = mutation({
  args: { postId: v.id("posts") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", q => q.eq("clerkId", identity.subject))
      .unique();
    if (!user) throw new Error("User not found");

    const post = await ctx.db.get(args.postId);
    if (!post || post.isDeleted) throw new Error("Post not found");

    const existing = await ctx.db
      .query("votes")
      .withIndex("by_targetId_userId", q =>
        q.eq("targetId", args.postId as string).eq("userId", user._id))
      .unique();

    const now = Date.now();

    if (existing) {
      await ctx.db.delete(existing._id);
      await ctx.db.patch(args.postId, {
        upvoteCount: Math.max(0, post.upvoteCount - 1),
      });
      return { voted: false };
    }

    await ctx.db.insert("votes", {
      targetId: args.postId as string,
      targetType: "post",
      userId: user._id,
      createdAt: now,
    });
    await ctx.db.patch(args.postId, { upvoteCount: post.upvoteCount + 1 });

    // Update author stats + notify
    if (post.authorId && post.authorId !== user._id) {
      const author = await ctx.db.get(post.authorId);
      if (author) {
        await ctx.db.patch(post.authorId, {
          upvotesReceived: author.upvotesReceived + 1,
        });
      }
      await ctx.db.insert("notifications", {
        userId: post.authorId,
        type: "upvote",
        postId: args.postId,
        roomId: post.roomId,
        fromUserId: user._id,
        message: `${user.name} upvoted your post`,
        isRead: false,
        createdAt: now,
      });
    }

    return { voted: true };
  },
});

export const toggleReaction = mutation({
  args: {
    postId: v.id("posts"),
    emoji: v.string(),
  },
  handler: async (ctx, args) => {
    const ALLOWED_EMOJIS = ["👍", "❤️", "😂", "🔥", "😮", "😢"];
    if (!ALLOWED_EMOJIS.includes(args.emoji)) throw new Error("Invalid emoji");

    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", q => q.eq("clerkId", identity.subject))
      .unique();
    if (!user) throw new Error("User not found");

    const existing = await ctx.db
      .query("reactions")
      .withIndex("by_postId_userId", q =>
        q.eq("postId", args.postId).eq("userId", user._id))
      .filter(q => q.eq(q.field("emoji"), args.emoji))
      .unique();

    if (existing) {
      await ctx.db.delete(existing._id);
      return { reacted: false };
    }

    await ctx.db.insert("reactions", {
      postId: args.postId,
      userId: user._id,
      emoji: args.emoji,
      createdAt: Date.now(),
    });
    return { reacted: true };
  },
});
```

---

## File: `convex/notifications.ts` — Mutations

```typescript
import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const markRead = mutation({
  args: { notificationId: v.id("notifications") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.notificationId, { isRead: true });
  },
});

export const markAllRead = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return;

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", q => q.eq("clerkId", identity.subject))
      .unique();
    if (!user) return;

    const unread = await ctx.db
      .query("notifications")
      .withIndex("by_userId_isRead", q =>
        q.eq("userId", user._id).eq("isRead", false))
      .collect();

    await Promise.all(unread.map(n => ctx.db.patch(n._id, { isRead: true })));
  },
});
```

---

*Continue to `05-ai-features.md` →*
