import { auth } from "@clerk/nextjs/server";
import { fetchQuery } from "convex/nextjs";
import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { z } from "zod";
import { api } from "../../../convex/_generated/api";
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
import { extractAssistantUserRequest } from "./mentions";
import type { SourcePost } from "./retrieval";
import { retrieveChunks } from "./retrieval";
import { AiValidationError } from "./safety";

type RoomRecord = Awaited<ReturnType<typeof fetchQuery<typeof api.rooms.getMyRooms>>>[number];

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
  const authState = await auth();
  if (!authState.userId) {
    throw new AiServiceError("unauthenticated", 401, "Authentication required.");
  }

  const token =
    (await authState.getToken({ template: "convex" }).catch(() => null)) ??
    (await authState.getToken().catch(() => null));

  if (!token) {
    throw new AiServiceError("convex_token_unavailable", 503, "Unable to authorize Convex AI data access.");
  }

  return { userId: authState.userId, token };
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

async function getAiScopedRooms(token: string) {
  const rooms = await fetchQuery(api.rooms.getMyRooms, {}, { token });
  const aiRooms = rooms.filter((room) => room.aiEnabled);

  if (aiRooms.length === 0) {
    throw new AiServiceError("ai_disabled", 403, "AI is disabled for your accessible rooms.");
  }

  return aiRooms;
}

async function getRoomPosts(token: string, room: RoomRecord): Promise<SourcePost[]> {
  const posts = await fetchQuery(
    api.posts.getByRoom,
    {
      roomId: room._id,
      limit: 60
    },
    { token }
  );

  return posts.map((post) => ({
    postId: post._id,
    roomId: post.roomId,
    roomName: room.name,
    title: post.deadlineTitle || post.resourceTitle || post.content.slice(0, 80),
    type: post.type,
    content: post.content,
    tags: post.tags ?? [],
    createdAt: post.createdAt
  }));
}

async function getScopedPosts(token: string, roomId?: string, options?: { allowEmpty?: boolean }) {
  const rooms = await getAiScopedRooms(token);
  const scopedRooms = roomId ? rooms.filter((room) => room._id === roomId) : rooms;

  if (scopedRooms.length === 0) {
    throw new AiServiceError("no_authorized_sources", 422, "No authorized AI-enabled sources were found.");
  }

  const posts = (await Promise.all(scopedRooms.map((room) => getRoomPosts(token, room)))).flat();
  if (posts.length === 0 && !options?.allowEmpty) {
    throw new AiServiceError("no_authorized_sources", 422, "No authorized sources were found for this request.");
  }

  return {
    rooms: scopedRooms,
    posts
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
    score: chunk.score
  }));
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

