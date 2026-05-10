# Reputation API

## Endpoints
- GET /api/v1/reputation/me
- GET /api/v1/reputation/activity
- GET /api/v1/reputation/leaderboard
- POST /api/v1/reputation/recalculate

## Contract Expectations
- Request payloads: Timeframe filters, room scope, admin recalc parameters.
- Response payloads: Standardize on { data, meta, error } envelopes. Include request ids, pagination cursors where relevant, and capability flags for policy-constrained surfaces.
- Authentication: Bearer token or secure session cookie with CSRF protection for browser mutations.
- Authorization: Enforce tenant, room, role, and entity ownership at the API boundary.

## Error Handling
- 403 recalc forbidden
- 409 recalculation in progress
- 404 profile missing
- Retry strategy: Safe reads may retry with exponential backoff; writes require idempotency keys if retries are automated.
- Caching: Permit edge caching only for anonymous or static metadata. Personalized responses should use private caches with explicit invalidation semantics.

## Observability
- Log request id, actor id, tenant id, route, status code, latency, and downstream dependency timings.
- Emit per-endpoint SLO metrics and structured error taxonomy counts.
