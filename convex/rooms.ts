import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getCurrentUser, getCurrentUserOrThrow, getMembership, canModerateRoom, logModerationAction } from "./lib";

function generateJoinCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

export const getMyRooms = query({
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

    const rooms = await Promise.all(
      memberships.filter((membership) => !membership.isBanned).map((membership) => ctx.db.get(membership.roomId))
    );
    return rooms
      .filter((room): room is NonNullable<typeof room> => room !== null && !room.isArchived)
      .sort((a, b) => (b.lastPostAt ?? 0) - (a.lastPostAt ?? 0));
  }
});

export const getById = query({
  args: { roomId: v.id("rooms") },
  handler: async (ctx, args) => ctx.db.get(args.roomId)
});

export const getPublicRooms = query({
  args: { batch: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const rooms = args.batch
      ? await ctx.db.query("rooms").withIndex("by_batch", (query) => query.eq("batch", args.batch!)).collect()
      : await ctx.db.query("rooms").collect();

    return rooms.filter((room) => room.isPublic && !room.isArchived);
  }
});

export const getUnreadCount = query({
  args: { roomId: v.id("rooms") },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      return 0;
    }

    const membership = await getMembership(ctx, args.roomId, user._id);
    if (!membership) {
      return 0;
    }

    const posts = await ctx.db
      .query("posts")
      .withIndex("by_roomId_createdAt", (query) =>
        query.eq("roomId", args.roomId).gt("createdAt", membership.lastSeenAt)
      )
      .collect();

    return posts.filter((post) => !post.isDeleted).length;
  }
});

export const getTotalUnreadCount = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      return 0;
    }

    const memberships = await ctx.db
      .query("roomMembers")
      .withIndex("by_userId", (query) => query.eq("userId", user._id))
      .collect();

    let total = 0;
    for (const membership of memberships) {
      const posts = await ctx.db
        .query("posts")
        .withIndex("by_roomId_createdAt", (query) =>
          query.eq("roomId", membership.roomId).gt("createdAt", membership.lastSeenAt)
        )
        .collect();

      total += posts.filter((post) => !post.isDeleted).length;
    }

    return total;
  }
});

export const create = mutation({
  args: {
    name: v.string(),
    subject: v.string(),
    batch: v.string(),
    description: v.optional(v.string()),
    isPublic: v.boolean(),
    color: v.string(),
    emoji: v.string(),
    allowAnonymous: v.optional(v.boolean()),
    aiEnabled: v.optional(v.boolean()),
    allowStudentInvite: v.optional(v.boolean())
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);
    const now = Date.now();

    const roomId = await ctx.db.insert("rooms", {
      name: args.name.trim(),
      subject: args.subject.trim(),
      batch: args.batch,
      description: args.description?.trim() || undefined,
      createdBy: user._id,
      isPublic: args.isPublic,
      isArchived: false,
      color: args.color,
      emoji: args.emoji,
      joinCode: args.isPublic ? undefined : generateJoinCode(),
      allowStudentInvite: args.allowStudentInvite ?? false,
      allowAnonymous: args.allowAnonymous ?? true,
      aiEnabled: args.aiEnabled ?? false,
      memberCount: 1,
      postCount: 0,
      lastPostAt: undefined,
      createdAt: now,
      updatedAt: now
    });

    await ctx.db.insert("roomMembers", {
      roomId,
      userId: user._id,
      role: "owner",
      lastSeenAt: now,
      joinedAt: now,
      notificationsEnabled: true,
      isMuted: false,
      isBanned: false
    });

    await ctx.db.patch(user._id, {
      roomsJoined: (user.roomsJoined ?? 0) + 1
    });

    return roomId;
  }
});

export const join = mutation({
  args: {
    roomId: v.optional(v.id("rooms")),
    joinCode: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);
    const room = args.joinCode
      ? await ctx.db
          .query("rooms")
          .withIndex("by_joinCode", (query) => query.eq("joinCode", args.joinCode!.trim().toUpperCase()))
          .unique()
      : args.roomId
        ? await ctx.db.get(args.roomId)
        : null;

    if (!room) {
      throw new Error("Room not found");
    }

    if (room.isArchived) {
      throw new Error("Room is archived");
    }

    const existing = await getMembership(ctx, room._id, user._id);
    if (existing) {
      if (existing.isBanned) {
        throw new Error("You are banned from this room");
      }
      return room._id;
    }

    const now = Date.now();
    await ctx.db.insert("roomMembers", {
      roomId: room._id,
      userId: user._id,
      role: "member",
      lastSeenAt: now,
      joinedAt: now,
      notificationsEnabled: true,
      isMuted: false,
      isBanned: false
    });

    await ctx.db.patch(room._id, {
      memberCount: room.memberCount + 1
    });

    await ctx.db.patch(user._id, {
      roomsJoined: (user.roomsJoined ?? 0) + 1
    });

    return room._id;
  }
});

