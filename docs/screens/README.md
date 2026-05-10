# Screens Documentation Index

This folder contains the screen-level implementation requirements for UniBoard. Each file defines a full screen specification, including UI architecture, control inventory, state expectations, business rules, API dependencies, and edge-case behavior.

## Files In This Folder
- `landing-screen.md`
- `sign-in-screen.md`
- `sign-up-screen.md`
- `dashboard-screen.md`
- `room-detail-screen.md`
- `rooms-discovery-screen.md`
- `notifications-screen.md`
- `search-screen.md`
- `knowledge-base-screen.md`
- `profile-screen.md`
- `settings-screen.md`
- `room-settings-screen.md`
- `analytics-screen.md`
- `leaderboard-screen.md`
- `saved-screen.md`
- `planner-screen.md`
- `reputation-screen.md`

## How To Use These Files
1. Read the screen file before implementation starts.
2. Cross-check the matching feature, component, flow, state, API, and validation docs.
3. Implement the screen only after shared dependencies are ready.
4. Validate every control listed in the UI inventory matrix.

## Completion Standard
A screen is complete only when:
- the documented layout is implemented,
- all listed controls exist,
- states and permission rules are enforced,
- APIs are integrated,
- and the related flows pass validation.
