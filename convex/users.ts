import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getCurrentUser as getCurrentConvexUser, isTeacherAccessRequested } from "./lib";

export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => getCurrentConvexUser(ctx)
});

export const getById = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => ctx.db.get(args.userId)
});

export const getPublicProfile = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      return null;
    }

    return {
      _id: user._id,
      name: user.name,
      imageUrl: user.imageUrl ?? null,
      bio: user.bio,
      role: user.role,
      batch: user.batch,
      department: user.department,
      postCount: user.postCount,
      upvotesReceived: user.upvotesReceived,
      badges: user.badges,
      joinedAt: user.joinedAt
    };
  }
});

export const getOnlineInRoom = query({
  args: { roomId: v.id("rooms") },
  handler: async (ctx, args) => {
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
    const members = await ctx.db
      .query("roomMembers")
      .withIndex("by_roomId", (query) => query.eq("roomId", args.roomId))
      .collect();

    const activeMembers = members.filter(
      (member) =>
        !member.isBanned &&
        !member.isMuted &&
        member.lastSeenAt > fiveMinutesAgo
    );
    const users = await Promise.all(activeMembers.map((member) => ctx.db.get(member.userId)));

    return users.filter((user): user is NonNullable<typeof user> => user !== null).slice(0, 5);
  }
});

export const upsertFromClerk = mutation({
  args: {
    clerkId: v.string(),
    email: v.string(),
    name: v.string(),
    imageUrl: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (query) => query.eq("clerkId", args.clerkId))
      .unique();

    const now = Date.now();

    if (existing) {
      await ctx.db.patch(existing._id, {
        email: args.email,
        name: args.name,
        imageUrl: args.imageUrl,
        isOnline: true,
        lastActiveAt: now
      });

      return existing._id;
    }

    const existingByEmail = await ctx.db
      .query("users")
      .withIndex("by_email", (query) => query.eq("email", args.email.trim().toLowerCase()))
      .unique();

    if (existingByEmail) {
      await ctx.db.patch(existingByEmail._id, {
        clerkId: args.clerkId,
        email: args.email.trim().toLowerCase(),
        name: args.name,
        imageUrl: args.imageUrl,
        isOnline: true,
        lastActiveAt: now
      });

      return existingByEmail._id;
    }

    return ctx.db.insert("users", {
      clerkId: args.clerkId,
      email: args.email.trim().toLowerCase(),
      name: args.name,
      imageUrl: args.imageUrl,
      role: "pending",
      postCount: 0,
      upvotesReceived: 0,
      roomsJoined: 0,
      badges: [],
      joinedAt: now,
      lastActiveAt: now,
      isOnline: true
    });
  }
});

export const syncCurrentUser = mutation({
  args: {
    email: v.string(),
    name: v.string(),
    imageUrl: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthenticated");
    }

    const existing = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (query) => query.eq("clerkId", identity.subject))
      .unique();

    const now = Date.now();
    const normalizedEmail = args.email.trim().toLowerCase();

    if (existing) {
      await ctx.db.patch(existing._id, {
        email: normalizedEmail,
        name: args.name,
        imageUrl: args.imageUrl,
        isOnline: true,
        lastActiveAt: now
      });

      return existing._id;
    }

    const existingByEmail = normalizedEmail
      ? await ctx.db
          .query("users")
          .withIndex("by_email", (query) => query.eq("email", normalizedEmail))
          .unique()
      : null;

    if (existingByEmail) {
      await ctx.db.patch(existingByEmail._id, {
        clerkId: identity.subject,
        email: normalizedEmail,
        name: args.name,
        imageUrl: args.imageUrl,
        isOnline: true,
        lastActiveAt: now
      });

      return existingByEmail._id;
    }

    return ctx.db.insert("users", {
      clerkId: identity.subject,
      email: normalizedEmail,
      name: args.name,
      imageUrl: args.imageUrl,
      role: "pending",
      postCount: 0,
      upvotesReceived: 0,
      roomsJoined: 0,
      badges: [],
      joinedAt: now,
      lastActiveAt: now,
      isOnline: true
    });
  }
});

export const removeByClerkId = mutation({
  args: {
    clerkId: v.string()
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (query) => query.eq("clerkId", args.clerkId))
      .unique();

    if (!user) {
      return null;
    }

    const memberships = await ctx.db
      .query("roomMembers")
      .withIndex("by_userId", (query) => query.eq("userId", user._id))
      .collect();
    const votes = await ctx.db
      .query("votes")
      .withIndex("by_userId", (query) => query.eq("userId", user._id))
      .collect();
    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_userId", (query) => query.eq("userId", user._id))
      .collect();

    await Promise.all(memberships.map((membership) => ctx.db.delete(membership._id)));
    await Promise.all(votes.map((vote) => ctx.db.delete(vote._id)));
    await Promise.all(notifications.map((notification) => ctx.db.delete(notification._id)));
    await ctx.db.delete(user._id);

    return user._id;
  }
});

