# Comments And Threading

## 1. Feature Overview
- Purpose: Support post-level discussion, clarifications, and instructor follow-up.
- Business value: Increase discussion depth without overwhelming the feed.
- User value: Reply to a post, follow thread context, and resolve open questions.

## 2. Functional Requirements
- Inputs:
- Comment text
- Thread expansion action
- Resolve or reply actions
- Outputs:
- Comment entity
- Thread open state
- Updated counts
- Dependencies:
- Comment service
- Notification service
- Constraints:
- Thread nesting depth should remain manageable
- Resolved state only for eligible roles

## 3. Complete Logic Flow
- Expand thread lazily
- Render comments
- Submit reply optimistically
- Broadcast updates
- Decision tree: Branch on authentication state, role permission, and data availability first. Branch on AI confidence or moderation policy second. Branch on transport failure last with retry-safe fallbacks.
- Failure recovery: Preserve intent payloads, expose actionable error messages, and use idempotency keys for any mutation that can be retried.

## 4. Database Architecture
- Core tables:
- post_comments
- comment_votes
- comment_resolution_events
- Relationships: Use stable surrogate ids, tenant scoping on all top-level entities, foreign keys for membership or ownership, and append-only event tables for state that needs auditability.
- Indexes: Add composite indexes for tenant plus room, user plus timestamp, and entity plus state filters. Add vector or full-text indexes where retrieval features require them.
- Constraints: Enforce uniqueness at the tenant boundary, soft-delete safety, and temporal validity for session or token records.

## 5. API Contracts
- Endpoints:
- GET /posts/{id}/comments
- POST /posts/{id}/comments
- PATCH /posts/{id}/resolve
- Methods: Prefer GET for retrieval, POST for create and AI actions, PATCH for partial updates, and DELETE for reversible removal toggles only when safe.
- Authentication: Session cookie or bearer token backed by refresh token rotation.
- Authorization: Role checks at tenant, room, and entity level.

## 6. Security Requirements
- Membership enforcement
- Moderation and report hooks

## 7. Performance Requirements
- Comment fetch under 400ms
- Incremental append without full thread reload
- Caching: Cache reference data and bootstrap payloads aggressively; cache personalized lists carefully with mutation-aware invalidation; avoid caching unsafe AI outputs without source/version metadata.
- Lazy loading: Defer heavy charts, long lists, and secondary rails until the primary task path is interactive.
- Pagination: Use cursor pagination for feeds, notifications, and activity timelines.

## 8. Monitoring
- Reply latency
- Resolved thread rate
- Comment toxicity flags
- Logs: Include request id, actor id, tenant id, feature key, latency, and policy decision where relevant.
- Metrics: Instrument success rate, latency, retries, abandonment, and feature adoption.
- Alerts: Trigger on sustained error rate, latency regression, queue backlog, or suspicious abuse signatures.
