# Room Feed State

## Scope
- Room detail, post list, comment expansion, vote/save counters, teacher panel visibility.

## Required Store Keys
- activeRoomId
- feedItems
- feedCursor
- expandedThreads
- optimisticMutations

## State Lifecycle
- Initialize from bootstrap or route-level query.
- Track loading, success, error, and stale markers separately from entity payloads.
- Support optimistic mutation metadata where the UI changes before the server confirms.
- Clear ephemeral overlays and AI job loaders on route exit unless persistence is explicitly required.

## Synchronization Rules
- Normalize durable entities by id.
- Keep UI state local to feature containers unless needed across routes.
- Reconcile websocket or polling updates against in-flight optimistic writes.

## Risk Areas
- Optimistic mutation rollback
- Duplicate posts on pagination
- Lost scroll position

## Recommended Implementation
- Use a shared client store for authenticated app state, route-local state for heavy screens, and typed selectors for computed badges or counts.
- Persist only user-safe, high-value state such as draft recovery or last-selected planner view.
