# Reactions And Reputation

## 1. Feature Overview
- Purpose: Convert valuable interactions into visible feedback and long-term reputation.
- Business value: Reward high-quality academic behavior.
- User value: Upvote, receive recognition, and understand point progression.

## 2. Functional Requirements
- Inputs:
- Votes
- Pins
- Resolved answers
- Quality scoring
- Streak events
- Outputs:
- Counters
- XP events
- Rankings
- Achievement unlocks
- Dependencies:
- Interaction service
- Reputation rules engine
- Leaderboard service
- Constraints:
- Formula transparency
- Abuse mitigation
- Event idempotency

## 3. Complete Logic Flow
- Capture source interaction
- Translate to XP event
- Recalculate totals and derived badges
- Refresh boards and profile metrics
- Decision tree: Branch on authentication state, role permission, and data availability first. Branch on AI confidence or moderation policy second. Branch on transport failure last with retry-safe fallbacks.
- Failure recovery: Preserve intent payloads, expose actionable error messages, and use idempotency keys for any mutation that can be retried.

## 4. Database Architecture
- Core tables:
- xp_events
- reputation_profiles
- achievements
- leaderboards
- Relationships: Use stable surrogate ids, tenant scoping on all top-level entities, foreign keys for membership or ownership, and append-only event tables for state that needs auditability.
- Indexes: Add composite indexes for tenant plus room, user plus timestamp, and entity plus state filters. Add vector or full-text indexes where retrieval features require them.
- Constraints: Enforce uniqueness at the tenant boundary, soft-delete safety, and temporal validity for session or token records.

## 5. API Contracts
- Endpoints:
- POST /posts/{id}/vote
- GET /reputation/me
- GET /reputation/leaderboard
- Methods: Prefer GET for retrieval, POST for create and AI actions, PATCH for partial updates, and DELETE for reversible removal toggles only when safe.
- Authentication: Session cookie or bearer token backed by refresh token rotation.
- Authorization: Role checks at tenant, room, and entity level.

## 6. Security Requirements
- Fraud detection on coordinated voting
- Moderator reversal ability
- Immutable audit trail

## 7. Performance Requirements
- Counter update perceived under 150ms
- Leaderboard recompute incremental
- Caching: Cache reference data and bootstrap payloads aggressively; cache personalized lists carefully with mutation-aware invalidation; avoid caching unsafe AI outputs without source/version metadata.
- Lazy loading: Defer heavy charts, long lists, and secondary rails until the primary task path is interactive.
- Pagination: Use cursor pagination for feeds, notifications, and activity timelines.

## 8. Monitoring
- XP anomaly alerts
- Vote abuse rate
- Achievement unlock frequency
- Logs: Include request id, actor id, tenant id, feature key, latency, and policy decision where relevant.
- Metrics: Instrument success rate, latency, retries, abandonment, and feature adoption.
- Alerts: Trigger on sustained error rate, latency regression, queue backlog, or suspicious abuse signatures.
