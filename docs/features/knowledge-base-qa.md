# Knowledge Base QA

## 1. Feature Overview
- Purpose: Answer course questions from the userâ€™s own room corpus.
- Business value: Make accumulated class discussion durable and searchable.
- User value: Ask a question and receive a grounded answer with sources.

## 2. Functional Requirements
- Inputs:
- Natural-language query
- Authorized room corpus
- Prompt and retrieval settings
- Outputs:
- Answer
- Source list
- Confidence metadata
- Dependencies:
- Retriever
- Vector store
- LLM gateway
- Source resolver
- Constraints:
- Must cite accessible source content
- Must refuse unsupported answer when confidence is low

## 3. Complete Logic Flow
- Classify query
- Retrieve top evidence
- Compose grounded prompt
- Generate and post-process answer
- Decision tree: Branch on authentication state, role permission, and data availability first. Branch on AI confidence or moderation policy second. Branch on transport failure last with retry-safe fallbacks.
- Failure recovery: Preserve intent payloads, expose actionable error messages, and use idempotency keys for any mutation that can be retried.

## 4. Database Architecture
- Core tables:
- kb_queries
- kb_query_sources
- kb_answer_feedback
- Relationships: Use stable surrogate ids, tenant scoping on all top-level entities, foreign keys for membership or ownership, and append-only event tables for state that needs auditability.
- Indexes: Add composite indexes for tenant plus room, user plus timestamp, and entity plus state filters. Add vector or full-text indexes where retrieval features require them.
- Constraints: Enforce uniqueness at the tenant boundary, soft-delete safety, and temporal validity for session or token records.

## 5. API Contracts
- Endpoints:
- POST /ai/knowledge/query
- POST /ai/knowledge/feedback
- Methods: Prefer GET for retrieval, POST for create and AI actions, PATCH for partial updates, and DELETE for reversible removal toggles only when safe.
- Authentication: Session cookie or bearer token backed by refresh token rotation.
- Authorization: Role checks at tenant, room, and entity level.

## 6. Security Requirements
- Prompt injection hardening
- Source permission re-check

## 7. Performance Requirements
- P95 answer under 3.5s
- Streaming preferred for long answers
- Caching: Cache reference data and bootstrap payloads aggressively; cache personalized lists carefully with mutation-aware invalidation; avoid caching unsafe AI outputs without source/version metadata.
- Lazy loading: Defer heavy charts, long lists, and secondary rails until the primary task path is interactive.
- Pagination: Use cursor pagination for feeds, notifications, and activity timelines.

## 8. Monitoring
- Answer confidence distribution
- Source-open rate
- User-rated helpfulness
- Logs: Include request id, actor id, tenant id, feature key, latency, and policy decision where relevant.
- Metrics: Instrument success rate, latency, retries, abandonment, and feature adoption.
- Alerts: Trigger on sustained error rate, latency regression, queue backlog, or suspicious abuse signatures.
