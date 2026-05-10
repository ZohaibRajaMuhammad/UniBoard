# Composer State

## Scope
- Draft text, post type, anonymity flag, AI suggestions, submit status.

## Required Store Keys
- draftBody
- draftType
- isAnonymous
- aiSuggestions
- submitStatus

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
- Draft loss
- Suggestion applied twice
- Type switch invalidating helper text

## Recommended Implementation
- Use a shared client store for authenticated app state, route-local state for heavy screens, and typed selectors for computed badges or counts.
- Persist only user-safe, high-value state such as draft recovery or last-selected planner view.
