import { query } from "./_generated/server";
import { v } from "convex/values";
import { getCurrentUserOrThrow } from "./lib";

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export const queryKnowledgeBase = query({
  args: {
    question: v.string()
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);
    const question = args.question.trim();
    if (question.length < 3) {
      throw new Error("Ask a more specific question.");
    }

    const memberships = await ctx.db
      .query("roomMembers")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .collect();
    const roomIds = new Set(memberships.filter((membership) => !membership.isBanned).map((membership) => membership.roomId));
    const tokens = question
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((token) => token.length > 2);
    const posts = await ctx.db.query("posts").collect();

    const ranked = await Promise.all(
      posts
        .filter((post) => !post.isDeleted && !post.isHidden && roomIds.has(post.roomId))
        .map(async (post) => {
          const room = await ctx.db.get(post.roomId);
          const haystack = [post.content, post.deadlineTitle, post.resourceTitle, ...(post.tags ?? [])]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();
          const score = tokens.reduce((total, token) => total + (haystack.includes(token) ? 1 : 0), 0);
          return score > 0
            ? {
                score,
                post,
                room
              }
            : null;
        })
    );

    const matches = ranked
      .filter((item): item is NonNullable<typeof item> => item !== null)
      .sort((left, right) => right.score - left.score || right.post.createdAt - left.post.createdAt)
      .slice(0, 3);

    if (matches.length === 0) {
      return {
        answer:
          "I could not find enough grounded evidence in your rooms to answer that confidently. Try naming the course, deadline, concept, or artifact more explicitly.",
        confidence: "low",
        sources: [],
        mode: "fallback"
      };
    }

    const answer = matches
      .map((match, index) => {
        const prefix = index === 0 ? "Best evidence" : index === 1 ? "Supporting signal" : "Related context";
        const excerpt = match.post.content.split("\n").slice(0, 2).join(" ").trim().slice(0, 220);
        return `${prefix}: ${excerpt}`;
      })
      .join("\n\n");

    const confidenceScore = clamp(
      matches[0].score * 22 + (matches.length - 1) * 10 + (matches[0].post.tags?.length ?? 0) * 3,
      24,
      86
    );

    return {
      answer,
      confidence: confidenceScore >= 65 ? "medium" : "low",
      sources: matches.map((match) => ({
        postId: match.post._id,
        roomId: match.post.roomId,
        roomName: match.room?.name ?? "Room",
        title: match.post.deadlineTitle || match.post.resourceTitle || match.post.content.slice(0, 72),
        type: match.post.type
      })),
      mode: "grounded"
    };
  }
});

export const getDeadlineRisk = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUserOrThrow(ctx);
    const memberships = await ctx.db
      .query("roomMembers")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .collect();
    const roomIds = new Set(memberships.filter((membership) => !membership.isBanned).map((membership) => membership.roomId));
    const now = Date.now();
    const posts = await ctx.db.query("posts").withIndex("by_type", (q) => q.eq("type", "deadline")).collect();

    const risks = await Promise.all(
      posts
        .filter((post) => !post.isDeleted && !post.isHidden && post.deadlineDate && post.deadlineDate > now && roomIds.has(post.roomId))
        .map(async (post) => {
          const room = await ctx.db.get(post.roomId);
          const daysUntilDue = Math.max(0, Math.ceil((post.deadlineDate! - now) / (24 * 60 * 60 * 1000)));
          const postCount = await ctx.db
            .query("posts")
            .withIndex("by_roomId_createdAt", (q) => q.eq("roomId", post.roomId).gt("createdAt", now - 7 * 24 * 60 * 60 * 1000))
            .collect();
          const score = clamp((daysUntilDue <= 1 ? 78 : daysUntilDue <= 3 ? 62 : daysUntilDue <= 7 ? 46 : 28) - Math.min(postCount.length, 6) * 3, 18, 88);
          return {
            postId: post._id,
            roomId: post.roomId,
            roomName: room?.name ?? "Room",
            title: post.deadlineTitle || post.content.slice(0, 72),
            dueDate: post.deadlineDate!,
            score,
            band: score >= 70 ? "high" : score >= 45 ? "medium" : "low",
            confidence: daysUntilDue <= 2 ? "medium" : "low",
            explanation:
              score >= 70
                ? "This deadline is close and recent room activity does not provide much buffer."
                : score >= 45
                  ? "The timeline is tightening, but a planned study block can still lower the risk."
                  : "The deadline is visible early enough to stay manageable with steady progress."
          };
        })
    );

    return risks.sort((left, right) => right.score - left.score).slice(0, 5);
  }
});

export const getLearningProfile = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUserOrThrow(ctx);
    const authoredPosts = await ctx.db
      .query("posts")
      .withIndex("by_authorId", (q) => q.eq("authorId", user._id))
      .collect();
    const topTags = new Map<string, number>();

    for (const post of authoredPosts.filter((item) => !item.isDeleted)) {
      for (const tag of post.tags ?? []) {
        topTags.set(tag, (topTags.get(tag) ?? 0) + 1);
      }
    }

    const expertise = [...topTags.entries()]
      .sort((left, right) => right[1] - left[1])
      .slice(0, 4)
      .map(([topic, count]) => ({
        topic,
        score: clamp(40 + count * 10 + (user.upvotesReceived ?? 0), 42, 92),
        confidence: count >= 3 ? "medium" : "low",
        evidence: `${count} tagged contribution${count === 1 ? "" : "s"} in this workspace`
      }));

    return {
      expertise,
      summary:
        expertise.length > 0
          ? "This profile is inferred from your visible contribution patterns and should be treated as directional, not final."
          : "There is not enough authored content yet to infer topic expertise confidently."
    };
  }
});