async function getJoinedClassesReply(token: string) {
  const rooms = await fetchQuery(api.rooms.getMyRooms, {}, { token });
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

async function getRoomCountReply(token: string) {
  const rooms = await fetchQuery(api.rooms.getMyRooms, {}, { token });
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

async function getUrgentDeadlineReply(token: string) {
  const planner = await fetchQuery(api.planner.getSnapshot, {}, { token });
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

async function getStudyNextReply(token: string) {
  const planner = await fetchQuery(api.planner.getSnapshot, {}, { token });
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

async function getWeeklyAttentionReply(token: string) {
  const planner = await fetchQuery(api.planner.getSnapshot, {}, { token });
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

async function resolveDirectAssistantIntent(token: string, value: string) {
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

  return runWithFallback<KnowledgeAnswer>({
    route: "/api/v1/ai/knowledge/query",
    actorId: userId,
    primary: async () => {
      const { posts } = await getScopedPosts(token);
      return withTimeout(async (client, signal) => {
        const chunks = await retrieveChunks({ client, question, posts });
        const parsed = await parseStructured({
          client,
          signal,
          schema: knowledgeSchema,
          schemaName: "knowledge_answer",
          instructions:
            "Answer only from the provided study sources. Lead with the answer, keep it concise, structured, and professional, and avoid unnecessary clarification. If evidence is partial, say so directly. If evidence is weak, abstain plainly. Never invent facts, dates, or citations.",
          input: `Question:\n${question}\n\nAuthorized sources:\n${chunks
            .map(
              (chunk, index) =>
                `[${index + 1}] ${chunk.roomName} | ${chunk.title}\n${chunk.content}`
            )
            .join("\n\n")}`
        });

        return {
          answer: parsed.answer,
          confidenceBand: parsed.confidenceBand,
          followUp: parsed.followUp,
          abstained: parsed.abstained,
          sources: mapKnowledgeSources(parsed.sourcePostIds, chunks)
        };
      });
    },
    fallback: async () => {
      const result = await fetchQuery(api.ai.queryKnowledgeBase, { question }, { token });
      return {
        answer: result.answer,
        confidenceBand: toConfidenceBand(result.confidence),
        followUp: "Name the room, concept, or deadline more explicitly to improve grounding.",
        abstained: result.mode === "fallback",
        sources: result.sources.map((source) => ({
          ...source,
          quote: source.title
        }))
      };
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
        fetchQuery(api.planner.getSnapshot, {}, { token }),
        fetchQuery(api.analytics.getWorkspaceAnalytics, {}, { token })
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
    fallback: async () =>
      (await fetchQuery(api.ai.getDeadlineRisk, {}, { token })).map((item) => ({
        postId: item.postId,
        roomId: item.roomId,
        roomName: item.roomName,
        title: item.title,
        dueDate: item.dueDate,
        score: item.score,
        band: toConfidenceBand(item.band),
        explanation: item.explanation
      }))
  });
}

export async function getLearningProfile() {
  const { userId, token } = await getConvexToken();

  return runWithFallback<LearningProfile>({
    route: "/api/v1/ai/learning-profile",
    actorId: userId,
    primary: async () => {
      const [me, activity] = await Promise.all([
        fetchQuery(api.reputation.getMe, {}, { token }),
        fetchQuery(api.reputation.getActivity, {}, { token })
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
      const result = await fetchQuery(api.ai.getLearningProfile, {}, { token });
      return {
        summary: result.summary,
        expertise: result.expertise.map((item) => ({
          topic: item.topic,
          score: item.score,
          confidence: toConfidenceBand(item.confidence),
          evidence: item.evidence
        }))
      };
    }
  });
}

export async function getStudyPlan() {
  const { userId, token } = await getConvexToken();

  return runWithFallback<StudyPlan>({
    route: "/api/v1/ai/study-plan",
    actorId: userId,
    primary: async () => {
      const planner = await fetchQuery(api.planner.getSnapshot, {}, { token });
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
      const planner = await fetchQuery(api.planner.getSnapshot, {}, { token });
      return buildDeterministicStudyPlan(planner);
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
        fetchQuery(api.planner.getSnapshot, {}, { token }),
        fetchQuery(api.analytics.getWorkspaceAnalytics, {}, { token })
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
      const planner = await fetchQuery(api.planner.getSnapshot, {}, { token });
      return {
        summary: "Your workspace briefing is running in fallback mode. Use the planner and analytics screens directly for the latest grounded detail.",
        priorities: planner.items.slice(0, 3).map((item) => item.title),
        warnings: planner.items.filter((item) => item.urgency === "high").slice(0, 3).map((item) => item.explanation)
      };
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
      const { rooms, posts } = await getScopedPosts(token, roomId, { allowEmpty: true });
      const room = rooms[0];
      const deterministic = summarizeDeterministically(posts, room?.name ?? "Room");
      return {
        ...deterministic,
        roomId,
        roomName: room?.name ?? deterministic.roomName
      };
    }
  });
}

export async function getAssistantReply(message: string, roomId?: string) {
  const { userId, token } = await getConvexToken();
  const normalizedMessage = extractAssistantUserRequest(message);

  return runWithFallback<AssistantReply>({
    route: "/api/v1/ai/assistant",
    actorId: userId,
    primary: async () => {
      const directIntent = await resolveDirectAssistantIntent(token, normalizedMessage);
      if (directIntent) {
        return directIntent;
      }
      const { posts } = await getScopedPosts(token, roomId);
      return withTimeout(async (client, signal) => {
        const chunks = await retrieveChunks({ client, question: normalizedMessage, posts });
        const parsed = await parseStructured({
          client,
          signal,
          schema: assistantSchema,
          schemaName: "assistant_reply",
          instructions:
            "Act as Uniboard's academic workspace assistant. Reply in short, direct, professional language with a familiar but refined tone. Prefer 1 to 3 concise sentences or up to 3 tight bullets. Give the grounded answer first, avoid filler, avoid rephrasing the question, state uncertainty cleanly, and suggest only concrete next actions when useful.",
          input: `Request:\n${normalizedMessage}\n\nAuthorized context:\n${chunks
            .map((chunk, index) => `[${index + 1}] ${chunk.roomName} | ${chunk.title}\n${chunk.content}`)
            .join("\n\n")}`
        });

        return {
          reply: parsed.reply,
          confidenceBand: parsed.confidenceBand,
          suggestions: parsed.suggestions,
          sources: mapKnowledgeSources(parsed.sourcePostIds, chunks)
        };
      });
    },
    fallback: async () => {
      const directIntent = await resolveDirectAssistantIntent(token, normalizedMessage);
      if (directIntent) {
        return directIntent;
      }

      const result = await fetchQuery(api.ai.queryKnowledgeBase, { question: normalizedMessage }, { token });

      if (result.sources.length === 0) {
        return {
          reply: "I could not find grounded room material for that request. Name the course, topic, deadline, or artifact more explicitly.",
          confidenceBand: "low" as const,
          suggestions: ["Ask with a specific class name or open the relevant room before trying again."],
          sources: []
        };
      }

      const topSource = result.sources[0];
      const directSourceAnswer =
        topSource.title && topSource.title.trim().length > 20
          ? topSource.title.trim()
          : `The best grounded material I found is in ${topSource.roomName}.`;
      return {
        reply: directSourceAnswer,
        confidenceBand: toConfidenceBand(result.confidence),
        suggestions: [`Open ${topSource.roomName} if you want the surrounding discussion and source context.`],
        sources: result.sources.map((source) => ({
          ...source,
          quote: source.title
        }))
      };
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
        const chunks = await retrieveChunks({ client, question: prompt, posts, limit: 4 });
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
