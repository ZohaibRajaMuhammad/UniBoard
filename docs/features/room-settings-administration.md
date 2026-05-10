# Room Settings Administration

## 1. Feature Overview
- Purpose: Manage room-level policies, visibility, and AI enablement.
- Business value: Let course owners govern behavior inside the product.
- User value: Change room rules and trust they take effect immediately.

## 2. Functional Requirements
- Inputs:
- Visibility flag
- Anonymous posting toggle
- Student invite toggle
- AI enablement toggle
- Outputs:
- Updated room policy
- Audit log entry
- Dependencies:
- Room settings service
- Audit service
- Constraints:
- Only room admins may mutate
- Archived rooms are read-only

## 3. Complete Logic Flow
- Fetch settings
- Apply edits
- Validate against tenant policy
- Persist and broadcast policy update
- Decision tree: Branch on authentication state, role permission, and data availability first. Branch on AI confidence or moderation policy second. Branch on transport failure last with retry-safe fallbacks.
- Failure recovery: Preserve intent payloads, expose actionable error messages, and use idempotency keys for any mutation that can be retried.

## 4. Database Architecture
- Core tables:
- room_settings
- room_policy_audits
- Relationships: Use stable surrogate ids, tenant scoping on all top-level entities, foreign keys for membership or ownership, and append-only event tables for state that needs auditability.
- Indexes: Add composite indexes for tenant plus room, user plus timestamp, and entity plus state filters. Add vector or full-text indexes where retrieval features require them.
- Constraints: Enforce uniqueness at the tenant boundary, soft-delete safety, and temporal validity for session or token records.

## 5. API Contracts
- Endpoints:
- GET /rooms/{id}/settings
- PATCH /rooms/{id}/settings
- Methods: Prefer GET for retrieval, POST for create and AI actions, PATCH for partial updates, and DELETE for reversible removal toggles only when safe.
- Authentication: Session cookie or bearer token backed by refresh token rotation.
- Authorization: Role checks at tenant, room, and entity level.

## 6. Security Requirements
- Strong authorization and audit logging

## 7. Performance Requirements
- Save under 400ms
- Caching: Cache reference data and bootstrap payloads aggressively; cache personalized lists carefully with mutation-aware invalidation; avoid caching unsafe AI outputs without source/version metadata.
- Lazy loading: Defer heavy charts, long lists, and secondary rails until the primary task path is interactive.
- Pagination: Use cursor pagination for feeds, notifications, and activity timelines.

## 8. Monitoring
- Policy change rate
- Unauthorized attempt alerts
- Logs: Include request id, actor id, tenant id, feature key, latency, and policy decision where relevant.
- Metrics: Instrument success rate, latency, retries, abandonment, and feature adoption.
- Alerts: Trigger on sustained error rate, latency regression, queue backlog, or suspicious abuse signatures.
