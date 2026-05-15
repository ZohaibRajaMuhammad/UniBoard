import { describe, expect, it } from "vitest";
import { buildAssistantPrompt, containsAiMention, formatAssistantComment, stripAiMentions } from "./mentions";

describe("ai mentions", () => {
  it("detects both supported AI mention aliases", () => {
    expect(containsAiMention("Please help @uniboard with this deadline")).toBe(true);
    expect(containsAiMention("Please help @uniboardai with this deadline")).toBe(true);
    expect(containsAiMention("No assistant mention here")).toBe(false);
  });

  it("strips AI mentions from user text before prompting", () => {
    expect(stripAiMentions("@uniboard explain this release blocker")).toBe("explain this release blocker");
    expect(stripAiMentions("@uniboardai explain this release blocker")).toBe("explain this release blocker");
  });

  it("formats assistant comments with next steps when provided", () => {
    expect(formatAssistantComment("Here is the answer.", ["Check the planner", "Open the room post"])).toContain("Next steps:");
    expect(buildAssistantPrompt("@uniboard summarize this room")).toContain("summarize this room");
  });

  it("builds a direct-answer prompt with discussion context", () => {
    const prompt = buildAssistantPrompt("@uniboard what is the strongest evidence for this release blocker?", {
      postType: "question",
      postTitle: "Release blocker review",
      postContent: "Compliance sheet and supervisor approval form are due this weekend.",
      parentCommentContent: "We need the clearest evidence before staging demos."
    });

    expect(prompt).toContain("Do not default to a clarifying question");
    expect(prompt).toContain("Compliance sheet and supervisor approval form are due this weekend.");
    expect(prompt).toContain("what is the strongest evidence for this release blocker?");
  });
});
