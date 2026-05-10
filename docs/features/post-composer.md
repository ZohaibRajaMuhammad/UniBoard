# Post Composer

## 1. Feature Overview
- Purpose: Enable structured academic posting with AI-assisted drafting, anonymity rules, and submission validation.
- Business value: Increase content quality and posting frequency.
- User value: Create a clear note, question, resource, or announcement quickly.

## 2. Functional Requirements
- Inputs:
- Text body
- Post type
- Anonymous toggle
- Attachments or links
- AI suggestion actions
- Outputs:
- Created post
- Draft state
- Validation errors
- Dependencies:
- Composer service
- Attachment service
- AI suggestion service
- Constraints:
- Body length and content policy
- Anonymous posting depends on room policy

## 3. Complete Logic Flow
- Select post type
- Draft content
- Trigger suggestions after threshold
- Submit with optimistic placeholder
- Decision tree: Branch on authentication state, role permission, and data availability first. Branch on AI confidence or moderation policy second. Branch on transport failure last with retry-safe fallbacks.
- Failure recovery: Preserve intent payloads, expose actionable error messages, and use idempotency keys for any mutation that can be retried.

## 4. Database Architecture
- Core tables:
- drafts
- posts
- attachments
- Relationships: Use stable surrogate ids, tenant scoping on all top-level entities, foreign keys for membership or ownership, and append-only event tables for state that needs auditability.
- Indexes: Add composite indexes for tenant plus room, user plus timestamp, and entity plus state filters. Add vector or full-text indexes where retrieval features require them.
- Constraints: Enforce uniqueness at the tenant boundary, soft-delete safety, and temporal validity for session or token records.

## 5. API Contracts
- Endpoints:
- POST /rooms/{id}/posts
- POST /drafts
- POST /ai/composer/suggest
- Methods: Prefer GET for retrieval, POST for create and AI actions, PATCH for partial updates, and DELETE for reversible removal toggles only when safe.
- Authentication: Session cookie or bearer token backed by refresh token rotation.
- Authorization: Role checks at tenant, room, and entity level.

## 6. Security Requirements
- Attachment scanning
- HTML/URL sanitization
- Abuse keyword checks

## 7. Performance Requirements
- Draft autosave under 200ms
- AI suggestions under 1s
- Caching: Cache reference data and bootstrap payloads aggressively; cache personalized lists carefully with mutation-aware invalidation; avoid caching unsafe AI outputs without source/version metadata.
- Lazy loading: Defer heavy charts, long lists, and secondary rails until the primary task path is interactive.
- Pagination: Use cursor pagination for feeds, notifications, and activity timelines.

## 8. Monitoring
- Draft abandonment rate
- Suggestion acceptance rate
- Submission validation failures
- Logs: Include request id, actor id, tenant id, feature key, latency, and policy decision where relevant.
- Metrics: Instrument success rate, latency, retries, abandonment, and feature adoption.
- Alerts: Trigger on sustained error rate, latency regression, queue backlog, or suspicious abuse signatures.
