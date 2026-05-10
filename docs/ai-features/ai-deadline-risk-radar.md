# AI Deadline Risk Radar

## 1. AI Objective
- Problem being solved: Students do not reliably infer deadline risk from their own behavior.
- Business objective: Predict and communicate the likelihood of missing or under-preparing for a deadline.

## 2. Input Pipeline
- Deadline dates
- Progress estimates
- Engagement recency
- Historical completion patterns
- Preprocessing: Normalize text, detect language, remove disallowed markup, resolve user and room scope, and attach only permission-safe context.
- Validation: Reject empty payloads, oversized payloads, unsupported tenants, and prompts that fail safety or abuse checks before model invocation.

## 3. Model Logic
- Gradient-boosted or lightweight tabular model
- Rule-based calibration layer
- Narrative explainer template
- Prompt engineering: Use short system instructions, explicit task framing, source-grounding requirements, and output schema hints.
- Context injection: Prefer retrieved source chunks, deadline metadata, room summaries, and user preference flags over raw long-context dumps.
- Memory handling: Session memory should be scoped to the current user and feature context, time-bounded, and erasable.
- Guardrails: Apply prompt injection filtering, unsafe-content classifiers, institution policy checks, and post-generation validation before rendering.
- Fallback logic: Feature-specific deterministic fallbacks must exist for model outage, low confidence, or latency budget breach.

## 4. Output Processing
- Risk percentage
- Severity color band
- Human-readable explanation
- Response generation: Validate schema, strip unsupported claims, normalize formatting, and attach source anchors where applicable.
- Ranking/filtering: Down-rank unsupported content, prioritize recent authoritative sources, and suppress low-quality or contradictory evidence when confidence is low.
- Confidence scoring: Store calibrated confidence bands rather than raw opaque model probabilities.

## 5. Failure Handling
- If data too sparse, show insufficient-signal state
- Never display pseudo-precision beyond supported confidence
- Hallucination prevention: Never answer from model prior alone when the feature is intended to be grounded. Prefer abstention over invention.
- Timeout recovery: Return partial-progress UI or actionable retry state before the user perceives the system as frozen.
- Low-confidence handling: Explicitly label low confidence, show sources, and encourage the user to inspect the underlying room content.

## 6. Evaluation Metrics
- Calibration error
- Recall on missed deadlines
- Action conversion after alert
- Latency
- Accuracy: Measure against human-reviewed benchmark sets per subject domain.
- Precision/recall: Track according to feature type. Retrieval-heavy tools need recall; recommendation-heavy tools need precision and actionability.
- Latency: Set a budget per feature class. Conversational tools need fast first token; planning tools may tolerate longer async completion.
- Cost: Track cost per invocation, per successful action, and per retained user outcome.
