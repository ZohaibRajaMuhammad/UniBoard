export type ConfidenceBand = "low" | "medium" | "high";

export type AiErrorPayload = {
  code: string;
  message: string;
};

export type AiMeta = {
  requestId: string;
  route: string;
  model?: string;
  embeddingModel?: string;
  latencyMs: number;
  mode: "openai" | "fallback";
  confidenceBand?: ConfidenceBand;
  sourceCount?: number;
  capabilityFlags?: string[];
};

export type AiEnvelope<T> = {
  data: T | null;
  meta: AiMeta;
  error: AiErrorPayload | null;
};

export type KnowledgeSource = {
  postId: string;
  roomId: string;
  roomName: string;
  title: string;
  type: string;
  quote: string;
  score?: number;
};

export type KnowledgeAnswer = {
  answer: string;
  confidenceBand: ConfidenceBand;
  followUp: string | null;
  abstained: boolean;
  sources: KnowledgeSource[];
};

export type DeadlineRiskItem = {
  postId: string;
  roomId: string;
  roomName: string;
  title: string;
  dueDate: number;
  score: number;
  band: ConfidenceBand;
  explanation: string;
};

export type LearningProfileItem = {
  topic: string;
  score: number;
  confidence: ConfidenceBand;
  evidence: string;
};

export type LearningProfile = {
  summary: string;
  expertise: LearningProfileItem[];
};

export type StudyPlanSession = {
  id: string;
  title: string;
  startAt: number;
  endAt: number;
  urgency: ConfidenceBand;
  reasoning: string;
};

export type StudyPlan = {
  summary: string;
  confidenceBand: ConfidenceBand;
  sessions: StudyPlanSession[];
};

export type AiBriefing = {
  summary: string;
  priorities: string[];
  warnings: string[];
};

export type RoomSummary = {
  roomId: string;
  roomName: string;
  summary: string;
  keyPoints: string[];
  openQuestions: string[];
};

export type AssistantReply = {
  reply: string;
  confidenceBand: ConfidenceBand;
  suggestions: string[];
  sources: KnowledgeSource[];
};

export type ComposerSuggestion = {
  title: string;
  body: string;
  tags: string[];
  disclaimer: string;
};
