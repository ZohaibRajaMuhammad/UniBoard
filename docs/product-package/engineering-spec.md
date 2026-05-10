# UniBoard Engineering Specification

## Recommended Architecture
- Frontend: Component-driven SPA using a normalized client store plus route-level state slices.
- Backend: Modular service boundary around auth, rooms, posts, notifications, AI orchestration, planner, analytics, and reputation.
- Storage: Relational primary store, append-only event tables for reputation and audits, full-text/vector retrieval layer for search and knowledge.
- AI layer: Gateway/orchestrator that handles retrieval, prompt construction, model invocation, output validation, and telemetry.

## Core Domain Services
- Auth and identity service.
- Room and membership service.
- Feed/post/comment service.
- Notification service.
- Search and retrieval service.
- AI orchestration service.
- Planner service.
- Reputation service.
- Analytics aggregation service.
- Settings and policy service.

## Frontend Module Breakdown
- App shell and navigation.
- Auth flows.
- Dashboard composition layer.
- Room experience module.
- Search and knowledge module.
- Planner module.
- Reputation module.
- Shared systems: modal, toast, forms, AI surfaces, analytics instrumentation.

## Data Contracts
- Use versioned JSON contracts under /api/v1.
- Adopt a standard envelope with data, meta, and error.
- All list endpoints use cursor pagination.
- All retryable mutations accept idempotency keys.

## Security Requirements
- Tenant scoping on all top-level entities.
- Backend permission enforcement for every mutation and entity fetch.
- Signed uploads for media.
- Audit logs for settings and moderation changes.
- AI prompt/context access scoped to the requesting user.

## AI Implementation Rules
- Grounded features require retriever evidence and source objects.
- Non-grounded assistant actions must remain explicitly framed as suggestions.
- Confidence bands must be stored and surfaced where they affect user trust.
- Long-running AI tasks should use async jobs rather than block the UI.

## Performance Targets
- Dashboard first meaningful content under 1.5s on median broadband.
- Feed interaction acknowledgment under 150ms perceived via optimistic UI.
- Search result response under 1.2s at P95.
- Knowledge answer response under 3.5s at P95.
- Planner re-plan under 4s or async fallback.

## Observability
- Per-route and per-feature client analytics.
- Structured server logs with request id and actor id.
- Metrics on latency, success rate, retries, AI cost, grounding quality, and abuse signals.
- Alerts for auth anomalies, error spikes, queue backlog, and model dependency degradation.

## Delivery Constraints
- Build shared shell and permissions before deep feature modules.
- Do not implement AI UI affordances without the underlying source-safe orchestration path.
- Treat planner and reputation as first-class modules even though they are prototype extensions.
