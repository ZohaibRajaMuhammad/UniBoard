# Planner State

## Scope
- Selected date, calendar view, deadlines, study sessions, modal state.

## Required Store Keys
- calendarMonth
- calendarView
- deadlines
- studySessions
- replanStatus

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
- Timezone drift
- Month/week view desync

## Recommended Implementation
- Use a shared client store for authenticated app state, route-local state for heavy screens, and typed selectors for computed badges or counts.
- Persist only user-safe, high-value state such as draft recovery or last-selected planner view.
