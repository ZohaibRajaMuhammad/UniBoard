# Deadline Planner

## 1. Feature Overview
- Purpose: Coordinate deadlines, study sessions, and manual scheduling with AI support.
- Business value: Improve student completion rates and deepen AI utility.
- User value: See calendar commitments and accept study plans.

## 2. Functional Requirements
- Inputs:
- Deadlines
- Progress estimates
- Engagement metrics
- Manual deadline entries
- Outputs:
- Calendar events
- AI schedule
- Urgency bands
- Dependencies:
- Planner service
- Calendar engine
- AI scheduler
- Constraints:
- No impossible overlaps
- Timezone-safe dates
- Editable manual events

## 3. Complete Logic Flow
- Load planner snapshot
- Render month/week view
- Generate or refresh study plan
- Write manual deadline and re-plan
- Decision tree: Branch on authentication state, role permission, and data availability first. Branch on AI confidence or moderation policy second. Branch on transport failure last with retry-safe fallbacks.
- Failure recovery: Preserve intent payloads, expose actionable error messages, and use idempotency keys for any mutation that can be retried.

## 4. Database Architecture
- Core tables:
- deadlines
- study_sessions
- planner_snapshots
- calendar_exports
- Relationships: Use stable surrogate ids, tenant scoping on all top-level entities, foreign keys for membership or ownership, and append-only event tables for state that needs auditability.
- Indexes: Add composite indexes for tenant plus room, user plus timestamp, and entity plus state filters. Add vector or full-text indexes where retrieval features require them.
- Constraints: Enforce uniqueness at the tenant boundary, soft-delete safety, and temporal validity for session or token records.

## 5. API Contracts
- Endpoints:
- GET /planner
- POST /planner/replan
- POST /deadlines
- POST /planner/export
- Methods: Prefer GET for retrieval, POST for create and AI actions, PATCH for partial updates, and DELETE for reversible removal toggles only when safe.
- Authentication: Session cookie or bearer token backed by refresh token rotation.
- Authorization: Role checks at tenant, room, and entity level.

## 6. Security Requirements
- Per-user plans private unless shared

## 7. Performance Requirements
- Planner load under 1s cached, re-plan under 4s
- Caching: Cache reference data and bootstrap payloads aggressively; cache personalized lists carefully with mutation-aware invalidation; avoid caching unsafe AI outputs without source/version metadata.
- Lazy loading: Defer heavy charts, long lists, and secondary rails until the primary task path is interactive.
- Pagination: Use cursor pagination for feeds, notifications, and activity timelines.

## 8. Monitoring
- Deadline completion rate
- Plan acceptance rate
- Schedule conflict rate
- Logs: Include request id, actor id, tenant id, feature key, latency, and policy decision where relevant.
- Metrics: Instrument success rate, latency, retries, abandonment, and feature adoption.
- Alerts: Trigger on sustained error rate, latency regression, queue backlog, or suspicious abuse signatures.
