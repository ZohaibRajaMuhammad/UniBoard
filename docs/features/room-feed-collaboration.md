# Room Feed Collaboration

## 1. Feature Overview
- Purpose: Power room-level announcements, questions, resources, and notes with threaded discussion.
- Business value: Make the room feed the product core.
- User value: Read, react, post, and resolve academic discussions.

## 2. Functional Requirements
- Inputs:
- Post payloads
- Comment payloads
- Votes
- Pins
- Resolve actions
- Outputs:
- Ordered feed
- Thread state
- Engagement counters
- Moderation state
- Dependencies:
- Post service
- Comment service
- Moderation service
- Search indexer
- Constraints:
- Ordered by pinned priority then recency
- Role-specific moderation actions

## 3. Complete Logic Flow
- Load room feed
- Expand threads on demand
- Submit optimistic interactions
- Reconcile counters and ordering
- Decision tree: Branch on authentication state, role permission, and data availability first. Branch on AI confidence or moderation policy second. Branch on transport failure last with retry-safe fallbacks.
- Failure recovery: Preserve intent payloads, expose actionable error messages, and use idempotency keys for any mutation that can be retried.

## 4. Database Architecture
- Core tables:
- posts
- post_comments
- post_votes
- post_saves
- post_labels
- post_moderation_events
- Relationships: Use stable surrogate ids, tenant scoping on all top-level entities, foreign keys for membership or ownership, and append-only event tables for state that needs auditability.
- Indexes: Add composite indexes for tenant plus room, user plus timestamp, and entity plus state filters. Add vector or full-text indexes where retrieval features require them.
- Constraints: Enforce uniqueness at the tenant boundary, soft-delete safety, and temporal validity for session or token records.

## 5. API Contracts
- Endpoints:
- GET /rooms/{id}/posts
- POST /rooms/{id}/posts
- POST /posts/{id}/comments
- POST /posts/{id}/vote
- Methods: Prefer GET for retrieval, POST for create and AI actions, PATCH for partial updates, and DELETE for reversible removal toggles only when safe.
- Authentication: Session cookie or bearer token backed by refresh token rotation.
- Authorization: Role checks at tenant, room, and entity level.

## 6. Security Requirements
- Permission-check room membership on every interaction
- Sanitize rich text and links
- Anti-abuse throttling

## 7. Performance Requirements
- Paginated feed fetch under 600ms
- Optimistic action acknowledgment under 150ms perceived
- Caching: Cache reference data and bootstrap payloads aggressively; cache personalized lists carefully with mutation-aware invalidation; avoid caching unsafe AI outputs without source/version metadata.
- Lazy loading: Defer heavy charts, long lists, and secondary rails until the primary task path is interactive.
- Pagination: Use cursor pagination for feeds, notifications, and activity timelines.

## 8. Monitoring
- Post creation rate
- Thread depth distribution
- Moderation action volume
- Logs: Include request id, actor id, tenant id, feature key, latency, and policy decision where relevant.
- Metrics: Instrument success rate, latency, retries, abandonment, and feature adoption.
- Alerts: Trigger on sustained error rate, latency regression, queue backlog, or suspicious abuse signatures.
