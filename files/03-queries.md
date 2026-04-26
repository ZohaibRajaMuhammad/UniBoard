# 03 — Convex Queries (Complete)

## File: `convex/users.ts` — Queries

```typescript
import { query } from "./_generated/server";
import { v } from "convex/values";

export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    return ctx.db
      .query("users")
      .withIndex("by_clerkId", q => q.eq("clerkId", identity.subject))
      .unique();
  },
});

export const getById = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => ctx.db.get(args.userId),
});

// Get public profile (stripped sensitive fields)
export const getPublicProfile = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) return null;
    return {
      _id: user._id,
      name: user.name,
      imageUrl: user.imageUrl,
      bio: user.bio,
      role: user.role,
      batch: user.batch,
      department: user.department,
      postCount: user.postCount,
      upvotesReceived: user.upvotesReceived,
      badges: user.badges,
      joinedAt: user.joinedAt,
    };
  },
});

// Leaderboard: top contributors in a room by upvotes received
export const getRoomLeaderboard = query({
  args: { roomId: v.id("rooms") },
  handler: async (ctx, args) => {
    const members = await ctx.db
      .query("roomMembers")
      .withIndex("by_roomId", q => q.eq("roomId", args.roomId))
      .collect();

    const users = await Promise.all(
      members.map(m => ctx.db.get(m.userId))
    );

    return users
      .filter(Boolean)
      .sort((a, b) => b!.upvotesReceived - a!.upvotesReceived)
      .slice(0, 10)
      .map(u => ({
        _id: u!._id,
        name: u!.name,
        imageUrl: u!.imageUrl,
        upvotesReceived: u!.upvotesReceived,
        postCount: u!.postCount,
        badges: u!.badges,
      }));
  },
});

export const getOnlineInRoom = query({
  args: { roomId: v.id("rooms") },
  handler: async (ctx, args) => {
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
    const members = await ctx.db
      .query("roomMembers")
      .withIndex("by_roomId", q => q.eq("roomId", args.roomId))
      .collect();

    const users = await Promise.all(
      members
        .filter(m => !m.isBanned && !m.isMuted)
        .map(m => ctx.db.get(m.userId))
    );

    return users
      .filter(u => u && u.lastActiveAt > fiveMinutesAgo)
      .slice(0, 8);
  },
});
```

---

## File: `convex/rooms.ts` — Queries

```typescript
import { query } from "./_generated/server";
import { v } from "convex/values";

export const getMyRooms = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", q => q.eq("clerkId", identity.subject))
      .unique();
    if (!user) return [];

    const memberships = await ctx.db
      .query("roomMembers")
      .withIndex("by_userId", q => q.eq("userId", user._id))
      .collect();

    const rooms = await Promise.all(
      memberships
        .filter(m => !m.isBanned)
        .map(m => ctx.db.get(m.roomId))
    );

    return rooms
      .filter(r => r && !r.isArchived)
      .sort((a, b) => (b!.lastPostAt ?? 0) - (a!.lastPostAt ?? 0));
  },
});

export const getById = query({
  args: { roomId: v.id("rooms") },
  handler: async (ctx, args) => ctx.db.get(args.roomId),
});

export const getPublicRooms = query({
  args: { batch: v.optional(v.string()) },
  handler: async (ctx, args) => {
    let rooms = args.batch
      ? await ctx.db.query("rooms").withIndex("by_batch", q => q.eq("batch", args.batch!)).collect()
      : await ctx.db.query("rooms").collect();
    return rooms.filter(r => r.isPublic && !r.isArchived);
  },
});

export const getUnreadCount = query({
  args: { roomId: v.id("rooms") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return 0;

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", q => q.eq("clerkId", identity.subject))
      .unique();
    if (!user) return 0;

    const membership = await ctx.db
      .query("roomMembers")
      .withIndex("by_roomId_userId", q =>
        q.eq("roomId", args.roomId).eq("userId", user._id))
      .unique();
    if (!membership) return 0;

    const newPosts = await ctx.db
      .query("posts")
      .withIndex("by_roomId_createdAt", q =>
        q.eq("roomId", args.roomId).gt("createdAt", membership.lastSeenAt))
      .filter(q => q.eq(q.field("isDeleted"), false))
      .collect();

    return newPosts.length;
  },
});

export const getTotalUnreadCount = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return 0;

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", q => q.eq("clerkId", identity.subject))
      .unique();
    if (!user) return 0;

    const memberships = await ctx.db
      .query("roomMembers")
      .withIndex("by_userId", q => q.eq("userId", user._id))
      .collect();

    let total = 0;
    for (const m of memberships) {
      const count = await ctx.db
        .query("posts")
        .withIndex("by_roomId_createdAt", q =>
          q.eq("roomId", m.roomId).gt("createdAt", m.lastSeenAt))
        .filter(q => q.eq(q.field("isDeleted"), false))
        .collect();
      total += count.length;
    }
    return total;
  },
});

// Get members of a room with user info (for member management)
export const getMembers = query({
  args: { roomId: v.id("rooms") },
  handler: async (ctx, args) => {
    const memberships = await ctx.db
      .query("roomMembers")
      .withIndex("by_roomId", q => q.eq("roomId", args.roomId))
      .collect();

    const enriched = await Promise.all(
      memberships.map(async m => {
        const user = await ctx.db.get(m.userId);
        return user ? { ...m, user } : null;
      })
    );

    return enriched.filter(Boolean);
  },
});
```

