import { auth } from "@clerk/nextjs/server";
import { fetchQuery } from "convex/nextjs";
import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { z } from "zod";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { AI_EMBEDDING_MODEL, AI_MODEL, AI_TIMEOUT_MS } from "./config";
import type {
  AiBriefing,
  AiEnvelope,
  AiMeta,
  AssistantReply,
  ConfidenceBand,
  ComposerSuggestion,
  DeadlineRiskItem,
  KnowledgeAnswer,
  LearningProfile,
  RoomSummary,
  StudyPlan
} from "./contracts";
import {
  buildAssistantInstructions,
  buildAssistantSuggestions,
  buildKnowledgeFollowUp,
  buildKnowledgeInstructions,
  classifyAssistantIntent,
  classifyKnowledgeIntent
} from "./intents";
import { extractAssistantUserRequest, parseAssistantPromptContext } from "./mentions";
import type { SourcePost } from "./retrieval";
import { retrieveChunks } from "./retrieval";
import { AiValidationError } from "./safety";

type RoomRecord = Awaited<ReturnType<typeof fetchQuery<typeof api.rooms.getMyRooms>>>[number];

const LOW_SIGNAL_SOURCE_PATTERNS = [
  /@uniboardai.*@uniboardai/i,
  /^draft\s+(a|this)\s+/i,
  /^i could not find grounded room material\b/i,
  /^i could not find enough grounded evidence\b/i,
  /^the best grounded material i found\b/i,
  /^tell me about\b/i,
  /^what is\b/i,
  /^explain\b/i,
  /^summarize\b/i
] as const;

const knowledgeSchema = z.object({
  answer: z.string(),
  confidenceBand: z.enum(["low", "medium", "high"]),
  followUp: z.string().nullable(),
  abstained: z.boolean(),
  sourcePostIds: z.array(z.string())
});

const deadlineRiskSchema = z.object({
  summary: z.array(
    z.object({
      postId: z.string(),
      score: z.number().min(0).max(100),
      band: z.enum(["low", "medium", "high"]),
      explanation: z.string()
    })
  )
});

const learningProfileSchema = z.object({
  summary: z.string(),
  expertise: z.array(
    z.object({
      topic: z.string(),
      score: z.number().min(0).max(100),
      confidence: z.enum(["low", "medium", "high"]),
      evidence: z.string()
    })
  )
});

const studyPlanSchema = z.object({
  summary: z.string(),
  confidenceBand: z.enum(["low", "medium", "high"]),
  sessions: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      startAt: z.number(),
      endAt: z.number(),
      urgency: z.enum(["low", "medium", "high"]),
      reasoning: z.string()
    })
  )
});

const briefingSchema = z.object({
  summary: z.string(),
  priorities: z.array(z.string()),
  warnings: z.array(z.string())
});

const roomSummarySchema = z.object({
  summary: z.string(),
  keyPoints: z.array(z.string()),
  openQuestions: z.array(z.string())
});

const assistantSchema = z.object({
  reply: z.string(),
  confidenceBand: z.enum(["low", "medium", "high"]),
  suggestions: z.array(z.string()),
  sourcePostIds: z.array(z.string())
});

const composerSchema = z.object({
  title: z.string(),
  body: z.string(),
  tags: z.array(z.string()),
  disclaimer: z.string()
});

class AiServiceError extends Error {
  constructor(
    public readonly code: string,
    public readonly status: number,
    message: string
  ) {
    super(message);
  }
}

function toConfidenceBand(value: string): ConfidenceBand {
  if (value === "high" || value === "medium" || value === "low") {
    return value;
  }
  return "low";
}