export const completeOnboarding = mutation({
  args: {
    role: v.union(v.literal("student"), v.literal("teacher")),
    batch: v.string(),
    department: v.optional(v.string()),
    studentId: v.optional(v.string()),
    bio: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    const user = await getCurrentConvexUser(ctx);
    if (!user) {
      throw new Error("Unauthenticated");
    }

    const nextBadges = new Set(user.badges ?? []);
    nextBadges.add("early_adopter");
    nextBadges.add("onboarding_complete");

    if (args.role === "teacher") {
      nextBadges.add("teacher_access_requested");
    } else {
      nextBadges.delete("teacher_access_requested");
      nextBadges.add("student_verified");
    }

    await ctx.db.patch(user._id, {
      role: args.role === "teacher" ? "pending" : "student",
      batch: args.batch,
      department: args.department,
      studentId: args.studentId,
      bio: args.bio,
      badges: [...nextBadges]
    });
  }
});

export const listTeacherAccessRequests = query({
  args: {},
  handler: async (ctx) => {
    const actor = await getCurrentConvexUser(ctx);
    if (!actor || actor.role !== "super_admin") {
      return [];
    }

    const users = await ctx.db.query("users").withIndex("by_role", (query) => query.eq("role", "pending")).collect();
    return users
      .filter((user) => isTeacherAccessRequested(user))
      .sort((left, right) => right.joinedAt - left.joinedAt)
      .map((user) => ({
        _id: user._id,
        name: user.name,
        email: user.email,
        batch: user.batch ?? "",
        department: user.department ?? "",
        bio: user.bio ?? "",
        joinedAt: user.joinedAt,
        badges: user.badges ?? []
      }));
  }
});

export const listGovernanceUsers = query({
  args: {},
  handler: async (ctx) => {
    const actor = await getCurrentConvexUser(ctx);
    if (!actor || actor.role !== "super_admin") {
      return [];
    }

    const users = await ctx.db.query("users").collect();
    return users
      .sort((left, right) => right.joinedAt - left.joinedAt)
      .slice(0, 50)
      .map((user) => ({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        batch: user.batch ?? "",
        department: user.department ?? "",
        joinedAt: user.joinedAt,
        badges: user.badges ?? [],
        theme: user.theme ?? "dark"
      }));
  }
});

export const setUserRoleBySuperAdmin = mutation({
  args: {
    userId: v.id("users"),
    role: v.union(v.literal("student"), v.literal("teacher"))
  },
  handler: async (ctx, args) => {
    const actor = await getCurrentConvexUser(ctx);
    if (!actor || actor.role !== "super_admin") {
      throw new Error("Super admin only");
    }

    const target = await ctx.db.get(args.userId);
    if (!target) {
      throw new Error("User not found");
    }

    const nextBadges = new Set(target.badges ?? []);
    nextBadges.add("onboarding_complete");
    nextBadges.delete("teacher_access_requested");

    if (args.role === "teacher") {
      nextBadges.add("teacher_verified");
    } else {
      nextBadges.add("student_verified");
    }

    await ctx.db.patch(target._id, {
      role: args.role,
      badges: [...nextBadges]
    });
  }
});

export const updateProfile = mutation({
  args: {
    name: v.optional(v.string()),
    bio: v.optional(v.string()),
    department: v.optional(v.string()),
    studentId: v.optional(v.string()),
    batch: v.optional(v.string()),
    theme: v.optional(v.union(v.literal("dark"), v.literal("light"))),
    notifPrefs: v.optional(
      v.object({
        newPost: v.boolean(),
        upvote: v.boolean(),
        comment: v.boolean(),
        announcement: v.boolean(),
        mention: v.boolean()
      })
    )
  },
  handler: async (ctx, args) => {
    const user = await getCurrentConvexUser(ctx);
    if (!user) {
      throw new Error("Unauthenticated");
    }

    const updates: Partial<typeof user> = {};
    if (args.name !== undefined) updates.name = args.name.trim();
    if (args.bio !== undefined) updates.bio = args.bio.trim() || undefined;
    if (args.department !== undefined) updates.department = args.department.trim() || undefined;
    if (args.studentId !== undefined) updates.studentId = args.studentId.trim() || undefined;
    if (args.batch !== undefined) updates.batch = args.batch.trim() || undefined;
    if (args.theme !== undefined) updates.theme = args.theme;
    if (args.notifPrefs !== undefined) updates.notifPrefs = args.notifPrefs;

    await ctx.db.patch(user._id, updates);
  }
});

export const updatePresence = mutation({
  args: { isOnline: v.boolean() },
  handler: async (ctx, args) => {
    const user = await getCurrentConvexUser(ctx);
    if (!user) {
      return;
    }

    await ctx.db.patch(user._id, {
      isOnline: args.isOnline,
      lastActiveAt: Date.now()
    });
  }
});
