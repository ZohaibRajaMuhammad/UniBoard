# Dashboard Intelligence

## 1. Feature Overview
- Purpose: Aggregate personalized room activity, deadlines, and productivity signals into one launch surface.
- Business value: Increase daily engagement and task completion.
- User value: Know what matters now without opening multiple pages.

## 2. Functional Requirements
- Inputs:
- Room activity
- Deadlines
- Notifications
- Reputation signals
- AI briefing output
- Outputs:
- Dashboard cards
- Counts
- AI digest
- Navigation badges
- Dependencies:
- Dashboard composer service
- Room feed service
- Deadline service
- AI briefing service
- Constraints:
- Must degrade gracefully if one widget fails
- Must honor room-level permissions

## 3. Complete Logic Flow
- Fetch bootstrap
- Fetch personalized sections in parallel
- Render high-priority cards first
- Backfill analytical widgets
- Decision tree: Branch on authentication state, role permission, and data availability first. Branch on AI confidence or moderation policy second. Branch on transport failure last with retry-safe fallbacks.
- Failure recovery: Preserve intent payloads, expose actionable error messages, and use idempotency keys for any mutation that can be retried.

## 4. Database Architecture
- Core tables:
- dashboard_snapshots
- user_room_metrics
- deadline_summaries
- Relationships: Use stable surrogate ids, tenant scoping on all top-level entities, foreign keys for membership or ownership, and append-only event tables for state that needs auditability.
- Indexes: Add composite indexes for tenant plus room, user plus timestamp, and entity plus state filters. Add vector or full-text indexes where retrieval features require them.
- Constraints: Enforce uniqueness at the tenant boundary, soft-delete safety, and temporal validity for session or token records.

## 5. API Contracts
- Endpoints:
- GET /dashboard
- GET /deadlines
- GET /rooms
- GET /ai/briefing
- Methods: Prefer GET for retrieval, POST for create and AI actions, PATCH for partial updates, and DELETE for reversible removal toggles only when safe.
- Authentication: Session cookie or bearer token backed by refresh token rotation.
- Authorization: Role checks at tenant, room, and entity level.

## 6. Security Requirements
- Never expose hidden room metadata in aggregates
- Scope all counts to visible memberships

## 7. Performance Requirements
- Time-to-first-widget under 1s
- Full dashboard interactive under 2.5s
- Caching: Cache reference data and bootstrap payloads aggressively; cache personalized lists carefully with mutation-aware invalidation; avoid caching unsafe AI outputs without source/version metadata.
- Lazy loading: Defer heavy charts, long lists, and secondary rails until the primary task path is interactive.
- Pagination: Use cursor pagination for feeds, notifications, and activity timelines.

## 8. Monitoring
- Widget error rates
- Deadline click-through rate
- Daily active usage by tenant
- Logs: Include request id, actor id, tenant id, feature key, latency, and policy decision where relevant.
- Metrics: Instrument success rate, latency, retries, abandonment, and feature adoption.
- Alerts: Trigger on sustained error rate, latency regression, queue backlog, or suspicious abuse signatures.
