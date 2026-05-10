# Posts API

## Endpoints
- GET /api/v1/rooms/{roomId}/posts
- POST /api/v1/rooms/{roomId}/posts
- GET /api/v1/posts/{postId}
- POST /api/v1/posts/{postId}/comments
- GET /api/v1/posts/{postId}/comments

## Contract Expectations
- Request payloads: Post bodies, types, anonymity flags, attachments, cursor tokens.
- Response payloads: Standardize on { data, meta, error } envelopes. Include request ids, pagination cursors where relevant, and capability flags for policy-constrained surfaces.
- Authentication: Bearer token or secure session cookie with CSRF protection for browser mutations.
- Authorization: Enforce tenant, room, role, and entity ownership at the API boundary.

## Error Handling
- 403 room access denied
- 404 post deleted
- 413 payload too large
- 422 validation failed
- Retry strategy: Safe reads may retry with exponential backoff; writes require idempotency keys if retries are automated.
- Caching: Permit edge caching only for anonymous or static metadata. Personalized responses should use private caches with explicit invalidation semantics.

## Observability
- Log request id, actor id, tenant id, route, status code, latency, and downstream dependency timings.
- Emit per-endpoint SLO metrics and structured error taxonomy counts.