function createRequestId() {
  return `ai_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function logTelemetry({
  requestId,
  route,
  actorId,
  status,
  latencyMs,
  mode,
  details
}: {
  requestId: string;
  route: string;
  actorId: string | null;
  status: number;
  latencyMs: number;
  mode: "openai" | "fallback";
  details?: Record<string, unknown>;
}) {
  console.info(
    JSON.stringify({
      type: "ai_gateway",
      requestId,
      route,
      actorId,
      status,
      latencyMs,
      mode,
      ...details
    })
  );
}

function buildMeta(route: string, requestId: string, latencyMs: number, mode: "openai" | "fallback"): AiMeta {
  return {
    requestId,
    route,
    model: AI_MODEL,
    embeddingModel: AI_EMBEDDING_MODEL,
    latencyMs,
    mode
  };
}

async function getConvexToken() {
  try {
    const authState = await auth();
    if (!authState.userId) {
      return { userId: null as string | null, token: null as string | null };
    }

    const token =
      (await authState.getToken({ template: "convex" }).catch(() => null)) ??
      (await authState.getToken().catch(() => null));

    return {
      userId: authState.userId,
      token: token ?? null
    };
  } catch {
    return { userId: null as string | null, token: null as string | null };
  }
}

function getClient() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new AiServiceError("ai_unavailable", 503, "OPENAI_API_KEY is not configured.");
  }

  return new OpenAI({ apiKey });
}

async function withTimeout<T>(work: (client: OpenAI, signal: AbortSignal) => Promise<T>) {
  const client = getClient();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), AI_TIMEOUT_MS);

  try {
    return await work(client, controller.signal);
  } catch (error) {
    if (controller.signal.aborted) {
      throw new AiServiceError("timeout", 503, "The AI service timed out.");
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

async function parseStructured<T>({
  client,
  signal,
  schema,
  schemaName,
  instructions,
  input
}: {
  client: OpenAI;
  signal: AbortSignal;
  schema: z.ZodType<T>;
  schemaName: string;
  instructions: string;
  input: string;
}) {
  const response = await client.responses.parse(
    {
      model: AI_MODEL,
      reasoning: { effort: "low" },
      instructions,
      input,
      text: {
        format: zodTextFormat(schema, schemaName)
      }
    },
    {
      signal
    }
  );

  if (!response.output_parsed) {
    throw new AiServiceError("invalid_model_output", 503, "The AI model returned an unreadable response.");
  }

  return response.output_parsed;
}

async function getAiScopedRooms(token: string | null) {
  if (token) {
    const rooms = await fetchQuery(api.rooms.getMyRooms, {}, token ? { token } : undefined);
    const aiRooms = rooms.filter((room) => room.aiEnabled);

    if (aiRooms.length > 0) {
      return aiRooms;
    }
  }

  const publicRooms = await fetchQuery(api.rooms.getPublicRooms, {});
  const aiRooms = publicRooms.filter((room) => room.aiEnabled);
  return aiRooms.length > 0 ? aiRooms : publicRooms;
}

function sanitizeSourceTitle(post: {
  deadlineTitle?: string | null;
  resourceTitle?: string | null;
  content: string;
  type: string;
}) {
  const explicitTitle = post.deadlineTitle || post.resourceTitle;
  if (explicitTitle?.trim()) {
    return explicitTitle.trim();
  }

  const firstLine = post.content
    .split("\n")
    .map((line) => line.trim())
    .find(Boolean);

  if (firstLine) {
    return firstLine.replace(/^@uniboardai\b/gi, "").trim().slice(0, 80) || `${post.type} update`;
  }

  return `${post.type} update`;
}

function isLowSignalSource(post: {
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

  if (LOW_SIGNAL_SOURCE_PATTERNS.some((pattern) => pattern.test(normalized)) && normalized.length < 220) {
    return true;
  }

  const mentionCount = (normalized.match(/@uniboardai/gi) ?? []).length;
  return mentionCount >= 2;
}

async function getRoomPosts(token: string | null, room: RoomRecord): Promise<SourcePost[]> {
  const posts = await fetchQuery(
    api.posts.getByRoom,
    {
      roomId: room._id,
      limit: 60
    },
    token ? { token } : undefined
  );

  return posts
    .filter((post) => !isLowSignalSource(post))
    .map((post) => ({
      postId: post._id,
      roomId: post.roomId,
      roomName: room.name,
      title: sanitizeSourceTitle(post),
      type: post.type,
      content: post.content,
      tags: post.tags ?? [],
      createdAt: post.createdAt,
      authorRole: post.author?.role ?? null,
      isResolved: post.isResolved,
      isPinned: post.isPinned,
      commentCount: post.commentCount ?? 0
    }));
}

type RoomComment = Awaited<ReturnType<typeof fetchQuery<typeof api.comments.getByPost>>>[number];

function buildCommentSource(post: SourcePost, comment: RoomComment, parentComment?: RoomComment): SourcePost | null {
  const commentTitle = parentComment ? `Thread reply in ${post.title}` : `Comment thread in ${post.title}`;
  const normalized = [commentTitle, comment.content, parentComment?.content].filter(Boolean).join(" ");

  if (isLowSignalSource({ content: normalized, tags: [] })) {
    return null;
  }

  const threadContext = [
    `Post title: ${post.title}`,
    `Post type: ${post.type}`,
    parentComment ? `Parent comment: ${parentComment.content}` : null,
    `Comment: ${comment.content}`
  ]
    .filter(Boolean)
    .join("\n");

  return {
    postId: post.postId,
    sourceId: `${post.postId}:comment:${comment._id}`,
    sourceKind: "comment",
    roomId: post.roomId,
    roomName: post.roomName,
    title: commentTitle,
    type: "comment",
    content: threadContext,
    tags: post.tags,
    createdAt: comment.createdAt,
    authorRole: comment.author?.role ?? null,
    isResolved: post.isResolved,
    isPinned: post.isPinned,
    commentCount: post.commentCount
  };
}

async function getRoomCommentSources(token: string | null, posts: SourcePost[]) {
  const commentEligiblePosts = posts
    .filter((post) => (post.commentCount ?? 0) > 0)
    .sort((left, right) => right.createdAt - left.createdAt)
    .slice(0, 18);

  const commentGroups = await Promise.all(
    commentEligiblePosts.map(async (post) => ({
      post,
      comments: await fetchQuery(
        api.comments.getByPost,
        {
          postId: post.postId as Id<"posts">
        },
        token ? { token } : undefined
      )
    }))
  );

  return commentGroups.flatMap(({ post, comments }) => {
    const commentMap = new Map(comments.map((comment) => [comment._id, comment]));
    return comments
      .slice(-10)
      .map((comment) =>
        buildCommentSource(
          post,
          comment,
          comment.parentCommentId ? (commentMap.get(comment.parentCommentId) ?? undefined) : undefined
        )
      )
      .filter((comment): comment is SourcePost => comment !== null);
  });
}

async function getScopedPosts(token: string | null, roomId?: string, options?: { allowEmpty?: boolean; includeComments?: boolean }) {
  const rooms = await getAiScopedRooms(token);
  const scopedRooms = roomId ? rooms.filter((room) => room._id === roomId) : rooms;

  if (scopedRooms.length === 0) {
    throw new AiServiceError("no_authorized_sources", 422, "No authorized AI-enabled sources were found.");
  }

  const postGroups = await Promise.all(scopedRooms.map(async (room) => ({ room, posts: await getRoomPosts(token, room) })));
  const posts = postGroups.flatMap((group) => group.posts);
  const commentSources = options?.includeComments ? (await Promise.all(postGroups.map((group) => getRoomCommentSources(token, group.posts)))).flat() : [];
  const sources = options?.includeComments ? [...posts, ...commentSources] : posts;

  if (sources.length === 0 && !options?.allowEmpty) {
    throw new AiServiceError("no_authorized_sources", 422, "No authorized sources were found for this request.");
  }

  return {
    rooms: scopedRooms,
    posts: sources
  };
}

function buildAssistantAbstentionReply(
  assistantIntent: ReturnType<typeof classifyAssistantIntent>,
  roomName: string | null
): AssistantReply {
  return {
    reply: "I do not have enough grounded room evidence to answer that reliably yet. Narrow it to one room, one deadline, one artifact, or one thread so I can return a precise answer.",
    confidenceBand: "low",
    suggestions: buildAssistantSuggestions(assistantIntent, roomName),
    sources: []
  };
}

function summarizeDeterministically(posts: SourcePost[], roomName: string): RoomSummary {
  const ordered = [...posts].sort((left, right) => right.createdAt - left.createdAt);
  const latest = ordered.slice(0, 5);
  const keyPoints = Array.from(
    new Set(
      ordered
        .flatMap((post) => post.tags ?? [])
        .filter(Boolean)
        .map((tag) => tag.replace(/^#/, ""))
    )
  ).slice(0, 4);
  const openQuestions = ordered
    .filter((post) => post.type === "question" || post.content.includes("?"))
    .slice(0, 3)
    .map((post) => post.content.split("\n")[0].trim())
    .filter(Boolean);

  if (posts.length === 0) {
    return {
      roomId: "",
      roomName,
      summary: `${roomName} does not have enough visible discussion yet to generate a meaningful summary. Publish notes, questions, resources, or announcements and the summary will start reflecting real room activity.`,
      keyPoints: [],
      openQuestions: []
    };
  }

  const summaryParts = [
    `${roomName} currently has ${posts.length} visible posts in active context.`,
    latest.length > 0
      ? `Recent focus includes ${latest
          .map((post) => post.title.trim() || post.type)
          .slice(0, 3)
          .join(", ")}.`
      : "No recent discussion activity is available yet.",
    keyPoints.length > 0 ? `Repeated themes include ${keyPoints.join(", ")}.` : "There are not enough repeated themes yet to infer stable topic patterns."
  ];

  return {
    roomId: posts[0]?.roomId ?? ("" as string),
    roomName,
    summary: summaryParts.join(" "),
    keyPoints,
    openQuestions
  };
}

function buildDeterministicStudyPlan(
  planner: Awaited<ReturnType<typeof fetchQuery<typeof api.planner.getSnapshot>>>
): StudyPlan {
  const highestRisk = planner.items.slice(0, 3);
  const sessions = planner.sessions.slice(0, 8).map((session) => ({
    id: session.id,
    title: session.title,
    startAt: session.startAt,
    endAt: session.endAt,
    urgency: toConfidenceBand(session.urgency),
    reasoning: session.reasoning
  }));

  const summary =
    highestRisk.length === 0
      ? "No deadlines are currently tracked, so the planner is waiting for new academic work to schedule."
      : `Prioritize ${highestRisk.map((item) => item.title).join(", ")} first. ${planner.metrics.dueSoonCount} deadline${
          planner.metrics.dueSoonCount === 1 ? "" : "s"
        } need attention soon, and ${planner.metrics.highRiskCount} item${
          planner.metrics.highRiskCount === 1 ? "" : "s"
        } are currently marked high risk.`;

  return {
    summary,
    confidenceBand: highestRisk.some((item) => item.urgency === "high") ? "high" : "medium",
    sessions
  };
}

function mapKnowledgeSources(postIds: string[], chunks: Awaited<ReturnType<typeof retrieveChunks>>) {
  const unique = new Map<string, (typeof chunks)[number]>();
  for (const chunk of chunks) {
    if (postIds.includes(chunk.postId) && !unique.has(chunk.postId)) {
      unique.set(chunk.postId, chunk);
    }
  }

  return [...unique.values()].map((chunk) => ({
    postId: chunk.postId,
    roomId: chunk.roomId,
    roomName: chunk.roomName,
    title: chunk.title,
    type: chunk.type,
    quote: chunk.quote,
    score: chunk.score,
    authorityBand: chunk.authorityBand,
    freshnessBand: chunk.freshnessBand,
    sourceTier: chunk.sourceTier
    }));
}

function buildAssistantSources(parsedSourceIds: string[], chunks: Awaited<ReturnType<typeof retrieveChunks>>) {
  const mapped = mapKnowledgeSources(parsedSourceIds, chunks);
  if (mapped.length > 0) {
    return mapped;
  }

  return chunks.slice(0, 2).map((chunk) => ({
    postId: chunk.postId,
    roomId: chunk.roomId,
    roomName: chunk.roomName,
    title: chunk.title,
    type: chunk.type,
    quote: chunk.quote,
    score: chunk.score,
    authorityBand: chunk.authorityBand,
    freshnessBand: chunk.freshnessBand,
    sourceTier: chunk.sourceTier
  }));
}

function buildMentionLocalContext(value: ReturnType<typeof parseAssistantPromptContext>) {
  return [value.postTitle, value.postContent, value.parentCommentContent].filter(Boolean).join("\n\n");
}

function isJoinedClassesQuestion(value: string) {
  const normalized = value.toLowerCase();
  return (
    (normalized.includes("class") || normalized.includes("classes") || normalized.includes("room") || normalized.includes("rooms")) &&
    (normalized.includes("joined") || normalized.includes("jioned") || normalized.includes("join")) &&
    (normalized.includes("how many") || normalized.includes("total count") || normalized.includes("count"))
  );
}

function isRoomCountQuestion(value: string) {
  const normalized = value.toLowerCase();
  return (
    (normalized.includes("room") || normalized.includes("rooms") || normalized.includes("class") || normalized.includes("classes")) &&
    (normalized.includes("how many") || normalized.includes("total count") || normalized.includes("count") || normalized.includes("total"))
  );
}

function isStudyNextQuestion(value: string) {
  const normalized = value.toLowerCase();
  return normalized.includes("study next") || normalized.includes("what should i study") || normalized.includes("what do i study next");
}

function isWeeklyAttentionQuestion(value: string) {
  const normalized = value.toLowerCase();
  return normalized.includes("attention this week") || normalized.includes("needs attention this week") || normalized.includes("what needs attention this week");
}

function isUrgentDeadlineQuestion(value: string) {
  const normalized = value.toLowerCase();
  return (
    normalized.includes("urgent upcoming deadline") ||
    normalized.includes("most urgent upcoming deadline") ||
    (normalized.includes("urgent") && normalized.includes("deadline")) ||
    (normalized.includes("deadline") && normalized.includes("upcoming"))
  );
}

async function getJoinedClassesReply(token: string | null) {
  const rooms = await fetchQuery(api.rooms.getMyRooms, {}, token ? { token } : undefined);
  const count = rooms.length;
  const names = rooms.slice(0, 6).map((room) => room.name);

  return {
    reply:
      count === 0
        ? "You have not joined any classes yet."
        : count === 1
          ? `You have joined 1 class: ${names[0]}.`
          : `You have joined ${count} classes${names.length > 0 ? `: ${names.join(", ")}.` : "."}`,
    confidenceBand: "high" as const,
    suggestions: count > 0 ? ["Open the Rooms screen if you want the full list and current activity."] : ["Open Rooms to join or create a class workspace."],
    sources: []
  };
}

async function getRoomCountReply(token: string | null) {
  const rooms = await fetchQuery(api.rooms.getMyRooms, {}, token ? { token } : undefined);
  const count = rooms.length;
  return {
    reply:
      count === 0
        ? "You currently have 0 rooms."
        : count === 1
          ? "You currently have 1 room."
          : `You currently have ${count} rooms.`,
    confidenceBand: "high" as const,
    suggestions: count > 0 ? ["Open the Rooms screen to review them in detail."] : ["Open Rooms to join or create your first workspace."],
    sources: []
  };
}

async function getUrgentDeadlineReply(token: string | null) {
  const planner = await fetchQuery(api.planner.getSnapshot, {}, token ? { token } : undefined);
  const top = planner.items[0];

  if (!top) {
    return {
      reply: "There are no tracked upcoming deadlines right now.",
      confidenceBand: "high" as const,
      suggestions: ["Add a manual deadline or join a room with deadline posts to populate the planner."],
      sources: []
    };
  }

  return {
    reply: `The most urgent upcoming deadline is ${top.title}${top.roomName ? ` in ${top.roomName}` : ""}. It is due ${new Date(top.dueDate).toLocaleString()} and is currently rated at ${top.riskScore}% risk.`,
    confidenceBand: "high" as const,
    suggestions: ["Open the Planner screen to schedule or review the next study block."],
    sources: []
  };
}

async function getStudyNextReply(token: string | null) {
  const planner = await fetchQuery(api.planner.getSnapshot, {}, token ? { token } : undefined);
  const top = planner.items[0];
  const nextSession = planner.sessions[0];

  if (!top) {
    return {
      reply: "There is nothing scheduled to study next because no active deadlines are tracked yet.",
      confidenceBand: "high" as const,
      suggestions: ["Add a manual deadline or join an active class room first."],
      sources: []
    };
  }

  return {
    reply: `Study ${top.title}${top.roomName ? ` from ${top.roomName}` : ""} next. It has the highest current planning priority at ${top.riskScore}% risk${nextSession ? `, and the next suggested study block starts ${new Date(nextSession.startAt).toLocaleString()}` : ""}.`,
    confidenceBand: "high" as const,
    suggestions: ["Open Planner to review the full sequence of study sessions."],
    sources: []
  };
}

async function getWeeklyAttentionReply(token: string | null) {
  const planner = await fetchQuery(api.planner.getSnapshot, {}, token ? { token } : undefined);
  const topItems = planner.items.slice(0, 3);

  if (topItems.length === 0) {
    return {
      reply: "Nothing is currently flagged for attention this week because there are no tracked deadlines yet.",
      confidenceBand: "high" as const,
      suggestions: ["Add deadlines in Planner or join rooms with active coursework."],
      sources: []
    };
  }

  return {
    reply: `This week needs attention on ${topItems.map((item) => item.title).join(", ")}. The highest current risk is ${planner.metrics.highRiskCount} high-risk item${planner.metrics.highRiskCount === 1 ? "" : "s"} across ${planner.metrics.dueSoonCount} due-soon deadline${planner.metrics.dueSoonCount === 1 ? "" : "s"}.`,
    confidenceBand: "high" as const,
    suggestions: ["Open Planner to schedule the highest-risk work first."],
    sources: []
  };
}

async function resolveDirectAssistantIntent(token: string | null, value: string) {
  if (isJoinedClassesQuestion(value)) {
    return getJoinedClassesReply(token);
  }

  if (isRoomCountQuestion(value)) {
    return getRoomCountReply(token);
  }

  if (isUrgentDeadlineQuestion(value)) {
    return getUrgentDeadlineReply(token);
  }

  if (isStudyNextQuestion(value)) {
    return getStudyNextReply(token);
  }

  if (isWeeklyAttentionQuestion(value)) {
    return getWeeklyAttentionReply(token);
  }

  return null;
}

async function runWithFallback<T>({
  route,
  actorId,
  primary,
  fallback
}: {
  route: string;
  actorId: string | null;
  primary: () => Promise<T>;
  fallback: () => Promise<T>;
}) {
  const startedAt = Date.now();
  const requestId = createRequestId();

  try {
    const data = await primary();
    const latencyMs = Date.now() - startedAt;
    logTelemetry({ requestId, route, actorId, status: 200, latencyMs, mode: "openai" });
    return {
      data,
      meta: buildMeta(route, requestId, latencyMs, "openai"),
      error: null
    } satisfies AiEnvelope<T>;
  } catch (error) {
    if (error instanceof AiServiceError && (error.code === "ai_disabled" || error.code === "no_authorized_sources")) {
      const latencyMs = Date.now() - startedAt;
      logTelemetry({
        requestId,
        route,
        actorId,
        status: error.status,
        latencyMs,
        mode: "fallback",
        details: { code: error.code }
      });
      throw {
        status: error.status,
        body: {
          data: null,
          meta: buildMeta(route, requestId, latencyMs, "fallback"),
          error: {
            code: error.code,
            message: error.message
          }
        }
      };
    }

    const data = await fallback();
    const latencyMs = Date.now() - startedAt;
    logTelemetry({
      requestId,
      route,
      actorId,
      status: 200,
      latencyMs,
      mode: "fallback",
      details: {
        degradedFrom: error instanceof Error ? error.message : "unknown"
      }
    });
    return {
      data,
      meta: buildMeta(route, requestId, latencyMs, "fallback"),
      error: null
    } satisfies AiEnvelope<T>;
  }
}

export async function getKnowledgeAnswer(question: string) {
  const { userId, token } = await getConvexToken();
  const knowledgeIntent = classifyKnowledgeIntent(question);

  return runWithFallback<KnowledgeAnswer>({
    route: "/api/v1/ai/knowledge/query",
    actorId: userId,
    primary: async () => {
      const { posts } = await getScopedPosts(token);
      return withTimeout(async (client, signal) => {
        const chunks = await retrieveChunks({ client, question, posts, strategy: "knowledge" });
        const parsed = await parseStructured({
          client,
          signal,
          schema: knowledgeSchema,
          schemaName: "knowledge_answer",
          instructions: buildKnowledgeInstructions(knowledgeIntent),
          input: `Question:\n${question}\n\nAuthorized sources:\n${chunks
            .map(
              (chunk, index) =>
                `[${index + 1}] ${chunk.roomName} | ${chunk.title} | authority=${chunk.authorityBand} | freshness=${chunk.freshnessBand}\n${chunk.content}`
            )
            .join("\n\n")}`
        });

        return {
          answer: parsed.answer,
          confidenceBand: parsed.confidenceBand,
          followUp: parsed.followUp ?? buildKnowledgeFollowUp(knowledgeIntent),
          abstained: parsed.abstained,
          sources: mapKnowledgeSources(parsed.sourcePostIds, chunks)
        };
      });
    },
    fallback: async () => {
      try {
        const result = await fetchQuery(api.ai.queryKnowledgeBase, { question }, token ? { token } : undefined);
        return {
          answer: result.answer,
          confidenceBand: toConfidenceBand(result.confidence),
          followUp: buildKnowledgeFollowUp(knowledgeIntent),
          abstained: result.mode === "fallback",
          sources: result.sources.map((source) => ({
            ...source,
            quote: source.title
          }))
        };
      } catch {
        if (isUrgentDeadlineQuestion(question)) {
          try {
            const planner = await fetchQuery(api.planner.getSnapshot, {}, token ? { token } : undefined);
            const top = planner.items[0];

            if (top) {
              return {
                answer: `The closest upcoming deadline is ${top.title}${top.roomName ? ` in ${top.roomName}` : ""}. It is due ${new Date(top.dueDate).toLocaleString()} and is currently rated at ${top.riskScore}% risk.`,
                confidenceBand: "medium",
                followUp: "Open Planner if you want the full study sequence around this deadline.",
                abstained: false,
                sources: top.roomId
                  ? [
                      {
                        postId: top.id,
                        roomId: top.roomId,
                        roomName: top.roomName ?? "Room",
                        title: top.title,
                        type: "deadline",
                        quote: top.title
                      }
                    ]
                  : []
              };
            }
          } catch {
            // fall through to the generic response below
          }

          try {
            const accessibleRooms = token
              ? await fetchQuery(api.rooms.getMyRooms, {}, { token })
              : await fetchQuery(api.rooms.getPublicRooms, {});
            const questionTerms = question
              .toLowerCase()
              .split(/[^a-z0-9]+/)
              .map((term) => term.trim())
              .filter((term) => term.length > 2);
            const matchedRooms = accessibleRooms.filter((room) =>
              questionTerms.some((term) => `${room.name} ${room.subject}`.toLowerCase().includes(term))
            );
            const roomsToCheck = matchedRooms.length > 0 ? matchedRooms : accessibleRooms;

            const roomDeadlineCandidates = await Promise.all(
              roomsToCheck.slice(0, 6).map(async (room) => ({
                room,
                posts: await fetchQuery(api.posts.getByRoom, { roomId: room._id, limit: 60 }, token ? { token } : undefined)
              }))
            );

            const deadlinePosts = roomDeadlineCandidates.flatMap(({ room, posts }) =>
              posts
                .filter((post) => post.type === "deadline" && !post.isDeleted && !post.isHidden && post.deadlineDate && post.deadlineDate > Date.now())
                .map((post) => ({
                  id: post._id,
                  roomId: post.roomId,
                  roomName: room.name,
                  title: post.deadlineTitle || post.content.slice(0, 72),
                  dueDate: post.deadlineDate!,
                  riskScore: 60
                }))
            );

            const topDeadline = deadlinePosts.sort((left, right) => left.dueDate - right.dueDate)[0];
            if (topDeadline) {
              return {
                answer: `The closest upcoming deadline is ${topDeadline.title}${topDeadline.roomName ? ` in ${topDeadline.roomName}` : ""}. It is due ${new Date(topDeadline.dueDate).toLocaleString()} and is currently rated at ${topDeadline.riskScore}% risk.`,
                confidenceBand: "medium",
                followUp: "Open Planner if you want the full study sequence around this deadline.",
                abstained: false,
                sources: [
                  {
                    postId: topDeadline.id,
                    roomId: topDeadline.roomId ?? "",
                    roomName: topDeadline.roomName ?? "Room",
                    title: topDeadline.title,
                    type: "deadline",
                    quote: topDeadline.title
                  }
                ]
              };
            }
          } catch {
            // fall through to the generic response below
          }
        }

        return {
          answer: "I could not ground this answer from the live workspace right now.",
          confidenceBand: "low",
          followUp: buildKnowledgeFollowUp(knowledgeIntent),
          abstained: true,
          sources: []
        };
      }
    }
  });
}

export async function getDeadlineRisk() {
  const { userId, token } = await getConvexToken();

  return runWithFallback<DeadlineRiskItem[]>({
    route: "/api/v1/ai/deadline-risk",
    actorId: userId,
    primary: async () => {
      const [planner, analytics] = await Promise.all([
        fetchQuery(api.planner.getSnapshot, {}, token ? { token } : undefined),
        fetchQuery(api.analytics.getWorkspaceAnalytics, {}, token ? { token } : undefined)
      ]);

      return withTimeout(async (client, signal) => {
        const parsed = await parseStructured({
          client,
          signal,
          schema: deadlineRiskSchema,
          schemaName: "deadline_risk",
          instructions:
            "Calibrate risk conservatively from the supplied planner data. Keep explanations short and operational. Do not invent deadlines.",
          input: JSON.stringify({
            generatedAt: planner.generatedAt,
            metrics: planner.metrics,
            items: planner.items.slice(0, 10),
            upcomingDeadlines: analytics.upcomingDeadlines
          })
        });

        return parsed.summary
          .map((item) => {
            const source = planner.items.find((deadline) => deadline.id === item.postId);
            if (!source || !source.roomId || !source.roomName) {
              return null;
            }
            return {
              postId: source.id,
              roomId: source.roomId,
              roomName: source.roomName,
              title: source.title,
              dueDate: source.dueDate,
              score: item.score,
              band: item.band,
              explanation: item.explanation
            };
          })
          .filter((item): item is DeadlineRiskItem => item !== null);
      });
    },
    fallback: async () => {
      try {
        return (await fetchQuery(api.ai.getDeadlineRisk, {}, token ? { token } : undefined)).map((item) => ({
          postId: item.postId,
          roomId: item.roomId,
          roomName: item.roomName,
          title: item.title,
          dueDate: item.dueDate,
          score: item.score,
          band: toConfidenceBand(item.band),
          explanation: item.explanation
        }));
      } catch {
        return [];
      }
    }
  });
}

export async function getLearningProfile() {
  const { userId, token } = await getConvexToken();

  return runWithFallback<LearningProfile>({
    route: "/api/v1/ai/learning-profile",
    actorId: userId,
    primary: async () => {
      const [me, activity] = await Promise.all([
        fetchQuery(api.reputation.getMe, {}, token ? { token } : undefined),
        fetchQuery(api.reputation.getActivity, {}, token ? { token } : undefined)
      ]);

      return withTimeout(async (client, signal) => {
        const parsed = await parseStructured({
          client,
          signal,
          schema: learningProfileSchema,
          schemaName: "learning_profile",
          instructions:
            "Infer only directional topic strengths from visible contribution data. Avoid permanent or punitive language.",
          input: JSON.stringify({
            summary: me,
            activity: activity.slice(0, 10)
          })
        });

        return parsed;
      });
    },
    fallback: async () => {
      try {
        const result = await fetchQuery(api.ai.getLearningProfile, {}, token ? { token } : undefined);
        return {
          summary: result.summary,
          expertise: result.expertise.map((item) => ({
            topic: item.topic,
            score: item.score,
            confidence: toConfidenceBand(item.confidence),
            evidence: item.evidence
          }))
        };
      } catch {
        return {
          summary: "There is not enough stable contribution data available yet to infer a learning profile.",
          expertise: []
        };
      }
    }
  });
}

export async function getStudyPlan() {
  const { userId, token } = await getConvexToken();

  return runWithFallback<StudyPlan>({
    route: "/api/v1/ai/study-plan",
    actorId: userId,
    primary: async () => {
      const planner = await fetchQuery(api.planner.getSnapshot, {}, token ? { token } : undefined);
      if (planner.items.length === 0 || planner.sessions.length === 0) {
        return buildDeterministicStudyPlan(planner);
      }
      return withTimeout(async (client, signal) => {
        const parsed = await parseStructured({
          client,
          signal,
          schema: studyPlanSchema,
          schemaName: "study_plan",
          instructions:
            "Refine study sessions from the provided planner snapshot. Stay within the supplied sessions, keep all dates and times unchanged, make reasoning specific, and produce a crisp operational summary that explains what should be tackled first.",
          input: JSON.stringify({
            metrics: planner.metrics,
            items: planner.items.slice(0, 12),
            sessions: planner.sessions.slice(0, 12)
          })
        });

        return parsed;
      });
    },
    fallback: async () => {
      try {
        const planner = await fetchQuery(api.planner.getSnapshot, {}, token ? { token } : undefined);
        return buildDeterministicStudyPlan(planner);
      } catch {
        return buildDeterministicStudyPlan({
          generatedAt: Date.now(),
          metrics: {
            totalDeadlines: 0,
            dueSoonCount: 0,
            highRiskCount: 0,
            plannedHours: 0
          },
          items: [],
          sessions: []
        } as Awaited<ReturnType<typeof fetchQuery<typeof api.planner.getSnapshot>>>);
      }
    }
  });
}

export async function getBriefing() {
  const { userId, token } = await getConvexToken();

  return runWithFallback<AiBriefing>({
    route: "/api/v1/ai/briefing",
    actorId: userId,
    primary: async () => {
      const [planner, analytics] = await Promise.all([
        fetchQuery(api.planner.getSnapshot, {}, token ? { token } : undefined),
        fetchQuery(api.analytics.getWorkspaceAnalytics, {}, token ? { token } : undefined)
      ]);

      return withTimeout(async (client, signal) => {
        const parsed = await parseStructured({
          client,
          signal,
          schema: briefingSchema,
          schemaName: "ai_briefing",
          instructions:
            "Summarize the workspace as a short direct student briefing with immediate priorities and warnings grounded in current planner and analytics data.",
          input: JSON.stringify({
            plannerMetrics: planner.metrics,
            topDeadlines: planner.items.slice(0, 5),
            analytics
          })
        });

        return parsed;
      });
    },
    fallback: async () => {
      try {
        const planner = await fetchQuery(api.planner.getSnapshot, {}, token ? { token } : undefined);
        const upcoming = planner.items.slice(0, 3);
        const highRisk = planner.items.filter((item) => item.urgency === "high").slice(0, 3);
        return {
          summary:
            upcoming.length === 0
              ? "No active deadline pressure is visible yet. Add deadlines or join more active rooms and the briefing will start reflecting live academic work."
              : `Your current briefing is centered on ${upcoming.map((item) => item.title).join(", ")}. ${planner.metrics.dueSoonCount} deadline${
                  planner.metrics.dueSoonCount === 1 ? "" : "s"
                } are due soon and ${planner.metrics.highRiskCount} item${planner.metrics.highRiskCount === 1 ? "" : "s"} are marked high risk.`,
          priorities: upcoming.map((item) => `${item.title}${item.roomName ? ` in ${item.roomName}` : ""}`),
          warnings: highRisk.map((item) => item.explanation)
        };
      } catch {
        return {
          summary: "No active deadline pressure is visible yet.",
          priorities: [],
          warnings: []
        };
      }
    }
  });
}

export async function getRoomSummary(roomId: string) {
  const { userId, token } = await getConvexToken();

  return runWithFallback<RoomSummary>({
    route: "/api/v1/ai/room-summary",
    actorId: userId,
    primary: async () => {
      const { rooms, posts } = await getScopedPosts(token, roomId, { allowEmpty: true });
      const room = rooms[0];
      if (posts.length === 0) {
        return {
          ...summarizeDeterministically(posts, room.name),
          roomId,
          roomName: room.name
        };
      }
      return withTimeout(async (client, signal) => {
        const parsed = await parseStructured({
          client,
          signal,
          schema: roomSummarySchema,
          schemaName: "room_summary",
          instructions:
            "Summarize this room only from the provided posts. Be concise, direct, and concrete. Surface what changed, what matters now, and what still needs resolution. Separate settled points from open questions, mention urgent deadlines or requests when present, and avoid vague filler.",
          input: `Room: ${room.name}\n\nPosts:\n${posts
            .slice(0, 24)
            .map((post) => `${post.title}\n${post.content}`)
            .join("\n\n")}`
        });

        return {
          roomId,
          roomName: room.name,
          summary: parsed.summary,
          keyPoints: parsed.keyPoints,
          openQuestions: parsed.openQuestions
        };
      });
    },
    fallback: async () => {
      try {
        const { rooms, posts } = await getScopedPosts(token, roomId, { allowEmpty: true });
        const room = rooms[0];
        const deterministic = summarizeDeterministically(posts, room?.name ?? "Room");
        return {
          ...deterministic,
          roomId,
          roomName: room?.name ?? deterministic.roomName
        };
      } catch {
        return {
          roomId,
          roomName: "Room",
          summary: "This room does not have enough visible discussion yet to generate a meaningful summary.",
          keyPoints: [],
          openQuestions: []
        };
      }
    }
  });
}

export async function getAssistantReply(message: string, roomId?: string) {
  const { userId, token } = await getConvexToken();
  const mentionContext = parseAssistantPromptContext(message);
  const normalizedMessage = mentionContext.userRequest || extractAssistantUserRequest(message);
  const assistantIntent = classifyAssistantIntent(normalizedMessage, mentionContext);
  const localMentionContext = buildMentionLocalContext(mentionContext);

  return runWithFallback<AssistantReply>({
    route: "/api/v1/ai/assistant",
    actorId: userId,
    primary: async () => {
      const directIntent = await resolveDirectAssistantIntent(token, normalizedMessage);
      if (directIntent) {
        return directIntent;
      }
      const { posts } = await getScopedPosts(token, roomId, { includeComments: true });
      return withTimeout(async (client, signal) => {
        const retrievalQuery = [normalizedMessage, mentionContext.postTitle, mentionContext.postType, mentionContext.parentCommentContent]
          .filter(Boolean)
          .join("\n");
        const chunks = await retrieveChunks({
          client,
          question: retrievalQuery || normalizedMessage,
          posts,
          strategy: "mention",
          localContext: localMentionContext
        });
        const parsed = await parseStructured({
          client,
          signal,
          schema: assistantSchema,
          schemaName: "assistant_reply",
          instructions: buildAssistantInstructions(assistantIntent),
          input: `Request:\n${normalizedMessage}\n\nDiscussion context:\nPost type: ${mentionContext.postType ?? "unknown"}\nPost title: ${mentionContext.postTitle ?? "unknown"}\n${mentionContext.postContent ? `Post content:\n${mentionContext.postContent}\n` : ""}${mentionContext.parentCommentContent ? `Parent comment:\n${mentionContext.parentCommentContent}\n` : ""}\nAuthorized context:\n${chunks
            .map((chunk, index) => `[${index + 1}] ${chunk.roomName} | ${chunk.title} | authority=${chunk.authorityBand} | freshness=${chunk.freshnessBand}\n${chunk.content}`)
            .join("\n\n")}`
        });

        return {
          reply: parsed.reply,
          confidenceBand: parsed.confidenceBand,
          suggestions: parsed.suggestions.length > 0 ? parsed.suggestions : buildAssistantSuggestions(assistantIntent, chunks[0]?.roomName ?? null),
          sources: buildAssistantSources(parsed.sourcePostIds, chunks)
        };
      });
    },
    fallback: async () => {
      const directIntent = await resolveDirectAssistantIntent(token, normalizedMessage);
      if (directIntent) {
        return directIntent;
      }

      try {
        const result = await fetchQuery(api.ai.queryKnowledgeBase, { question: normalizedMessage }, token ? { token } : undefined);

        if (result.sources.length === 0) {
          return buildAssistantAbstentionReply(assistantIntent, result.sources[0]?.roomName ?? null);
        }
        return {
          reply: result.answer,
          confidenceBand: toConfidenceBand(result.confidence),
          suggestions: buildAssistantSuggestions(assistantIntent, result.sources[0]?.roomName ?? null),
          sources: result.sources.map((source) => ({
            ...source,
            quote: source.title
          }))
        };
      } catch {
        return buildAssistantAbstentionReply(assistantIntent, null);
      }
    }
  });
}

export async function getComposerSuggestion(prompt: string, roomId?: string) {
  const { userId, token } = await getConvexToken();

  return runWithFallback<ComposerSuggestion>({
    route: "/api/v1/ai/composer/suggest",
    actorId: userId,
    primary: async () => {
      const { posts, rooms } = await getScopedPosts(token, roomId);
      return withTimeout(async (client, signal) => {
        const chunks = await retrieveChunks({ client, question: prompt, posts, limit: 4, strategy: "composer" });
        const parsed = await parseStructured({
          client,
          signal,
          schema: composerSchema,
          schemaName: "composer_suggestion",
          instructions:
            "Draft a workspace post suggestion grounded in the visible room context. Keep the language clear and useful. Do not claim facts not present in the sources.",
          input: `Prompt:\n${prompt}\n\nRoom scope:\n${rooms.map((room) => room.name).join(", ")}\n\nContext:\n${chunks
            .map((chunk) => `${chunk.roomName} | ${chunk.title}\n${chunk.content}`)
            .join("\n\n")}`
        });

        return parsed;
      });
    },
    fallback: async () => ({
      title: "Draft this post manually",
      body: prompt.trim(),
      tags: [],
      disclaimer: "The AI drafting service is unavailable, so this suggestion is a direct carry-forward of your prompt."
    })
  });
}

export function toErrorEnvelope(error: unknown, route: string) {
  if (typeof error === "object" && error !== null && "status" in error && "body" in error) {
    return error as { status: number; body: AiEnvelope<null> };
  }

  if (error instanceof AiValidationError) {
    return {
      status: error.status,
      body: {
        data: null,
        meta: buildMeta(route, createRequestId(), 0, "fallback"),
        error: {
          code: error.code,
          message: error.message
        }
      }
    };
  }

  if (error instanceof AiServiceError) {
    return {
      status: error.status,
      body: {
        data: null,
        meta: buildMeta(route, createRequestId(), 0, "fallback"),
        error: {
          code: error.code,
          message: error.message
        }
      }
    };
  }

  return {
    status: 503,
    body: {
      data: null,
      meta: buildMeta(route, createRequestId(), 0, "fallback"),
      error: {
        code: "ai_unavailable",
        message: error instanceof Error ? error.message : "AI service unavailable."
      }
    }
  };
}
