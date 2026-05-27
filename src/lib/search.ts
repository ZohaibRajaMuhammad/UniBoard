import type { FeedPost } from "@/components/feed/PostFeed";
import type { Room } from "@/types";

export type SearchResultRecord = Partial<FeedPost> & {
  room?: Partial<Room> | null;
  relevance?: string;
  snippet?: string;
};

export type NormalizedSearchResult = SearchResultRecord & {
  _id: string;
  roomId: string;
  type: string;
  createdAt: number;
  deadlineTitle: string;
  resourceTitle: string;
  content: string;
  tags: string[];
  room: {
    name: string;
  } & Record<string, unknown>;
  author: {
    name: string;
  } & Record<string, unknown>;
  relevance: "Title match" | "Tag match" | "Body match";
  snippet: string;
};

export function buildSearchSnippet(content: string, query: string) {
  if (!query) {
    return content;
  }

  const lower = content.toLowerCase();
  const index = lower.indexOf(query);
  if (index === -1) {
    return content;
  }

  const start = Math.max(0, index - 84);
  const end = Math.min(content.length, index + query.length + 120);
  const prefix = start > 0 ? "..." : "";
  const suffix = end < content.length ? "..." : "";
  return `${prefix}${content.slice(start, end).trim()}${suffix}`;
}

export function normalizeSearchResults(results: unknown, rawQuery: string): NormalizedSearchResult[] {
  const query = rawQuery.trim().toLowerCase();
  if (!Array.isArray(results)) {
    return [];
  }

  return (results as SearchResultRecord[])
    .map((result) => {
      const safeId = typeof result._id === "string" ? result._id : null;
      const safeRoomId = typeof result.roomId === "string" ? result.roomId : null;
      const safeContent = typeof result.content === "string" ? result.content : "";
      const safeDeadlineTitle = typeof result.deadlineTitle === "string" ? result.deadlineTitle : "";
      const safeResourceTitle = typeof result.resourceTitle === "string" ? result.resourceTitle : "";
      const safeType = typeof result.type === "string" ? result.type : "note";
      const safeCreatedAt = typeof result.createdAt === "number" && Number.isFinite(result.createdAt) ? result.createdAt : null;
      const safeRoomName = typeof result.room?.name === "string" ? result.room.name : "Room";
      const safeAuthorName = typeof result.author?.name === "string" ? result.author.name : "Unknown author";
      const safeTags = Array.isArray(result.tags) ? result.tags.filter((tag): tag is string => typeof tag === "string") : [];

      if (!safeId || !safeRoomId || !safeCreatedAt) {
        return null;
      }

      const title = (safeDeadlineTitle || safeResourceTitle).toLowerCase();
      const body = safeContent.toLowerCase();
      const tagLine = safeTags.join(" ").toLowerCase();

      const relevance: NormalizedSearchResult["relevance"] = title.includes(query)
        ? "Title match"
        : tagLine.includes(query)
          ? "Tag match"
          : "Body match";

      return {
        ...result,
        _id: safeId,
        roomId: safeRoomId,
        type: safeType,
        createdAt: safeCreatedAt,
        deadlineTitle: safeDeadlineTitle,
        resourceTitle: safeResourceTitle,
        content: safeContent,
        tags: safeTags,
        room: {
          ...(result.room ?? {}),
          name: safeRoomName
        },
        author: {
          ...(result.author ?? {}),
          name: safeAuthorName
        },
        relevance,
        snippet: buildSearchSnippet(safeContent, query)
      };
    })
    .filter((result): result is NormalizedSearchResult => result !== null);
}
