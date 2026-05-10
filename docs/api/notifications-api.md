# Notifications API

## Endpoints
- GET /api/v1/notifications
- PATCH /api/v1/notifications/{id}
- POST /api/v1/notifications/mark-all-read

## Contract Expectations
- Request payloads: Cursor parameters, read state, filter type.
- Response payloads: Standardize on { data, meta, error } envelopes. Include request ids, pagination cursors where relevant, and capability flags for policy-constrained surfaces.
- Authentication: Bearer token or secure session cookie with CSRF protection for browser mutations.
- Authorization: Enforce tenant, room, role, and entity ownership at the API boundary.

## Error Handling
- 404 notification missing
- 409 state mismatch
- Retry strategy: Safe reads may retry with exponential backoff; writes require idempotency keys if retries are automated.
- Caching: Permit edge caching only for anonymous or static metadata. Personalized responses should use private caches with explicit invalidation semantics.

## Observability
- Log request id, actor id, tenant id, route, status code, latency, and downstream dependency timings.
- Emit per-endpoint SLO metrics and structured error taxonomy counts.
