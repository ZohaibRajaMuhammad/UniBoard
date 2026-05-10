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

async function getScopedPosts(token: string, roomId?: string) {
  const rooms = await getAiScopedRooms(token);
  const scopedRooms = roomId ? rooms.filter((room) => room._id === roomId) : rooms;

  if (scopedRooms.length === 0) {
    throw new AiServiceError("no_authorized_sources", 422, "No authorized AI-enabled sources were found.");
  }

  const posts = (await Promise.all(scopedRooms.map((room) => getRoomPosts(token, room)))).flat();
  if (posts.length === 0) {
    throw new AiServiceError("no_authorized_sources", 422, "No authorized sources were found for this request.");
  }

  return {
    rooms: scopedRooms,
    posts
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
            "Answer only from the provided study sources. If evidence is weak, abstain plainly. Never invent facts or citations.",
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
      return withTimeout(async (client, signal) => {
        const parsed = await parseStructured({
          client,
          signal,
          schema: studyPlanSchema,
          schemaName: "study_plan",
          instructions:
            "Refine study sessions from the provided planner snapshot. Stay within the supplied sessions and make reasoning specific.",
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
      return {
        summary: "The current study plan is running in deterministic fallback mode because the AI service is unavailable.",
        confidenceBand: "medium",
        sessions: planner.sessions.slice(0, 8).map((session) => ({
          id: session.id,
          title: session.title,
          startAt: session.startAt,
          endAt: session.endAt,
          urgency: toConfidenceBand(session.urgency),
          reasoning: session.reasoning
        }))
      };
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
            "Summarize the workspace as a short student briefing with priorities and warnings grounded in current planner and analytics data.",
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
      const { rooms, posts } = await getScopedPosts(token, roomId);
      const room = rooms[0];
      return withTimeout(async (client, signal) => {
        const parsed = await parseStructured({
          client,
          signal,
          schema: roomSummarySchema,
          schemaName: "room_summary",
          instructions:
            "Summarize this room only from the provided posts. Separate settled points from still-open questions.",
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
      const { rooms } = await getScopedPosts(token, roomId);
      return {
        roomId,
        roomName: rooms[0]?.name ?? "Room",
        summary: "The room summary is temporarily in fallback mode. Open the room timeline for the latest exact post context.",
        keyPoints: [],
        openQuestions: []
      };
    }
  });
}

export async function getAssistantReply(message: string, roomId?: string) {
  const { userId, token } = await getConvexToken();

  return runWithFallback<AssistantReply>({
    route: "/api/v1/ai/assistant",
    actorId: userId,
    primary: async () => {
      const { posts } = await getScopedPosts(token, roomId);
      return withTimeout(async (client, signal) => {
        const chunks = await retrieveChunks({ client, question: message, posts });
        const parsed = await parseStructured({
          client,
          signal,
          schema: assistantSchema,
          schemaName: "assistant_reply",
          instructions:
            "Act as an academic workspace assistant. Give a grounded reply, keep it concise, and suggest concrete next actions.",
          input: `Request:\n${message}\n\nAuthorized context:\n${chunks
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
      const result = await fetchQuery(api.ai.queryKnowledgeBase, { question: message }, { token });
      return {
        reply: result.answer,
        confidenceBand: toConfidenceBand(result.confidence),
        suggestions: ["Open the cited room post before acting on this answer."],
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
            "Draft a workspace post suggestion grounded in the visible room context. Do not claim facts not present in the sources.",
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
