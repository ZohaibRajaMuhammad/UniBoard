import type { AssistantPromptContext } from "./mentions";

export type KnowledgeIntent =
  | "deadline_lookup"
  | "resource_discovery"
  | "comparison"
  | "explanation"
  | "room_specific"
  | "cross_room_synthesis";

export type AssistantIntent =
  | "deadline"
  | "evidence"
  | "summary"
  | "action_items"
  | "comparison"
  | "clarification"
  | "direct_answer";

function normalize(value: string) {
  return value.toLowerCase();
}

export function classifyKnowledgeIntent(question: string): KnowledgeIntent {
  const normalized = normalize(question);

  if (/(deadline|due|when is|when's|when does|urgent)/.test(normalized)) {
    return "deadline_lookup";
  }

  if (/(resource|link|document|slides|notes|file|where was|where is)/.test(normalized)) {
    return "resource_discovery";
  }

  if (/(difference|compare|comparison|versus|vs\b|better)/.test(normalized)) {
    return "comparison";
  }

  if (/(room|class|course).*(which|what|where)|across|all rooms|all classes/.test(normalized)) {
    return "cross_room_synthesis";
  }

  if (/(in this room|this room|this class|this course)/.test(normalized)) {
    return "room_specific";
  }

  return "explanation";
}

export function classifyAssistantIntent(userRequest: string, context: AssistantPromptContext): AssistantIntent {
  const normalized = normalize(userRequest);

  if (/(deadline|due|when is|when's|urgent)/.test(normalized)) {
    return "deadline";
  }

  if (/(evidence|proof|show me|where does|what supports)/.test(normalized)) {
    return "evidence";
  }

  if (/(summarize|summary|what happened|catch me up)/.test(normalized)) {
    return "summary";
  }

  if (/(action items|next steps|what should we do|what do we do next|todo|to-do)/.test(normalized)) {
    return "action_items";
  }

  if (/(compare|difference|versus|vs\b|better)/.test(normalized)) {
    return "comparison";
  }

  if (!context.postContent && !context.parentCommentContent && userRequest.split(/\s+/).length < 5) {
    return "clarification";
  }

  return "direct_answer";
}

export function buildKnowledgeInstructions(intent: KnowledgeIntent) {
  const base =
    "Answer only from the provided study sources. Lead with the answer, keep it concise, structured, and professional, and avoid unnecessary clarification. If evidence is partial, say so directly. If evidence is weak, abstain plainly. Never invent facts, dates, or citations.";

  switch (intent) {
    case "deadline_lookup":
      return `${base} Prioritize due dates, urgency, and the latest authoritative deadline signal.`;
    case "resource_discovery":
      return `${base} Prioritize source location, document identity, and the most likely room artifact to inspect next.`;
    case "comparison":
      return `${base} Compare only with explicit evidence from the retrieved sources and separate facts from inference.`;
    case "room_specific":
      return `${base} Stay scoped to the room-local evidence when the request is room-specific.`;
    case "cross_room_synthesis":
      return `${base} Synthesize across rooms carefully and name conflicts or gaps when sources disagree.`;
    default:
      return `${base} Explain concepts cleanly and keep the wording operational rather than academic for its own sake.`;
  }
}

export function buildAssistantInstructions(intent: AssistantIntent) {
  const base =
    "Act as Uniboard's academic workspace assistant. Reply in short, direct, professional language with a familiar but refined tone. Prefer 1 to 3 concise sentences or up to 3 tight bullets. Give the grounded answer first, avoid filler, avoid rephrasing the question, state uncertainty cleanly, and suggest only concrete next actions when useful.";

  switch (intent) {
    case "deadline":
      return `${base} Prioritize the latest deadline facts, urgency, and what the room should do next.`;
    case "evidence":
      return `${base} Point to the strongest supporting signal in the provided context rather than giving a generic explanation.`;
    case "summary":
      return `${base} Compress the thread or room situation into the smallest useful summary.`;
    case "action_items":
      return `${base} Convert the grounded context into concrete actions, owners, or next steps when the evidence allows it.`;
    case "comparison":
      return `${base} Compare the options directly and note the strongest evidence for each side.`;
    case "clarification":
      return `${base} Ask exactly one short clarifying question only if a responsible answer is impossible from the supplied context.`;
    default:
      return `${base} Prefer a direct answer over a clarification when the current thread or room already contains enough signal.`;
  }
}

export function buildKnowledgeFollowUp(intent: KnowledgeIntent) {
  switch (intent) {
    case "deadline_lookup":
      return "Name the room or assignment title if you want the exact deadline source.";
    case "resource_discovery":
      return "Name the room, topic, or file type to narrow the resource search.";
    case "comparison":
      return "Name the two options or concepts explicitly if you want a tighter comparison.";
    case "room_specific":
      return "Name the room more explicitly if you want the answer scoped to one class.";
    case "cross_room_synthesis":
      return "Name the rooms or topics you want synthesized if you need a narrower cross-room answer.";
    default:
      return "Name the room, concept, or artifact more explicitly to improve grounding.";
  }
}

export function buildAssistantSuggestions(intent: AssistantIntent, roomName?: string | null) {
  switch (intent) {
    case "deadline":
      return ["Open the Planner for the exact deadline sequence.", roomName ? `Open ${roomName} to inspect the source post.` : "Open the room post to inspect the source."];
    case "evidence":
      return [roomName ? `Open ${roomName} to inspect the strongest cited signal.` : "Open the source post for the strongest evidence."];
    case "summary":
      return ["Ask for action items if you want the summary turned into next steps."];
    case "action_items":
      return ["Ask for a short owner-by-owner breakdown if you need assignment-level clarity."];
    case "comparison":
      return ["Ask for the strongest evidence on each side if you need a tighter comparison."];
    case "clarification":
      return ["Name the exact course, artifact, or deadline to make the request answerable."];
    default:
      return [roomName ? `Open ${roomName} if you want the full surrounding discussion.` : "Open the relevant room if you want more context."];
  }
}
