import { describe, expect, it } from "vitest";
import { buildAssistantPrompt, containsAiMention, formatAssistantComment, parseAssistantPromptContext, stripAiMentions } from "./mentions";

describe("ai mentions", () => {
  it("detects both supported AI mention aliases", () => {
    expect(containsAiMention("Please help @UniBoard with this deadline")).toBe(true);
    expect(containsAiMention("Please help @UniBoardAI with this deadline")).toBe(true);
    expect(containsAiMention("No assistant mention here")).toBe(false);
  });

  it("strips AI mentions from user text before prompting", () => {
    expect(stripAiMentions("@UniBoard explain this release blocker")).toBe("explain this release blocker");
    expect(stripAiMentions("@UniBoardAI explain this release blocker")).toBe("explain this release blocker");
    expect(stripAiMentions("Please check this, @UniBoardAI.")).toBe("Please check this, .");
    expect(stripAiMentions("@UniBoardAI @UniBoardAI tell me about Convex")).toBe("tell me about Convex");
  });

  it("formats assistant comments with next steps when provided", () => {
    expect(formatAssistantComment("Here is the answer.", ["Check the planner", "Open the room post"])).toContain("Next steps:");
    expect(buildAssistantPrompt("@UniBoardAI summarize this room")).toContain("summarize this room");
  });

  it("builds a direct-answer prompt with discussion context", () => {
    const prompt = buildAssistantPrompt("@UniBoardAI what is the strongest evidence for this release blocker?", {
      postType: "question",
      postTitle: "Release blocker review",
      postContent: "Compliance sheet and supervisor approval form are due this weekend.",
      parentCommentContent: "We need the clearest evidence before staging demos."
    });

    expect(prompt).toContain("Do not default to a clarifying question");
    expect(prompt).toContain("Compliance sheet and supervisor approval form are due this weekend.");
    expect(prompt).toContain("what is the strongest evidence for this release blocker?");
  });

  it("parses structured prompt context for mention orchestration", () => {
    const prompt = buildAssistantPrompt("@UniBoardAI summarize the real blocker", {
      postType: "project",
      postTitle: "Demo readiness",
      postContent: "The deployment guide is incomplete and QA is blocked.",
      parentCommentContent: "We need a concise status answer for the team."
    });

    const parsed = parseAssistantPromptContext(prompt);

    expect(parsed.userRequest).toBe("summarize the real blocker");
    expect(parsed.postType).toBe("project");
    expect(parsed.postTitle).toBe("Demo readiness");
    expect(parsed.postContent).toContain("deployment guide is incomplete");
    expect(parsed.parentCommentContent).toContain("concise status answer");
  });

  it("keeps duplicate AI mentions from polluting the extracted user request", () => {
    const prompt = buildAssistantPrompt("@UniBoardAI @UniBoardAI tell me about Convex", {
      postType: "note",
      postContent: "@UniBoardAI @UniBoardAI tell me about Convex"
    });

    const parsed = parseAssistantPromptContext(prompt);

    expect(parsed.userRequest).toBe("tell me about Convex");
    expect(prompt).toContain("User request:\ntell me about Convex");
  });
});
