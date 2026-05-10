# Authentication

## 1. Feature Overview
- Purpose: Secure account access and identity creation for students, moderators, and instructors.
- Business value: Protect academic data while minimizing friction.
- User value: Sign in, sign up, verify identity, and recover access.

## 2. Functional Requirements
- Inputs:
- Email
- Password
- Tenant policy
- Optional captcha or MFA token
- Outputs:
- Session token
- Refresh token
- Bootstrap payload
- Verification status
- Dependencies:
- Auth service
- Email service
- Tenant policy service
- Risk engine
- Constraints:
- Institutional-domain rules
- Rate limits
- Password policy
- SSO override

## 3. Complete Logic Flow
- Validate form locally
- Submit credential exchange
- Issue tokens or challenge
- Load bootstrap data and redirect
- Decision tree: Branch on authentication state, role permission, and data availability first. Branch on AI confidence or moderation policy second. Branch on transport failure last with retry-safe fallbacks.
- Failure recovery: Preserve intent payloads, expose actionable error messages, and use idempotency keys for any mutation that can be retried.

## 4. Database Architecture
- Core tables:
- users
- auth_identities
- sessions
- verification_tokens
- password_reset_tokens
- login_attempts
- Relationships: Use stable surrogate ids, tenant scoping on all top-level entities, foreign keys for membership or ownership, and append-only event tables for state that needs auditability.
- Indexes: Add composite indexes for tenant plus room, user plus timestamp, and entity plus state filters. Add vector or full-text indexes where retrieval features require them.
- Constraints: Enforce uniqueness at the tenant boundary, soft-delete safety, and temporal validity for session or token records.

## 5. API Contracts
- Endpoints:
- POST /auth/login
- POST /auth/register
- POST /auth/logout
- POST /auth/password/forgot
- POST /auth/password/reset
- Methods: Prefer GET for retrieval, POST for create and AI actions, PATCH for partial updates, and DELETE for reversible removal toggles only when safe.
- Authentication: Session cookie or bearer token backed by refresh token rotation.
- Authorization: Role checks at tenant, room, and entity level.

## 6. Security Requirements
- Hash passwords with Argon2id or equivalent
- Rotate refresh tokens
- Bind sessions to device metadata
- Add brute-force protections

## 7. Performance Requirements
- P95 login under 700ms excluding email verification
- Bootstrap payload under 300KB compressed
- Caching: Cache reference data and bootstrap payloads aggressively; cache personalized lists carefully with mutation-aware invalidation; avoid caching unsafe AI outputs without source/version metadata.
- Lazy loading: Defer heavy charts, long lists, and secondary rails until the primary task path is interactive.
- Pagination: Use cursor pagination for feeds, notifications, and activity timelines.

## 8. Monitoring
- Track auth success rate
- Track step-up auth challenges
- Alert on suspicious failure spikes
- Logs: Include request id, actor id, tenant id, feature key, latency, and policy decision where relevant.
- Metrics: Instrument success rate, latency, retries, abandonment, and feature adoption.
- Alerts: Trigger on sustained error rate, latency regression, queue backlog, or suspicious abuse signatures.
