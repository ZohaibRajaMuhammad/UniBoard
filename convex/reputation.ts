import { query } from "./_generated/server";
import { getCurrentUserOrThrow } from "./lib";

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function tierForXp(xp: number) {
  if (xp >= 900) return { label: "Scholar", next: 1200 };
  if (xp >= 600) return { label: "Mentor", next: 900 };
  if (xp >= 320) return { label: "Contributor", next: 600 };
  if (xp >= 120) return { label: "Builder", next: 320 };
  return { label: "Starter", next: 120 };
}

async function buildScoreboard(ctx: any) {
  const users = await ctx.db.query("users").collect();
  const posts = await ctx.db.query("posts").collect();
  const comments = await ctx.db.query("comments").collect();

  return users.map((user: any) => {
    const visiblePosts = posts.filter((post: any) => !post.isDeleted && post.authorId === user._id);
    const visibleComments = comments.filter((comment: any) => !comment.isDeleted && comment.authorId === user._id);
    const xp =
      visiblePosts.length * 30 +
      visibleComments.length * 12 +
      (user.upvotesReceived ?? 0) * 6 +
      (user.roomsJoined ?? 0) * 10 +
      (user.badges?.length ?? 0) * 20;

    return {
      userId: user._id,
      name: user.name,
      imageUrl: user.imageUrl ?? null,
      role: user.role,
      xp,
      posts: visiblePosts.length,
      comments: visibleComments.length,
      upvotesReceived: user.upvotesReceived ?? 0,
      badges: user.badges ?? []
    };
  });
}

export const getLeaderboard = query({
  args: {},
  handler: async (ctx) => {
    await getCurrentUserOrThrow(ctx);
    const scoreboard = await buildScoreboard(ctx);
    return scoreboard
      .sort((left: any, right: any) => right.xp - left.xp || right.upvotesReceived - left.upvotesReceived || left.name.localeCompare(right.name))
      .map((entry: any, index: number) => ({
        ...entry,
        rank: index + 1,
        momentum: entry.posts >= 5 ? "surging" : entry.posts >= 2 ? "steady" : "warming"
      }));
  }
});

export const getMe = query({
  args: {},
  handler: async (ctx) => {
    const currentUser = await getCurrentUserOrThrow(ctx);
    const [leaderboard, authoredPosts, authoredComments] = await Promise.all([
      buildScoreboard(ctx),
      ctx.db.query("posts").withIndex("by_authorId", (q) => q.eq("authorId", currentUser._id)).collect(),
      ctx.db.query("comments").withIndex("by_authorId", (q) => q.eq("authorId", currentUser._id)).collect()
    ]);

    const me = leaderboard.find((entry: any) => entry.userId === currentUser._id);
    const xp = me?.xp ?? 0;
    const tier = tierForXp(xp);
    const previousThreshold = tier.label === "Scholar" ? 900 : tier.label === "Mentor" ? 600 : tier.label === "Contributor" ? 320 : tier.label === "Builder" ? 120 : 0;
    const progress = clamp(((xp - previousThreshold) / (tier.next - previousThreshold || 1)) * 100, 0, 100);
    const streak = clamp(authoredPosts.filter((post: any) => !post.isDeleted && post.createdAt > Date.now() - 14 * 24 * 60 * 60 * 1000).length, 0, 14);
    const tagCounts = new Map<string, number>();

    for (const post of authoredPosts.filter((item: any) => !item.isDeleted)) {
      for (const tag of post.tags ?? []) {
        tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1);
      }
    }

    const expertise = [...tagCounts.entries()]
      .sort((left, right) => right[1] - left[1])
      .slice(0, 4)
      .map(([topic, count]) => ({
        topic,
        score: clamp(38 + count * 11 + (currentUser.upvotesReceived ?? 0), 40, 91),
        confidence: count >= 3 ? "medium" : "low"
      }));

    const achievements = [
      { label: "First contribution", unlocked: authoredPosts.some((post: any) => !post.isDeleted) },
      { label: "Helpful responder", unlocked: authoredComments.filter((comment: any) => !comment.isDeleted).length >= 3 },
      { label: "Room regular", unlocked: (currentUser.roomsJoined ?? 0) >= 3 },
      { label: "Signal builder", unlocked: (currentUser.upvotesReceived ?? 0) >= 10 }
    ];

    const ranked = leaderboard
      .sort((left: any, right: any) => right.xp - left.xp || right.upvotesReceived - left.upvotesReceived || left.name.localeCompare(right.name));
    const rank = ranked.findIndex((entry: any) => entry.userId === currentUser._id) + 1;

    return {
      xp,
      tier: tier.label,
      nextTierTarget: tier.next,
      progress,
      rank,
      streak,
      achievements,
      expertise,
      stats: {
        posts: authoredPosts.filter((post: any) => !post.isDeleted).length,
        comments: authoredComments.filter((comment: any) => !comment.isDeleted).length,
        upvotesReceived: currentUser.upvotesReceived ?? 0
      }
    };
  }
});

export const getActivity = query({
  args: {},
  handler: async (ctx) => {
    const currentUser = await getCurrentUserOrThrow(ctx);
    const [posts, comments] = await Promise.all([
      ctx.db.query("posts").withIndex("by_authorId", (q) => q.eq("authorId", currentUser._id)).collect(),
      ctx.db.query("comments").withIndex("by_authorId", (q) => q.eq("authorId", currentUser._id)).collect()
    ]);

    const postEvents = posts
      .filter((post: any) => !post.isDeleted)
      .map((post: any) => ({
        id: post._id,
        timestamp: post.createdAt,
        label: `Published a ${post.type}`,
        xp: 30
      }));

    const commentEvents = comments
      .filter((comment: any) => !comment.isDeleted)
      .map((comment: any) => ({
        id: comment._id,
        timestamp: comment.createdAt,
        label: "Joined a discussion thread",
        xp: 12
      }));

    return [...postEvents, ...commentEvents].sort((left, right) => right.timestamp - left.timestamp).slice(0, 12);
  }
});
