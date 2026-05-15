import { ROOM_MENTION_AI, ROOM_MENTION_AI_ALIASES } from "../constants";

export function containsAiMention(value: string) {
  const lowered = value.toLowerCase();
  return ROOM_MENTION_AI_ALIASES.some((alias) => lowered.includes(alias.toLowerCase()));
}

export function stripAiMentions(value: string) {
  return [...ROOM_MENTION_AI_ALIASES]
    .sort((left, right) => right.length - left.length)
    .reduce(
    (current, alias) => current.replaceAll(new RegExp(alias, "gi"), "").replace(/\s{2,}/g, " "),
    value
  ).trim();
}

export function buildAssistantPrompt(
  value: string,
  context?: {
    postTitle?: string | null;
    postType?: string | null;
    postContent?: string | null;
    parentCommentContent?: string | null;
  }
) {
  const cleaned = stripAiMentions(value);

  if (!cleaned) {
    return [
      `A UniBoard user mentioned ${ROOM_MENTION_AI} in a room discussion.`,
      "There is no direct request yet.",
      "Ask one concise clarifying question tied to the room discussion only."
    ].join("\n\n");
  }

  return [
    `A UniBoard user explicitly mentioned ${ROOM_MENTION_AI} in a room discussion.`,
    "Answer the exact user request directly from authorized room context.",
    "Do not default to a clarifying question if the request can be answered from the room discussion or retrieved room sources.",
    "If the user asks for evidence, explanation, summary, action items, deadlines, or comparisons, provide the best direct grounded answer first.",
    "Only ask one short clarifying question if a necessary missing variable makes the request impossible to answer responsibly.",
    `Discussion post type: ${context?.postType ?? "unknown"}`,
    context?.postTitle ? `Discussion post title: ${context.postTitle}` : "",
    context?.postContent ? `Discussion post content:\n${context.postContent}` : "",
    context?.parentCommentContent ? `Parent comment context:\n${context.parentCommentContent}` : "",
    `User request:\n${cleaned}`
  ]
    .filter(Boolean)
    .join("\n\n");
}

export function formatAssistantComment(reply: string, suggestions?: string[]) {
  const cleanedReply = reply.trim();
  const nextSteps = (suggestions ?? []).filter(Boolean).slice(0, 2);
  if (nextSteps.length === 0) {
    return `UniBoard AI: ${cleanedReply}`;
  }

  return `UniBoard AI: ${cleanedReply}\n\nNext steps:\n${nextSteps.map((item) => `- ${item}`).join("\n")}`;
}