---

## File: `convex/posts.ts` — Queries

```typescript
import { query } from "./_generated/server";
import { v } from "convex/values";

// Core real-time feed query
export const getByRoom = query({
  args: {
    roomId: v.id("rooms"),
    postType: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();

    const posts = await ctx.db
      .query("posts")
      .withIndex("by_roomId_createdAt", q => q.eq("roomId", args.roomId))
      .order("desc")
      .take(args.limit ?? 50);

    const filtered = posts.filter(p =>
      !p.isDeleted &&
      !p.isHidden &&
      (args.postType ? p.type === args.postType : true)
    );

    return Promise.all(filtered.map(async post => {
      if (post.isAnonymous || !post.authorId) {
        return {
          ...post,
          authorId: undefined,
          author: { name: "Anonymous", imageUrl: null, role: "student" as const },
        };
      }
      const author = await ctx.db.get(post.authorId);
      return {
        ...post,
        author: author
          ? { name: author.name, imageUrl: author.imageUrl, role: author.role }
          : { name: "Unknown", imageUrl: null, role: "student" as const },
      };
    }));
  },
});

export const getPinnedPosts = query({
  args: { roomId: v.id("rooms") },
  handler: async (ctx, args) =>
    ctx.db
      .query("posts")
      .withIndex("by_roomId_pinned", q =>
        q.eq("roomId", args.roomId).eq("isPinned", true))
      .filter(q => q.eq(q.field("isDeleted"), false))
      .collect(),
});

export const getUpcomingDeadlines = query({
  args: { roomId: v.optional(v.id("rooms")) },
  handler: async (ctx, args) => {
    const now = Date.now();
    const posts = args.roomId
      ? await ctx.db
          .query("posts")
          .withIndex("by_roomId_type", q =>
            q.eq("roomId", args.roomId!).eq("type", "deadline"))
          .collect()
      : await ctx.db
          .query("posts")
          .withIndex("by_type", q => q.eq("type", "deadline"))
          .collect();

    return posts
      .filter(p => !p.isDeleted && p.deadlineDate && p.deadlineDate > now)
      .sort((a, b) => (a.deadlineDate ?? 0) - (b.deadlineDate ?? 0));
  },
});

export const getUserVote = query({
  args: { postId: v.id("posts") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", q => q.eq("clerkId", identity.subject))
      .unique();
    if (!user) return null;
    return ctx.db
      .query("votes")
      .withIndex("by_targetId_userId", q =>
        q.eq("targetId", args.postId).eq("userId", user._id))
      .unique();
  },
});

export const getPostReactions = query({
  args: { postId: v.id("posts") },
  handler: async (ctx, args) => {
    const reactions = await ctx.db
      .query("reactions")
      .withIndex("by_postId", q => q.eq("postId", args.postId))
      .collect();

    // Group by emoji with count
    const grouped: Record<string, { emoji: string; count: number; userIds: string[] }> = {};
    for (const r of reactions) {
      if (!grouped[r.emoji]) grouped[r.emoji] = { emoji: r.emoji, count: 0, userIds: [] };
      grouped[r.emoji].count++;
      grouped[r.emoji].userIds.push(r.userId);
    }
    return Object.values(grouped).sort((a, b) => b.count - a.count);
  },
});

// Get posts reported for moderation (teacher only)
export const getReportedPosts = query({
  args: { roomId: v.id("rooms") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", q => q.eq("clerkId", identity.subject))
      .unique();
    if (!user || user.role !== "teacher") throw new Error("Teacher only");

    return ctx.db
      .query("posts")
      .withIndex("by_roomId_isReported", q =>
        q.eq("roomId", args.roomId).eq("isReported", true))
      .filter(q => q.eq(q.field("isDeleted"), false))
      .collect();
  },
});

export const getSavedPosts = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", q => q.eq("clerkId", identity.subject))
      .unique();
    if (!user) return [];

    const saved = await ctx.db
      .query("savedPosts")
      .withIndex("by_userId", q => q.eq("userId", user._id))
      .order("desc")
      .collect();

    const posts = await Promise.all(saved.map(s => ctx.db.get(s.postId)));
    return posts.filter(Boolean);
  },
});

export const search = query({
  args: {
    searchQuery: v.string(),
    roomId: v.optional(v.id("rooms")),
    postType: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (args.searchQuery.length < 2) return [];
    const q = args.searchQuery.toLowerCase();

    const posts = args.roomId
      ? await ctx.db.query("posts").withIndex("by_roomId", p => p.eq("roomId", args.roomId!)).collect()
      : await ctx.db.query("posts").collect();

    return posts
      .filter(p =>
        !p.isDeleted &&
        !p.isHidden &&
        (args.postType ? p.type === args.postType : true) &&
        (
          p.content.toLowerCase().includes(q) ||
          p.deadlineTitle?.toLowerCase().includes(q) ||
          p.resourceTitle?.toLowerCase().includes(q) ||
          p.tags?.some(t => t.toLowerCase().includes(q))
        )
      )
      .slice(0, 30);
  },
});
```

