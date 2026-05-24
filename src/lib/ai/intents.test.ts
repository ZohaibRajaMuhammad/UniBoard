import { describe, expect, it } from "vitest";
import {
  buildAssistantInstructions,
  buildKnowledgeFollowUp,
  classifyAssistantIntent,
  classifyKnowledgeIntent
} from "./intents";
import type { AssistantPromptContext } from "./mentions";

const baseContext: AssistantPromptContext = {
  userRequest: "what is due first",
  postType: "deadline",
  postTitle: "Sprint review",
  postContent: "The slides are due on Friday and the report is due next Monday.",
  parentCommentContent: "We need the exact order.",
  raw: ""
};

describe("ai intents", () => {
  it("classifies knowledge intents conservatively", () => {
    expect(classifyKnowledgeIntent("Which deadline is closest?")).toBe("deadline_lookup");
    expect(classifyKnowledgeIntent("Where was normalization explained?")).toBe("resource_discovery");
    expect(classifyKnowledgeIntent("Compare the two API designs")).toBe("comparison");
  });

  it("classifies assistant intents using request and thread context", () => {
    expect(classifyAssistantIntent("what is due first", baseContext)).toBe("deadline");
    expect(classifyAssistantIntent("summarize this thread", baseContext)).toBe("summary");
    expect(classifyAssistantIntent("what supports that", baseContext)).toBe("evidence");
  });

  it("produces intent-aware guidance strings", () => {
    expect(buildKnowledgeFollowUp("deadline_lookup")).toContain("assignment title");
    expect(buildAssistantInstructions("action_items")).toContain("actions");
  });
});
