# UniBoard Frontend Deep Dive

This folder documents the current frontend as implemented in the codebase. It is written for UI/UX refinement, not marketing, so it focuses on actual screens, control placement, interaction states, data dependencies, permissions, and gaps between current implementation and likely future intent.

## Files

- [01-app-shell-and-navigation.md](/C:/Users/Wajiz.pk/.vscode/Anonymous/docs/01-app-shell-and-navigation.md)
  Global shell, layout behavior, sidebar, bottom navigation, spacing system, and responsive structure.
- [02-screen-by-screen-ui-guide.md](/C:/Users/Wajiz.pk/.vscode/Anonymous/docs/02-screen-by-screen-ui-guide.md)
  Every current screen with section order, button placement, empty states, loading states, and UX implications.
- [03-feature-logic-and-interaction-model.md](/C:/Users/Wajiz.pk/.vscode/Anonymous/docs/03-feature-logic-and-interaction-model.md)
  Underlying business logic for rooms, posts, comments, reactions, moderation, notifications, permissions, and data flow.
- [04-ui-ux-refinement-opportunities.md](/C:/Users/Wajiz.pk/.vscode/Anonymous/docs/04-ui-ux-refinement-opportunities.md)
  Concrete UI/UX refinement opportunities based on the current implementation.

## Scope

This documentation covers these implemented routes:

- `/`
- `/sign-in`
- `/sign-up`
- `/dashboard`
- `/rooms`
- `/rooms/[roomId]`
- `/rooms/[roomId]/settings`
- `/notifications`
- `/search`
- `/profile`
- `/settings`

## Important Reading Notes

- The docs distinguish between `implemented now`, `partially implemented`, and `schema/backend prepared but not surfaced in UI`.
- Some features exist in backend schema but are not exposed in the interface yet, such as richer room settings, onboarding completion, profile editing, and some moderation actions.
- There are two dashboard page files in the app tree. The route that matters for user-facing behavior is `/dashboard`, documented here.

## Quick Product Summary

UniBoard is a real-time academic communication interface built around:

- authenticated user identity via Clerk
- live room and feed data via Convex
- room-based posting
- optional anonymous participation
- deadline visibility
- searchable class knowledge
- lightweight moderation for teachers and room owners

The product tone is operational rather than social. Most UI decisions reinforce that: glass panels, compact status chips, statistics, filters, and persistent navigation instead of a casual chat layout.
