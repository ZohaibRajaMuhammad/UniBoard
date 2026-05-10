# Reputation System

## 1. Feature Overview
- Purpose: Model XP, tiers, achievements, streaks, and subject expertise.
- Business value: Reward meaningful academic contribution, not raw noise.
- User value: Gain transparent credit for quality work.

## 2. Functional Requirements
- Inputs:
- Interaction events
- Quality scores
- Moderation reversals
- AI expertise inference
- Outputs:
- XP totals
- Tier state
- Achievements
- Expertise scores
- Dependencies:
- Rules engine
- Analytics pipeline
- Moderator tooling
- Constraints:
- Transparent scoring, reversible event sourcing, anti-abuse policy

## 3. Complete Logic Flow
- Capture event
- Score according to rule set
- Persist immutable XP event
- Refresh derived views
- Decision tree: Branch on authentication state, role permission, and data availability first. Branch on AI confidence or moderation policy second. Branch on transport failure last with retry-safe fallbacks.
- Failure recovery: Preserve intent payloads, expose actionable error messages, and use idempotency keys for any mutation that can be retried.

## 4. Database Architecture
- Core tables:
- xp_events
- expertise_scores
- achievement_unlocks
- streaks
- Relationships: Use stable surrogate ids, tenant scoping on all top-level entities, foreign keys for membership or ownership, and append-only event tables for state that needs auditability.
- Indexes: Add composite indexes for tenant plus room, user plus timestamp, and entity plus state filters. Add vector or full-text indexes where retrieval features require them.
- Constraints: Enforce uniqueness at the tenant boundary, soft-delete safety, and temporal validity for session or token records.

## 5. API Contracts
- Endpoints:
- GET /reputation/me
- GET /reputation/activity
- POST /reputation/recalculate
- Methods: Prefer GET for retrieval, POST for create and AI actions, PATCH for partial updates, and DELETE for reversible removal toggles only when safe.
- Authentication: Session cookie or bearer token backed by refresh token rotation.
- Authorization: Role checks at tenant, room, and entity level.

## 6. Security Requirements
- Restrict recalc endpoint to admin workflows

## 7. Performance Requirements
- Online XP updates near real time, full recalc async
- Caching: Cache reference data and bootstrap payloads aggressively; cache personalized lists carefully with mutation-aware invalidation; avoid caching unsafe AI outputs without source/version metadata.
- Lazy loading: Defer heavy charts, long lists, and secondary rails until the primary task path is interactive.
- Pagination: Use cursor pagination for feeds, notifications, and activity timelines.

## 8. Monitoring
- Score drift, reversal volume, expertise confidence
- Logs: Include request id, actor id, tenant id, feature key, latency, and policy decision where relevant.
- Metrics: Instrument success rate, latency, retries, abandonment, and feature adoption.
- Alerts: Trigger on sustained error rate, latency regression, queue backlog, or suspicious abuse signatures.
