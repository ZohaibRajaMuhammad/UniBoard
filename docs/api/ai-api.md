# AI API

## Endpoints
- GET /api/v1/ai/briefing
- POST /api/v1/ai/assistant
- POST /api/v1/ai/composer/suggest
- POST /api/v1/ai/knowledge/query
- POST /api/v1/ai/room-summary
- GET /api/v1/ai/deadline-risk

## Contract Expectations
- Request payloads: Prompt text, room context, feature flags, retrieval options, response schema hints.
- Response payloads: Standardize on { data, meta, error } envelopes. Include request ids, pagination cursors where relevant, and capability flags for policy-constrained surfaces.
- Authentication: Bearer token or secure session cookie with CSRF protection for browser mutations.
- Authorization: Enforce tenant, room, role, and entity ownership at the API boundary.

## Error Handling
- 403 AI disabled by policy
- 422 unsafe input
- 429 model rate limited
- 503 model unavailable
- Retry strategy: Safe reads may retry with exponential backoff; writes require idempotency keys if retries are automated.
- Caching: Permit edge caching only for anonymous or static metadata. Personalized responses should use private caches with explicit invalidation semantics.

## Observability
- Log request id, actor id, tenant id, route, status code, latency, and downstream dependency timings.
- Emit per-endpoint SLO metrics and structured error taxonomy counts.
