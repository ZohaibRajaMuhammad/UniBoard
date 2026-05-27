import { describe, expect, it } from "vitest";
import { buildSearchSnippet, normalizeSearchResults } from "./search";

describe("search utilities", () => {
  it("drops malformed search records instead of crashing render paths", () => {
    const results = normalizeSearchResults(
      [
        { _id: "post-1", roomId: "room-1", createdAt: Date.now(), content: "Convex keeps state synced.", type: "note" },
        { roomId: "room-2", createdAt: Date.now(), content: "Missing id should be ignored." },
        { _id: "post-3", createdAt: Date.now(), content: "Missing room id should be ignored." }
      ],
      "convex"
    );

    expect(results).toHaveLength(1);
    expect(results[0]?._id).toBe("post-1");
  });

  it("prefers title matches over body matches when assigning relevance", () => {
    const results = normalizeSearchResults(
      [
        {
          _id: "post-1",
          roomId: "room-1",
          createdAt: Date.now(),
          content: "General study note.",
          deadlineTitle: "Convex deployment review",
          type: "deadline"
        }
      ],
      "convex"
    );

    expect(results[0]?.relevance).toBe("Title match");
  });

  it("falls back to safe room and author labels when missing", () => {
    const results = normalizeSearchResults(
      [{ _id: "post-1", roomId: "room-1", createdAt: Date.now(), content: "Body content", type: "note" }],
      "body"
    );

    expect(results[0]?.room.name).toBe("Room");
    expect(results[0]?.author.name).toBe("Unknown author");
  });

  it("builds trimmed snippets around the search match", () => {
    const snippet = buildSearchSnippet(
      "This room contains a long explanation about Convex backend behavior and why it matters in real-time apps.",
      "convex"
    );

    expect(snippet.toLowerCase()).toContain("convex");
    expect(snippet.length).toBeLessThanOrEqual(210);
  });
});