---

## File: `convex/comments.ts` — Queries

```typescript
import { query } from "./_generated/server";
import { v } from "convex/values";

export const getByPost = query({
  args: { postId: v.id("posts") },
  handler: async (ctx, args) => {
    const comments = await ctx.db
      .query("comments")
      .withIndex("by_postId_createdAt", q => q.eq("postId", args.postId))
      .order("asc")
      .collect();

    return Promise.all(
      comments
        .filter(c => !c.isDeleted)
        .map(async c => {
          if (c.isAnonymous || !c.authorId) {
            return { ...c, author: { name: "Anonymous", imageUrl: null } };
          }
          const author = await ctx.db.get(c.authorId);
          return {
            ...c,
            author: author
              ? { name: author.name, imageUrl: author.imageUrl }
              : { name: "Unknown", imageUrl: null },
          };
        })
    );
  },
});
```

---

## File: `convex/analytics.ts` — Teacher Analytics Queries

```typescript
import { query } from "./_generated/server";
import { v } from "convex/values";

// Teacher-only: full room analytics
export const getRoomAnalytics = query({
  args: { roomId: v.id("rooms"), days: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", q => q.eq("clerkId", identity.subject))
      .unique();
    if (!user || user.role !== "teacher") throw new Error("Teacher only");

    const sinceMs = (args.days ?? 30) * 86400000;
    const since = Date.now() - sinceMs;

    const posts = await ctx.db
      .query("posts")
      .withIndex("by_roomId_createdAt", q =>
        q.eq("roomId", args.roomId).gt("createdAt", since))
      .collect();

    const byType = posts.reduce((acc, p) => {
      acc[p.type] = (acc[p.type] ?? 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const byDay: Record<string, number> = {};
    for (const p of posts) {
      const day = new Date(p.createdAt).toISOString().slice(0, 10);
      byDay[day] = (byDay[day] ?? 0) + 1;
    }

    // Top contributors
    const authorCounts: Record<string, number> = {};
    for (const p of posts.filter(p => !p.isAnonymous && p.authorId)) {
      const id = p.authorId!;
      authorCounts[id] = (authorCounts[id] ?? 0) + 1;
    }

    const topContributors = await Promise.all(
      Object.entries(authorCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(async ([userId, count]) => {
          const u = await ctx.db.get(userId as any);
          return u ? { userId, name: u.name, imageUrl: u.imageUrl, postCount: count } : null;
        })
    );

    const members = await ctx.db
      .query("roomMembers")
      .withIndex("by_roomId", q => q.eq("roomId", args.roomId))
      .collect();

    const avgResponseTime = posts
      .filter(p => p.type === "question" && p.isResolved)
      .length;

    return {
      totalPosts: posts.length,
      byType,
      byDay,
      topContributors: topContributors.filter(Boolean),
      totalMembers: members.length,
      resolvedQuestions: avgResponseTime,
      anonymousPosts: posts.filter(p => p.isAnonymous).length,
    };
  },
});
```

---

*Continue to `04-mutations.md` →*
