# Notifications

## 1. Feature Overview
- Purpose: Deliver actionable academic alerts without turning the product into noise.
- Business value: Re-activate dormant users and accelerate response loops.
- User value: See meaningful changes and act from the alert list.

## 2. Functional Requirements
- Inputs:
- Reply events
- Upvotes
- Pinned posts
- Deadline reminders
- AI alerts
- Outputs:
- Unread count
- Notification feed
- Deep links
- Dependencies:
- Event bus
- Notification service
- Preference service
- Constraints:
- Preference-aware fanout
- Deduplication
- Channel throttling

## 3. Complete Logic Flow
- Ingest domain event
- Apply rules and preferences
- Persist notification
- Render in-app and optional push/email
- Decision tree: Branch on authentication state, role permission, and data availability first. Branch on AI confidence or moderation policy second. Branch on transport failure last with retry-safe fallbacks.
- Failure recovery: Preserve intent payloads, expose actionable error messages, and use idempotency keys for any mutation that can be retried.

## 4. Database Architecture
- Core tables:
- notifications
- notification_preferences
- delivery_attempts
- Relationships: Use stable surrogate ids, tenant scoping on all top-level entities, foreign keys for membership or ownership, and append-only event tables for state that needs auditability.
- Indexes: Add composite indexes for tenant plus room, user plus timestamp, and entity plus state filters. Add vector or full-text indexes where retrieval features require them.
- Constraints: Enforce uniqueness at the tenant boundary, soft-delete safety, and temporal validity for session or token records.

## 5. API Contracts
- Endpoints:
- GET /notifications
- PATCH /notifications/{id}
- POST /notifications/mark-all-read
- Methods: Prefer GET for retrieval, POST for create and AI actions, PATCH for partial updates, and DELETE for reversible removal toggles only when safe.
- Authentication: Session cookie or bearer token backed by refresh token rotation.
- Authorization: Role checks at tenant, room, and entity level.

## 6. Security Requirements
- Per-user audience enforcement
- PII-safe payloads

## 7. Performance Requirements
- In-app notification propagation under 5s
- Unread count delta near real time
- Caching: Cache reference data and bootstrap payloads aggressively; cache personalized lists carefully with mutation-aware invalidation; avoid caching unsafe AI outputs without source/version metadata.
- Lazy loading: Defer heavy charts, long lists, and secondary rails until the primary task path is interactive.
- Pagination: Use cursor pagination for feeds, notifications, and activity timelines.

## 8. Monitoring
- Notification CTR
- Unread aging
- Delivery failure by channel
- Logs: Include request id, actor id, tenant id, feature key, latency, and policy decision where relevant.
- Metrics: Instrument success rate, latency, retries, abandonment, and feature adoption.
- Alerts: Trigger on sustained error rate, latency regression, queue backlog, or suspicious abuse signatures.
