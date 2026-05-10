import { AI_MAX_CONTEXT_CHARS, AI_MAX_PROMPT_CHARS } from "./config";

const INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?previous\s+instructions/i,
  /reveal\s+(your\s+)?system\s+prompt/i,
  /bypass\s+(policy|safety|guardrails)/i,
  /act\s+as\s+if\s+you\s+are\s+not\s+restricted/i
];

const UNSAFE_PATTERNS = [
  /self-harm/i,
  /build\s+(a\s+)?bomb/i,
  /malware/i,
  /steal\s+passwords/i
];

export class AiValidationError extends Error {
  constructor(
    public readonly code: string,
    public readonly status: number,
    message: string
  ) {
    super(message);
  }
}

export function assertSafePrompt(prompt: string) {
  const trimmed = prompt.trim();

  if (!trimmed) {
    throw new AiValidationError("empty_prompt", 422, "Prompt is required.");
  }

  if (trimmed.length > AI_MAX_PROMPT_CHARS) {
    throw new AiValidationError(
      "prompt_too_long",
      422,
      `Prompt exceeds the ${AI_MAX_PROMPT_CHARS} character limit.`
    );
  }

  if (INJECTION_PATTERNS.some((pattern) => pattern.test(trimmed))) {
    throw new AiValidationError("unsafe_prompt", 422, "Prompt failed safety validation.");
  }

  if (UNSAFE_PATTERNS.some((pattern) => pattern.test(trimmed))) {
    throw new AiValidationError("unsafe_content", 422, "Prompt contains unsupported unsafe content.");
  }

  return trimmed;
}

export function assertContextBudget(chunks: string[]) {
  const total = chunks.reduce((sum, item) => sum + item.length, 0);
  if (total > AI_MAX_CONTEXT_CHARS) {
    throw new AiValidationError(
      "context_too_large",
      422,
      `Retrieved context exceeds the ${AI_MAX_CONTEXT_CHARS} character limit.`
    );
  }
}
