# Interactions API

## Endpoints
- POST /api/v1/posts/{postId}/vote
- POST /api/v1/posts/{postId}/save
- DELETE /api/v1/posts/{postId}/save
- PATCH /api/v1/posts/{postId}/resolve

## Contract Expectations
- Request payloads: Actor context, idempotency key, interaction target.
- Response payloads: Standardize on { data, meta, error } envelopes. Include request ids, pagination cursors where relevant, and capability flags for policy-constrained surfaces.
- Authentication: Bearer token or secure session cookie with CSRF protection for browser mutations.
- Authorization: Enforce tenant, room, role, and entity ownership at the API boundary.

## Error Handling
- 403 action forbidden
- 404 target missing
- 409 duplicate interaction
- Retry strategy: Safe reads may retry with exponential backoff; writes require idempotency keys if retries are automated.
- Caching: Permit edge caching only for anonymous or static metadata. Personalized responses should use private caches with explicit invalidation semantics.

## Observability
- Log request id, actor id, tenant id, route, status code, latency, and downstream dependency timings.
- Emit per-endpoint SLO metrics and structured error taxonomy counts.
