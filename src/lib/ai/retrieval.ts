import OpenAI from "openai";
import { AI_EMBEDDING_MODEL, AI_MAX_CHUNKS } from "./config";
import { assertContextBudget } from "./safety";

export type SourcePost = {
  postId: string;
  roomId: string;
  roomName: string;
  title: string;
  type: string;
  content: string;
  tags: string[];
  createdAt: number;
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
};

const embeddingCache = new Map<string, number[]>();

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

function buildChunks(posts: SourcePost[]) {
  return posts.flatMap((post) => {
    const normalized = [post.title, post.content, ...post.tags].filter(Boolean).join("\n").trim();
    if (!normalized) {
      return [];
    }

    const chunkSize = 700;
    const overlap = 120;
    const chunks: RetrievedChunk[] = [];

    for (let start = 0; start < normalized.length; start += chunkSize - overlap) {
      const content = normalized.slice(start, start + chunkSize).trim();
      if (!content) {
        continue;
      }

      chunks.push({
        id: `${post.postId}-${start}`,
        postId: post.postId,
        roomId: post.roomId,
        roomName: post.roomName,
        title: post.title,
        type: post.type,
        quote: content.slice(0, 220),
        content,
        score: 0
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
  limit = AI_MAX_CHUNKS
}: {
  client: OpenAI;
  question: string;
  posts: SourcePost[];
  limit?: number;
}) {
  const chunks = buildChunks(posts).slice(0, 120);
  if (chunks.length === 0) {
    return [];
  }

  assertContextBudget(chunks.map((chunk) => chunk.content));

  const queryTokens = new Set(tokenize(question));
  const embeddings = await embedMany(client, [question, ...chunks.map((chunk) => chunk.content)]);
  const queryEmbedding = embeddings[0] ?? [];

  return chunks
    .map((chunk, index) => {
      const lexicalScore = tokenize(chunk.content).reduce(
        (sum, token) => sum + (queryTokens.has(token) ? 0.06 : 0),
        0
      );
      const semanticScore = cosineSimilarity(queryEmbedding, embeddings[index + 1] ?? []);
      return {
        ...chunk,
        score: Number((semanticScore + lexicalScore).toFixed(4))
      };
    })
    .sort((left, right) => right.score - left.score)
    .slice(0, limit);
}
