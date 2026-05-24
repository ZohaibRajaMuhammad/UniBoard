import OpenAI from "openai";
import { AI_EMBEDDING_MODEL, AI_MAX_CHUNKS } from "./config";
import { assertContextBudget } from "./safety";

export type SourcePost = {
  postId: string;
  sourceId?: string;
  sourceKind?: "post" | "comment";
  roomId: string;
  roomName: string;
  title: string;
  type: string;
  content: string;
  tags: string[];
  createdAt: number;
  authorRole?: string | null;
  isResolved?: boolean;
  isPinned?: boolean;
  commentCount?: number;
};

export type RetrievedChunk = {
  id: string;
  postId: string;
  roomId: string;
  roomName: string;
  title: string;
  type: string;
  quote: string;
  content: string;
  score: number;
  authorityBand: "canonical" | "trusted" | "community";
  freshnessBand: "fresh" | "recent" | "stale";
  sourceTier: number;
};

const embeddingCache = new Map<string, number[]>();

const LOW_SIGNAL_PATTERNS = [
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

function cosineSimilarity(left: number[], right: number[]) {
  let dot = 0;
  let leftNorm = 0;
  let rightNorm = 0;

  for (let index = 0; index < left.length; index += 1) {
    const leftValue = left[index] ?? 0;
    const rightValue = right[index] ?? 0;
    dot += leftValue * rightValue;
    leftNorm += leftValue * leftValue;
    rightNorm += rightValue * rightValue;
  }

  if (!leftNorm || !rightNorm) {
    return 0;
  }

  return dot / (Math.sqrt(leftNorm) * Math.sqrt(rightNorm));
}

function tokenize(value: string) {
  return value
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length > 2);
}

function isLowSignalContent(value: string) {
  const normalized = value.trim().replace(/\s+/g, " ");
  if (normalized.length < 18) {
    return true;
  }

  if (LOW_SIGNAL_PATTERNS.some((pattern) => pattern.test(normalized)) && normalized.length < 220) {
    return true;
  }

  const mentionCount = (normalized.match(/@uniboardai/gi) ?? []).length;
  if (mentionCount >= 2) {
    return true;
  }

  return false;
}

function getAuthorityBand(post: SourcePost): RetrievedChunk["authorityBand"] {
  const role = post.authorRole?.toLowerCase();
  const isAuthority = role === "teacher" || role === "admin" || role === "super_admin";

  if (isAuthority && (post.type === "announcement" || post.type === "deadline" || post.type === "resource" || post.isPinned)) {
    return "canonical";
  }

  if (isAuthority || post.isResolved || post.isPinned) {
    return "trusted";
  }

  return "community";
}

function getFreshnessBand(createdAt: number): RetrievedChunk["freshnessBand"] {
  const ageMs = Date.now() - createdAt;
  const dayMs = 24 * 60 * 60 * 1000;

  if (ageMs <= 7 * dayMs) {
    return "fresh";
  }

  if (ageMs <= 45 * dayMs) {
    return "recent";
  }

  return "stale";
}

function getSourceTier(authorityBand: RetrievedChunk["authorityBand"]) {
  if (authorityBand === "canonical") {
    return 1;
  }

  if (authorityBand === "trusted") {
    return 2;
  }

  return 3;
}

function buildChunks(posts: SourcePost[]) {
  return posts.flatMap((post) => {
    const normalized = [post.title, post.content, ...post.tags].filter(Boolean).join("\n").trim();
    if (!normalized || isLowSignalContent(normalized)) {
      return [];
    }

    const chunkSize = 700;
    const overlap = 120;
    const chunks: RetrievedChunk[] = [];
    const authorityBand = getAuthorityBand(post);
    const freshnessBand = getFreshnessBand(post.createdAt);
    const sourceTier = getSourceTier(authorityBand);

    for (let start = 0; start < normalized.length; start += chunkSize - overlap) {
      const content = normalized.slice(start, start + chunkSize).trim();
      if (!content) {
        continue;
      }

      chunks.push({
        id: `${post.sourceId ?? post.postId}-${start}`,
        postId: post.postId,
        roomId: post.roomId,
        roomName: post.roomName,
        title: post.title,
        type: post.type,
        quote: content.slice(0, 220),
        content,
        score: 0,
        authorityBand,
        freshnessBand,
        sourceTier
      });
    }

    return chunks;
  });
}

async function embedMany(client: OpenAI, values: string[]) {
  const missing = values.filter((value) => !embeddingCache.has(value));
  if (missing.length > 0) {
    const response = await client.embeddings.create({
      model: AI_EMBEDDING_MODEL,
      input: missing
    });

    response.data.forEach((item, index) => {
      embeddingCache.set(missing[index]!, item.embedding);
    });
  }

  return values.map((value) => embeddingCache.get(value) ?? []);
}

export async function retrieveChunks({
  client,
  question,
  posts,
  limit = AI_MAX_CHUNKS,
  strategy = "knowledge",
  localContext
}: {
  client: OpenAI;
  question: string;
  posts: SourcePost[];
  limit?: number;
  strategy?: "knowledge" | "mention" | "composer";
  localContext?: string;
}) {
  const chunks = buildChunks(posts).slice(0, 120);
  if (chunks.length === 0) {
    return [];
  }

  assertContextBudget(chunks.map((chunk) => chunk.content));

  const queryTokens = new Set(tokenize(question));
  const localContextTokens = new Set(tokenize(localContext ?? ""));
  const embeddings = await embedMany(client, [question, ...chunks.map((chunk) => chunk.content)]);
  const queryEmbedding = embeddings[0] ?? [];

  return chunks
    .map((chunk, index) => {
      const lexicalScore = tokenize(chunk.content).reduce(
        (sum, token) => sum + (queryTokens.has(token) ? 0.06 : 0),
        0
      );
      const semanticScore = cosineSimilarity(queryEmbedding, embeddings[index + 1] ?? []);
      const localContextScore =
        localContextTokens.size === 0
          ? 0
          : tokenize(chunk.content).reduce((sum, token) => sum + (localContextTokens.has(token) ? 0.07 : 0), 0);
      const authorityScore =
        chunk.authorityBand === "canonical" ? (strategy === "knowledge" ? 0.28 : 0.18) : chunk.authorityBand === "trusted" ? 0.14 : 0;
      const isDeadlineQuery = /deadline|due|urgent|when/.test(question.toLowerCase());
      const freshnessScore =
        chunk.freshnessBand === "fresh" ? 0.09 : chunk.freshnessBand === "recent" ? 0.04 : isDeadlineQuery ? -0.04 : 0;
      const structureScore =
        (chunk.type === "deadline" && /deadline|due|urgent|when/.test(question.toLowerCase()) ? 0.18 : 0) +
        (chunk.type === "question" && strategy === "mention" ? 0.06 : 0) +
        (chunk.type === "announcement" && strategy === "knowledge" ? 0.04 : 0);

      const totalScore =
        strategy === "mention"
          ? semanticScore + lexicalScore + localContextScore + authorityScore + freshnessScore + structureScore
          : strategy === "composer"
            ? semanticScore + lexicalScore + localContextScore * 0.5 + authorityScore * 0.8 + freshnessScore
            : semanticScore + lexicalScore + authorityScore + freshnessScore + structureScore;

      return {
        ...chunk,
        score: Number(totalScore.toFixed(4))
      };
    })
    .sort((left, right) => right.score - left.score)
    .slice(0, limit);
}
