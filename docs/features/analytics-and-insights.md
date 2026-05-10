# Analytics And Insights

## 1. Feature Overview
- Purpose: Expose engagement patterns, content mix, and risk indicators.
- Business value: Improve academic outcomes and instructor awareness.
- User value: See where activity is strong or weak.

## 2. Functional Requirements
- Inputs:
- Events
- Deadlines
- Feed interactions
- AI model outputs
- Outputs:
- Charts
- Heatmaps
- Risk cards
- Daily digests
- Dependencies:
- Analytics warehouse
- Streaming event pipeline
- AI scoring jobs
- Constraints:
- Aggregates must remain explainable
- Student privacy boundaries

## 3. Complete Logic Flow
- Aggregate events
- Build metrics views
- Render visualizations
- Refresh or cache based on SLA
- Decision tree: Branch on authentication state, role permission, and data availability first. Branch on AI confidence or moderation policy second. Branch on transport failure last with retry-safe fallbacks.
- Failure recovery: Preserve intent payloads, expose actionable error messages, and use idempotency keys for any mutation that can be retried.

## 4. Database Architecture
- Core tables:
- event_facts
- daily_room_metrics
- deadline_risk_snapshots
- Relationships: Use stable surrogate ids, tenant scoping on all top-level entities, foreign keys for membership or ownership, and append-only event tables for state that needs auditability.
- Indexes: Add composite indexes for tenant plus room, user plus timestamp, and entity plus state filters. Add vector or full-text indexes where retrieval features require them.
- Constraints: Enforce uniqueness at the tenant boundary, soft-delete safety, and temporal validity for session or token records.

## 5. API Contracts
- Endpoints:
- GET /analytics/overview
- GET /analytics/engagement
- GET /ai/deadline-risk
- Methods: Prefer GET for retrieval, POST for create and AI actions, PATCH for partial updates, and DELETE for reversible removal toggles only when safe.
- Authentication: Session cookie or bearer token backed by refresh token rotation.
- Authorization: Role checks at tenant, room, and entity level.

## 6. Security Requirements
- Cohort-wide analytics restricted by role

## 7. Performance Requirements
- Cached analytical loads under 800ms
- Caching: Cache reference data and bootstrap payloads aggressively; cache personalized lists carefully with mutation-aware invalidation; avoid caching unsafe AI outputs without source/version metadata.
- Lazy loading: Defer heavy charts, long lists, and secondary rails until the primary task path is interactive.
- Pagination: Use cursor pagination for feeds, notifications, and activity timelines.

## 8. Monitoring
- Data freshness lag
- Chart render errors
- Risk model drift
- Logs: Include request id, actor id, tenant id, feature key, latency, and policy decision where relevant.
- Metrics: Instrument success rate, latency, retries, abandonment, and feature adoption.
- Alerts: Trigger on sustained error rate, latency regression, queue backlog, or suspicious abuse signatures.
