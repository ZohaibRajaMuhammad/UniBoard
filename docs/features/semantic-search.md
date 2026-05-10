# Semantic Search

## 1. Feature Overview
- Purpose: Blend lexical and semantic retrieval across room content.
- Business value: Reduce duplicate questions and raise reuse of prior answers.
- User value: Ask in natural terms and still find the right post.

## 2. Functional Requirements
- Inputs:
- Query string
- Room scope
- User authorization context
- Outputs:
- Ranked results
- Relevance reasons
- Fallback lexical order
- Dependencies:
- Search index
- Embedding store
- Ranker service
- Constraints:
- Authorization before retrieval disclosure
- Latency budget under interactive search thresholds

## 3. Complete Logic Flow
- Normalize query
- Fetch lexical candidates
- Fetch semantic candidates
- Blend and return ranked results
- Decision tree: Branch on authentication state, role permission, and data availability first. Branch on AI confidence or moderation policy second. Branch on transport failure last with retry-safe fallbacks.
- Failure recovery: Preserve intent payloads, expose actionable error messages, and use idempotency keys for any mutation that can be retried.

## 4. Database Architecture
- Core tables:
- search_documents
- document_embeddings
- search_click_events
- Relationships: Use stable surrogate ids, tenant scoping on all top-level entities, foreign keys for membership or ownership, and append-only event tables for state that needs auditability.
- Indexes: Add composite indexes for tenant plus room, user plus timestamp, and entity plus state filters. Add vector or full-text indexes where retrieval features require them.
- Constraints: Enforce uniqueness at the tenant boundary, soft-delete safety, and temporal validity for session or token records.

## 5. API Contracts
- Endpoints:
- GET /search
- POST /ai/search/rank
- Methods: Prefer GET for retrieval, POST for create and AI actions, PATCH for partial updates, and DELETE for reversible removal toggles only when safe.
- Authentication: Session cookie or bearer token backed by refresh token rotation.
- Authorization: Role checks at tenant, room, and entity level.

## 6. Security Requirements
- No embedding leakage across tenants
- Result filtering before scoring explanation

## 7. Performance Requirements
- Typeahead under 250ms cached
- Full semantic search under 1.2s
- Caching: Cache reference data and bootstrap payloads aggressively; cache personalized lists carefully with mutation-aware invalidation; avoid caching unsafe AI outputs without source/version metadata.
- Lazy loading: Defer heavy charts, long lists, and secondary rails until the primary task path is interactive.
- Pagination: Use cursor pagination for feeds, notifications, and activity timelines.

## 8. Monitoring
- Zero-result rate
- Search refinement rate
- Relevance click position
- Logs: Include request id, actor id, tenant id, feature key, latency, and policy decision where relevant.
- Metrics: Instrument success rate, latency, retries, abandonment, and feature adoption.
- Alerts: Trigger on sustained error rate, latency regression, queue backlog, or suspicious abuse signatures.
