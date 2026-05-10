export const AI_MODEL = process.env.OPENAI_MODEL ?? "gpt-5-nano";
export const AI_EMBEDDING_MODEL = process.env.OPENAI_EMBEDDING_MODEL ?? "text-embedding-3-small";
export const AI_TIMEOUT_MS = Number(process.env.OPENAI_TIMEOUT_MS ?? 20000);
export const AI_MAX_PROMPT_CHARS = Number(process.env.OPENAI_MAX_PROMPT_CHARS ?? 2400);
export const AI_MAX_CONTEXT_CHARS = Number(process.env.OPENAI_MAX_CONTEXT_CHARS ?? 24000);
export const AI_MAX_CHUNKS = Number(process.env.OPENAI_MAX_CHUNKS ?? 6);
