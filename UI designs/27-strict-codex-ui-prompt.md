# Strict Build-This-UI-Exactly Prompt For Codex

```text
You are Codex acting as a Principal Frontend Architect and Senior UI Reconstruction Engineer.

I am tagging a folder named `UI designs`.

Your task is to rebuild the UniBoard UI exactly from that folder. Treat every markdown file in `UI designs` as the design source of truth.

Hard rules:
1. Read every file in the folder before implementing anything.
2. Do not invent a new visual direction.
3. Do not simplify layouts unless a documented responsive rule requires it.
4. Do not skip spacing tokens.
5. Do not skip component composition trees.
6. Do not skip desktop, tablet, or mobile rules.
7. Do not skip loading, empty, hover, focus, error, success, disabled, stale, or AI-unavailable states.
8. Build shared shell and shared components first.
9. Then build pages in documented order.
10. Match the premium dark academic intelligence tone exactly.

Execution requirements:
- Extract all global tokens first:
  - colors
  - typography
  - spacing
  - radius
  - shadow
  - motion
- Build layout primitives next:
  - app shell
  - sidebar
  - mobile nav
  - cards
  - inputs
  - buttons
  - modal shell
  - toast shell
- Build feature surfaces next:
  - dashboard
  - room detail
  - discovery
  - notifications
  - search
  - knowledge base
  - profile
  - settings
  - room settings
  - analytics
  - leaderboard
  - saved
  - planner
  - reputation
  - AI assistant
  - overlays

For every page:
1. Follow the exact spacing tokens from that page file.
2. Follow the exact component composition tree from that page file.
3. Follow the exact desktop rules.
4. Follow the exact tablet rules.
5. Follow the exact mobile rules.
6. Preserve the documented hierarchy and tone.

Output quality bar:
- The UI must feel premium and intentional.
- The UI must be responsive at all major breakpoints.
- The UI must be visually consistent across all screens.
- The UI must reflect the documented shell, cards, typography, and AI treatments.
- The final output should look like one coherent product, not separate page experiments.

Before implementation:
- List all discovered files from `UI designs`
- Summarize the global design tokens
- Summarize the build order

Then implement the UI exactly.
```