export const markSeen = mutation({
  args: { roomId: v.id("rooms") },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      return;
    }

    const membership = await getMembership(ctx, args.roomId, user._id);
    if (membership) {
      await ctx.db.patch(membership._id, {
        lastSeenAt: Date.now()
      });
    }

    await ctx.db.patch(user._id, {
      lastActiveAt: Date.now(),
      isOnline: true
    });
  }
});

export const getMembers = query({
  args: { roomId: v.id("rooms") },
  handler: async (ctx, args) => {
    const memberships = await ctx.db
      .query("roomMembers")
      .withIndex("by_roomId", (query) => query.eq("roomId", args.roomId))
      .collect();

    const enriched = await Promise.all(
      memberships.map(async (membership) => {
        const user = await ctx.db.get(membership.userId);
        return user ? { ...membership, user } : null;
      })
    );

    return enriched.filter((member): member is NonNullable<typeof member> => member !== null);
  }
});

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
    isArchived: v.optional(v.boolean())
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);
    const membership = await getMembership(ctx, args.roomId, user._id);
    const room = await ctx.db.get(args.roomId);

    if (!room) {
      throw new Error("Room not found");
    }

    const canEdit = user.role === "teacher" || user.role === "super_admin" || membership?.role === "owner";
    if (!canEdit) {
      throw new Error("Permission denied");
    }

    const { roomId, ...updates } = args;
    await ctx.db.patch(roomId, {
      ...updates,
      updatedAt: Date.now(),
      joinCode:
        args.isPublic === undefined
          ? room.joinCode
          : args.isPublic
            ? undefined
            : room.joinCode ?? generateJoinCode()
    });
  }
});

export const setMemberRole = mutation({
  args: {
    roomId: v.id("rooms"),
    targetUserId: v.id("users"),
    newRole: v.union(v.literal("member"), v.literal("moderator"))
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);
    const actorMembership = await getMembership(ctx, args.roomId, user._id);

    if (user.role !== "teacher" && actorMembership?.role !== "owner") {
      throw new Error("Owner or teacher only");
    }

    const targetMembership = await getMembership(ctx, args.roomId, args.targetUserId);
    if (!targetMembership) {
      throw new Error("Member not found");
    }

    await ctx.db.patch(targetMembership._id, { role: args.newRole });
    await logModerationAction(ctx, {
      roomId: args.roomId,
      actorId: user._id,
      targetUserId: args.targetUserId,
      action: args.newRole === "moderator" ? "promote_moderator" : "demote_moderator"
    });
  }
});

export const muteOrBanMember = mutation({
  args: {
    roomId: v.id("rooms"),
    targetUserId: v.id("users"),
    action: v.union(v.literal("mute"), v.literal("ban"), v.literal("unmute"), v.literal("unban")),
    reason: v.optional(v.string()),
    muteDurationHours: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);
    const actorMembership = await getMembership(ctx, args.roomId, user._id);

    if (!canModerateRoom(user, actorMembership)) {
      throw new Error("Permission denied");
    }

    const targetMembership = await getMembership(ctx, args.roomId, args.targetUserId);
    if (!targetMembership) {
      throw new Error("Member not found");
    }

    const now = Date.now();
    if (args.action === "mute") {
      await ctx.db.patch(targetMembership._id, {
        isMuted: true,
        mutedUntil: args.muteDurationHours ? now + args.muteDurationHours * 60 * 60 * 1000 : undefined
      });
    } else if (args.action === "unmute") {
      await ctx.db.patch(targetMembership._id, {
        isMuted: false,
        mutedUntil: undefined
      });
    } else if (args.action === "ban") {
      await ctx.db.patch(targetMembership._id, {
        isBanned: true,
        bannedBy: user._id,
        bannedAt: now,
        banReason: args.reason?.trim() || undefined
      });
    } else {
      await ctx.db.patch(targetMembership._id, {
        isBanned: false,
        bannedBy: undefined,
        bannedAt: undefined,
        banReason: undefined
      });
    }

    await logModerationAction(ctx, {
      roomId: args.roomId,
      actorId: user._id,
      targetUserId: args.targetUserId,
      action:
        args.action === "mute"
          ? "mute_member"
          : args.action === "unmute"
            ? "unmute_member"
            : args.action === "ban"
              ? "ban_member"
              : "unban_member",
      reason: args.reason?.trim() || undefined
    });
  }
});
