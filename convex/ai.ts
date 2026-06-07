import { query } from "./_generated/server";
import { v } from "convex/values";
import { getCurrentUser } from "./lib";

type KnowledgePostMatch = {
  post: {
    _id: string;
    roomId: string;
    content: string;
    type: string;
    deadlineTitle?: string | null;
    resourceTitle?: string | null;
    tags?: string[] | null;
  };
  room?: {
    name?: string | null;
    subject?: string | null;
  } | null;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function normalizeToken(token: string) {
  const trimmed = token.toLowerCase().trim();
  const aliases: Record<string, string> = {
    authentication: "auth",
    authenticate: "auth",
    authenticated: "auth",
    authenticatee: "auth",
    authorization: "auth",
    authorized: "auth",
    authorisation: "auth",
    signin: "auth",
    "sign-in": "auth",
    login: "auth",
    logon: "auth",
    api: "api",
    apis: "api",
    deadline: "deadline",
    deadlines: "deadline",
    due: "deadline",
    due_date: "deadline",
    duedate: "deadline",
    urgent: "urgent",
    auth: "auth",
    syllabus: "syllabus",
    lecture: "lecture",
    lectures: "lecture",
    assignment: "assignment",
    assignments: "assignment",
    project: "project",
    projects: "project",
    resource: "resource",
    resources: "resource",
    planner: "planner",
    risk: "risk",
    tradeoff: "tradeoff",
    tradeoffs: "tradeoff",
    compare: "compare",
    comparison: "compare",
    summarize: "summary",
    summary: "summary",
    knowledge: "knowledge",
    base: "knowledge",
    assistant: "assistant",
    chatbot: "assistant",
    ai: "assistant"
  };

  if (aliases[trimmed]) {
    return aliases[trimmed];
  }

  if (trimmed.endsWith("ies") && trimmed.length > 4) {
    return `${trimmed.slice(0, -3)}y`;
  }

  if (trimmed.endsWith("es") && trimmed.length > 4) {
    return trimmed.slice(0, -2);
  }

  if (trimmed.endsWith("s") && trimmed.length > 3) {
    return trimmed.slice(0, -1);
  }

  return trimmed;
}

const AI_STOPWORDS = new Set([
  "about",
  "after",
  "also",
  "best",
  "context",
  "design",
  "evidence",
  "find",
  "first",
  "from",
  "happy",
  "next",
  "note",
  "paths",
  "related",
  "service",
  "shape",
  "sharing",
  "signal",
  "student",
  "supporting",
  "tell",
  "that",
  "their",
  "them",
  "then",
  "this",
  "what",
  "with",
  "would",
  "your"
]);

const LOW_SIGNAL_PATTERNS = [
  /@uniboardai.*@uniboardai/i,
  /^draft\s+(a|this)\s+/i,
  /^tell me about\b/i,
  /^what is\b/i,
  /^explain\b/i,
  /^summarize\b/i
] as const;

function isLowSignalPost(post: {
  content: string;
  deadlineTitle?: string | null;
  resourceTitle?: string | null;
  tags?: string[] | null;
}) {
  const normalized = [post.deadlineTitle, post.resourceTitle, post.content, ...(post.tags ?? [])]
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();

  if (normalized.length < 18) {
    return true;
  }

  if (LOW_SIGNAL_PATTERNS.some((pattern) => pattern.test(normalized)) && normalized.length < 220) {
    return true;
  }

  return (normalized.match(/@uniboardai/gi) ?? []).length >= 2;
}

function directConceptAnswer(question: string) {
  const normalized = question.toLowerCase();
  if (normalized.includes("convex functions") || normalized.includes("convex function")) {
    return {
      answer:
        "A convex function is a function where the straight line between any two points on its graph lies above or on the graph. In optimization, this matters because convex problems are easier to solve reliably: any local minimum is also a global minimum.",
      confidence: "medium",
      sources: [],
      mode: "fallback"
    } as const;
  }

  if (/\bconvex\b/.test(normalized)) {
    return {
      answer:
        "Convex is a backend platform for building real-time applications. It combines a database, server-side functions, authentication-friendly data access, and live synchronization so app state stays updated across users without manual refresh handling.",
      confidence: "medium",
      sources: [],
      mode: "fallback"
    } as const;
  }

  return null;
}

function isDeadlineQuestion(question: string) {
  const normalized = question.toLowerCase();
  return (
    normalized.includes("deadline") ||
    normalized.includes("due") ||
    normalized.includes("urgent") ||
    normalized.includes("closest") ||
    normalized.includes("next") ||
    normalized.includes("most")
  );
}

function tokenizeQuestionTerms(question: string) {
  return question
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .map((term) => term.trim())
    .filter((term) => term.length > 2);
}

function roomMatchesQuestion(room: { name?: string | null; subject?: string | null }, questionTerms: string[]) {
  const haystack = `${room.name ?? ""} ${room.subject ?? ""}`.toLowerCase();
  return questionTerms.some((term) => haystack.includes(term));
}

function tokenizeQuestion(question: string) {
  return question
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .map(normalizeToken)
    .filter((token, index, array) => token.length > 1 && !AI_STOPWORDS.has(token) && array.indexOf(token) === index);
}

function buildAnswerFromEvidence(matches: KnowledgePostMatch[], question: string) {
  const [best] = matches;
  if (!best) {
    return {
      answer:
        "I could not find enough grounded evidence in your rooms to answer that confidently. Try naming the course, deadline, concept, or artifact more explicitly.",
      confidence: "low" as const,
      sources: [],
      mode: "fallback" as const
    };
  }

  const title = best.post.deadlineTitle || best.post.resourceTitle || best.post.content.slice(0, 80);
  const roomName = best.room?.name ?? "Room";
  const excerpt = best.post.content.split("\n").map((line) => line.trim()).find(Boolean) ?? best.post.content.slice(0, 280);
  const lowerQuestion = question.toLowerCase();

  const lead =
    lowerQuestion.includes("deadline") || lowerQuestion.includes("due")
      ? `The strongest deadline signal is in ${roomName}: ${title}.`
      : lowerQuestion.includes("auth") || lowerQuestion.includes("login") || lowerQuestion.includes("sign")
        ? `The strongest access-control signal is in ${roomName}: ${title}.`
        : `The strongest grounded context is in ${roomName}: ${title}.`;

  return {
    answer: `${lead} ${excerpt}${excerpt.endsWith(".") ? "" : "."}`,
    confidence:
      matches.length > 1 ? ("medium" as const) : ("low" as const),
    sources: matches.slice(0, 3).map((match) => ({
      postId: match.post._id,
      roomId: match.post.roomId,
      roomName: match.room?.name ?? "Room",
      title: match.post.deadlineTitle || match.post.resourceTitle || match.post.content.slice(0, 72),
      type: match.post.type
    })),
    mode: "grounded" as const
  };
}

function buildDeadlineAnswerFromItems(
  items: Array<{
    id: string;
    roomId?: string;
    roomName?: string;
    title: string;
    dueDate: number;
    riskScore?: number;
  }>,
  question: string
) {
  const now = Date.now();
  const futureItems = items.filter((item) => item.dueDate >= now);
  const candidateItems = futureItems.length > 0 ? futureItems : items;
  const [top] = [...candidateItems].sort((left, right) => {
    if (futureItems.length > 0) {
      return left.dueDate - right.dueDate;
    }

    return right.dueDate - left.dueDate;
  });
  if (!top) {
    return {
      answer:
        "There are no tracked deadlines yet. Add a deadline in Planner or join a room with deadline posts so I can answer this precisely.",
      confidence: "low" as const,
      sources: [],
      mode: "fallback" as const
    };
  }

  const isOverdue = top.dueDate < now;
  const label = /urgent|closest|most|next|first/i.test(question)
    ? isOverdue
      ? "The most urgent unresolved deadline is"
      : "The most urgent upcoming deadline is"
    : isOverdue
      ? "The closest unresolved deadline is"
      : "The closest upcoming deadline is";
  const dueText = isOverdue ? `It was due ${new Date(top.dueDate).toLocaleString()}` : `It is due ${new Date(top.dueDate).toLocaleString()}`;
  const riskText = typeof top.riskScore === "number" ? ` and is currently rated at ${top.riskScore}% risk` : "";

  return {
    answer: `${label} ${top.title}${top.roomName ? ` in ${top.roomName}` : ""}. ${dueText}${riskText}.`,
    confidence: "medium" as const,
    sources: top.roomId
      ? [
          {
            postId: top.id,
            roomId: top.roomId,
            roomName: top.roomName ?? "Room",
            title: top.title,
            type: "deadline"
          }
        ]
      : [],
    mode: "grounded" as const
  };
}

export const queryKnowledgeBase = query({
  args: {
    question: v.string()
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    const question = args.question.trim();
    if (question.length < 3) {
      throw new Error("Ask a more specific question.");
    }

    const direct = directConceptAnswer(question);
    if (direct) {
      return direct;
    }

    if (isDeadlineQuestion(question)) {
      const visibleRooms = user
        ? await Promise.all(
            (
              await ctx.db
                .query("roomMembers")
                .withIndex("by_userId", (q) => q.eq("userId", user._id))
                .collect()
            )
              .filter((membership) => !membership.isBanned)
              .map((membership) => ctx.db.get(membership.roomId))
          )
        : await ctx.db.query("rooms").collect();
      const existingRooms = visibleRooms.filter((room): room is NonNullable<typeof room> => room !== null && !room.isArchived && (user ? true : room.isPublic));
      const questionTerms = tokenizeQuestionTerms(question);
      const scopedRooms = existingRooms.filter((room) => roomMatchesQuestion(room, questionTerms));
      const deadlineRoomIds = new Set((scopedRooms.length > 0 ? scopedRooms : existingRooms).map((room) => room._id));
      const roomDeadlines = await ctx.db
        .query("posts")
        .withIndex("by_type", (q) => q.eq("type", "deadline"))
        .collect();
      const manualDeadlines = await ctx.db.query("plannerDeadlines").collect();
      const items = [
        ...roomDeadlines
          .filter((post) => !post.isDeleted && !post.isHidden && post.deadlineDate && deadlineRoomIds.has(post.roomId))
          .map((post) => ({
            id: post._id,
            roomId: post.roomId,
            roomName: undefined as string | undefined,
            title: post.deadlineTitle || post.content.slice(0, 72),
            dueDate: post.deadlineDate!,
            riskScore: 60
          })),
        ...manualDeadlines
          .filter((item) => !item.completed && item.dueDate > Date.now() && (!item.roomId || deadlineRoomIds.has(item.roomId)))
          .map((item) => ({
            id: item._id,
            roomId: item.roomId,
            roomName: undefined as string | undefined,
            title: item.title,
            dueDate: item.dueDate,
            riskScore: 60
          }))
      ];

      for (const item of items) {
        if (item.roomId && !item.roomName) {
          const room = await ctx.db.get(item.roomId);
          item.roomName = room?.name ?? "Room";
        }
      }

      return buildDeadlineAnswerFromItems(items, question);
    }

    const roomIds = new Set(
      user
        ? (
            await ctx.db
              .query("roomMembers")
              .withIndex("by_userId", (q) => q.eq("userId", user._id))
              .collect()
          )
            .filter((membership) => !membership.isBanned)
            .map((membership) => membership.roomId)
        : (await ctx.db.query("rooms").collect()).filter((room) => room.isPublic && !room.isArchived).map((room) => room._id)
    );

    if (roomIds.size === 0) {
      return buildAnswerFromEvidence([], question);
    }

    const tokens = tokenizeQuestion(question);

    const posts = await ctx.db.query("posts").collect();

    const ranked = await Promise.all(
      posts
        .filter((post) => !post.isDeleted && !post.isHidden && roomIds.has(post.roomId) && !isLowSignalPost(post))
        .map(async (post) => {
          const room = await ctx.db.get(post.roomId);
          const haystack = [room?.name, room?.subject, post.content, post.deadlineTitle, post.resourceTitle, ...(post.tags ?? [])]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();
          const matchedTokens = tokens.filter((token) => {
            if (haystack.includes(token)) {
              return true;
            }

            if (token === "auth") {
              return /(auth|login|sign[-\s]?in|access|credential|token)/.test(haystack);
            }

            if (token === "tradeoff") {
              return /(tradeoff|trade-offs?|pros and cons|compare|comparison)/.test(haystack);
            }

            if (token === "compare") {
              return /(compare|comparison|contrast|versus|tradeoff)/.test(haystack);
            }

            if (token === "deadline") {
              return /(deadline|due|due date|submission|submit|due soon)/.test(haystack);
            }

            if (token === "risk") {
              return /(risk|urgent|priority|critical|at risk|overdue)/.test(haystack);
            }

            if (token === "summary") {
              return /(summary|summarize|overview|recap)/.test(haystack);
            }

            return false;
          });
          const score = matchedTokens.length;
          const coverage = tokens.length === 0 ? 0 : matchedTokens.length / tokens.length;
          const hasStrongFieldMatch =
            tokens.some((token) => (post.deadlineTitle?.toLowerCase() ?? "").includes(token) || (post.resourceTitle?.toLowerCase() ?? "").includes(token)) ||
            /(deadline|resource|announcement|question|project)/.test(post.type);
          const roomBoost = room?.name?.toLowerCase().includes(tokens[0] ?? "") || room?.subject?.toLowerCase().includes(tokens[0] ?? "") ? 1 : 0;
          const totalScore = score + roomBoost;
          return (totalScore >= 2 && coverage >= 0.3) || (totalScore >= 1 && coverage >= 0.15 && hasStrongFieldMatch)
            ? {
                score: totalScore,
                coverage,
                post,
                room
              }
            : null;
        })
    );

    const matches = ranked
      .filter((item): item is NonNullable<typeof item> => item !== null)
      .sort((left, right) => right.score - left.score || right.coverage - left.coverage || right.post.createdAt - left.post.createdAt)
      .slice(0, 3);

    if (matches.length === 0) {
      const fallbackMatches: KnowledgePostMatch[] = await Promise.all(
        posts
          .filter((post) => !post.isDeleted && !post.isHidden && roomIds.has(post.roomId) && !isLowSignalPost(post))
          .slice(0, 3)
          .map(async (post) => ({
            post,
            room: await ctx.db.get(post.roomId)
          }))
      );

      return buildAnswerFromEvidence(fallbackMatches, question);
    }

    const confidenceScore = clamp(
      matches[0].score * 24 + (matches.length - 1) * 10 + (matches[0].post.tags?.length ?? 0) * 3,
      24,
      88
    );

    const answer = buildAnswerFromEvidence(matches as KnowledgePostMatch[], question);

    return {
      answer: answer.answer,
      confidence: confidenceScore >= 65 ? "medium" : "low",
      sources: answer.sources,
      mode: answer.mode
    };
  }
});

export const getDeadlineRisk = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    const roomIds = new Set(
      user
        ? (
            await ctx.db
              .query("roomMembers")
              .withIndex("by_userId", (q) => q.eq("userId", user._id))
              .collect()
          )
            .filter((membership) => !membership.isBanned)
            .map((membership) => membership.roomId)
        : (await ctx.db.query("rooms").collect()).filter((room) => room.isPublic && !room.isArchived).map((room) => room._id)
    );
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
    const user = await getCurrentUser(ctx);
    const authoredPosts = user
      ? await ctx.db
          .query("posts")
          .withIndex("by_authorId", (q) => q.eq("authorId", user._id))
          .collect()
      : await ctx.db
          .query("posts")
          .withIndex("by_type", (q) => q.eq("type", "note"))
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
        score: clamp(40 + count * 10 + (user?.upvotesReceived ?? 0), 42, 92),
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
