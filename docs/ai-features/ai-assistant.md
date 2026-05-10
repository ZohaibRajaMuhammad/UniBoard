# AI Assistant

## 1. AI Objective
- Problem being solved: Provide a conversational academic copilot across rooms, deadlines, drafting, and explanations.
- Business objective: Increase task completion and reduce friction in finding help.

## 2. Input Pipeline
- User free-text prompt
- Current room context
- Recent deadlines
- Profile and room membership context
- Preprocessing: Normalize text, detect language, remove disallowed markup, resolve user and room scope, and attach only permission-safe context.
- Validation: Reject empty payloads, oversized payloads, unsupported tenants, and prompts that fail safety or abuse checks before model invocation.

## 3. Model Logic
- Classifier for intent routing
- Grounded LLM response generator
- Prompt templates for summarize, explain, draft, and risk intents
- Prompt engineering: Use short system instructions, explicit task framing, source-grounding requirements, and output schema hints.
- Context injection: Prefer retrieved source chunks, deadline metadata, room summaries, and user preference flags over raw long-context dumps.
- Memory handling: Session memory should be scoped to the current user and feature context, time-bounded, and erasable.
- Guardrails: Apply prompt injection filtering, unsafe-content classifiers, institution policy checks, and post-generation validation before rendering.
- Fallback logic: Feature-specific deterministic fallbacks must exist for model outage, low confidence, or latency budget breach.

## 4. Output Processing
- Rendered response bubble
- Suggested next actions
- Optional deep links
- Response generation: Validate schema, strip unsupported claims, normalize formatting, and attach source anchors where applicable.
- Ranking/filtering: Down-rank unsupported content, prioritize recent authoritative sources, and suppress low-quality or contradictory evidence when confidence is low.
- Confidence scoring: Store calibrated confidence bands rather than raw opaque model probabilities.

## 5. Failure Handling
- Timeout fallback to static quick actions
- Refusal on unsafe or unsupported requests
- Degrade to deterministic response templates when model unavailable
- Hallucination prevention: Never answer from model prior alone when the feature is intended to be grounded. Prefer abstention over invention.
- Timeout recovery: Return partial-progress UI or actionable retry state before the user perceives the system as frozen.
- Low-confidence handling: Explicitly label low confidence, show sources, and encourage the user to inspect the underlying room content.

## 6. Evaluation Metrics
- Resolution rate
- Latency
- Deflection from search
- User satisfaction
- Accuracy: Measure against human-reviewed benchmark sets per subject domain.
- Precision/recall: Track according to feature type. Retrieval-heavy tools need recall; recommendation-heavy tools need precision and actionability.
- Latency: Set a budget per feature class. Conversational tools need fast first token; planning tools may tolerate longer async completion.
- Cost: Track cost per invocation, per successful action, and per retained user outcome.
