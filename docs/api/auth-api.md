# Auth API

## Endpoints
- POST /api/v1/auth/login
- POST /api/v1/auth/register
- POST /api/v1/auth/logout
- POST /api/v1/auth/password/forgot
- POST /api/v1/auth/password/reset
- GET /api/v1/session/current

## Contract Expectations
- Request payloads: Credentials, registration profile, reset tokens, risk metadata.
- Response payloads: Standardize on { data, meta, error } envelopes. Include request ids, pagination cursors where relevant, and capability flags for policy-constrained surfaces.
- Authentication: Bearer token or secure session cookie with CSRF protection for browser mutations.
- Authorization: Enforce tenant, room, role, and entity ownership at the API boundary.

## Error Handling
- 401 invalid credentials
- 403 verification required
- 409 duplicate account
- 429 too many attempts
- Retry strategy: Safe reads may retry with exponential backoff; writes require idempotency keys if retries are automated.
- Caching: Permit edge caching only for anonymous or static metadata. Personalized responses should use private caches with explicit invalidation semantics.

## Observability
- Log request id, actor id, tenant id, route, status code, latency, and downstream dependency timings.
- Emit per-endpoint SLO metrics and structured error taxonomy counts.
