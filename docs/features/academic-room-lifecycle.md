# Academic Room Lifecycle

## 1. Feature Overview
- Purpose: Create, discover, join, manage, archive, and render academic rooms.
- Business value: Turn courses into persistent collaboration spaces.
- User value: Join the right room quickly and trust room governance.

## 2. Functional Requirements
- Inputs:
- Room name
- Subject code
- Batch
- Visibility
- Membership actions
- Outputs:
- Room entity
- Membership entity
- Join state
- Room settings snapshot
- Dependencies:
- Room service
- Membership service
- Role service
- Constraints:
- Unique room key within tenant
- Visibility and invite policy
- Membership caps

## 3. Complete Logic Flow
- Create room or load discovery
- Preview room metadata
- Join or request access
- Persist membership and refresh navigation
- Decision tree: Branch on authentication state, role permission, and data availability first. Branch on AI confidence or moderation policy second. Branch on transport failure last with retry-safe fallbacks.
- Failure recovery: Preserve intent payloads, expose actionable error messages, and use idempotency keys for any mutation that can be retried.

## 4. Database Architecture
- Core tables:
- rooms
- room_memberships
- room_invites
- room_settings
- room_archives
- Relationships: Use stable surrogate ids, tenant scoping on all top-level entities, foreign keys for membership or ownership, and append-only event tables for state that needs auditability.
- Indexes: Add composite indexes for tenant plus room, user plus timestamp, and entity plus state filters. Add vector or full-text indexes where retrieval features require them.
- Constraints: Enforce uniqueness at the tenant boundary, soft-delete safety, and temporal validity for session or token records.

## 5. API Contracts
- Endpoints:
- POST /rooms
- GET /rooms/discovery
- POST /rooms/{id}/join
- PATCH /rooms/{id}/settings
- Methods: Prefer GET for retrieval, POST for create and AI actions, PATCH for partial updates, and DELETE for reversible removal toggles only when safe.
- Authentication: Session cookie or bearer token backed by refresh token rotation.
- Authorization: Role checks at tenant, room, and entity level.

## 6. Security Requirements
- Enforce tenant isolation
- Role-guard room policy edits
- Audit all administrative changes

## 7. Performance Requirements
- Discovery P95 under 500ms
- Membership write under 300ms
- Room list virtualization after 200+ rooms
- Caching: Cache reference data and bootstrap payloads aggressively; cache personalized lists carefully with mutation-aware invalidation; avoid caching unsafe AI outputs without source/version metadata.
- Lazy loading: Defer heavy charts, long lists, and secondary rails until the primary task path is interactive.
- Pagination: Use cursor pagination for feeds, notifications, and activity timelines.

## 8. Monitoring
- Join conversion rate
- Private-room approval backlog
- Room creation failure rate
- Logs: Include request id, actor id, tenant id, feature key, latency, and policy decision where relevant.
- Metrics: Instrument success rate, latency, retries, abandonment, and feature adoption.
- Alerts: Trigger on sustained error rate, latency regression, queue backlog, or suspicious abuse signatures.
