# Planner Screen

Source prototypes: uniboard-complete.html

## 1. Screen Overview
- Screen purpose: Turn deadlines and engagement signals into a calendar-backed study planning experience.
- Business goal: Increase deadline completion, study consistency, and AI feature stickiness.
- User goal: See what is due, what is scheduled, and what the AI recommends doing next.
- Primary actions:
- Review calendar
- Inspect upcoming deadlines
- Accept or re-plan AI study sessions
- Add manual deadline
- Secondary actions:
- Switch month/week view
- Navigate calendar dates
- Export sessions to calendar

## 2. UI Layout Architecture
- Structural layout:
- Two-column planner layout: calendar left, right rail 340px
- Top stats strip, calendar header, month/week grid, right-side AI plan and deadline list
- Manual deadline CTA at end of deadline list
- Header/navigation behavior: Desktop screens inherit the global left sidebar pattern where applicable. Auth screens use a centered card and back navigation. Mobile replaces the sidebar with a bottom navigation capsule.
- Cards/lists/tables/charts: Use dark glass surfaces, 16px to 28px radii, thin high-contrast borders, and compact metadata hierarchy. Analytical screens use chart cards and mono labels; collaboration screens prioritize feed cards and threaded content.
- Buttons/inputs/modals/tabs/tooltips: Primary CTAs use sapphire gradients, secondary actions use ghost styling, destructive actions use red-tinted surfaces, and compact icon-only controls require explicit hover/focus states. Modals use blurred overlays and spring entrance animations.
- Typography/color usage: Titles use Plus Jakarta Sans with lighter weight on marketing surfaces and 600 to 700 weight on application surfaces. Metadata and counters use JetBrains Mono selectively. Sapphire communicates primary action and AI, gold signals premium emphasis or rank, red urgency, green success.
- Spacing/margins: Respect the 8px grid. Typical page edge padding is 28px x 32px, internal card padding is 22px to 26px, and list row separation is 8px to 16px depending on density.
- Responsive behavior: Collapse secondary rails first, then dense grids, then navigation chrome. Preserve first-action visibility at every breakpoint.
- Animation behavior: Use 200ms to 320ms opacity and translate transitions for page or modal entrances, spring easing for overlays and toggles, and restrained hover lift for actionable cards.

## 2.1 Per-Screen UI Inventory Matrix
| Control ID | Control | Type | Visible On | Purpose | Primary Interaction | States | Permissions | Data Binding | Validation / Constraints | Notes |
|---|---|---|---|---|---|---|---|---|---|---|
| planner-stats | Planner stat strip | Metric cards | Desktop, tablet, mobile | Summarize urgency and planned effort | Passive | loading, loaded | Authenticated | planner.metrics | Numeric integrity | Top-level scan aid |
| planner-cal-nav | Calendar navigation | Buttons | Desktop, tablet, mobile | Move across time | Prev, today, next | default, hover, focus | Authenticated | calendarMonth | Date arithmetic | Month/week context must remain coherent |
| planner-view-toggle | Month/week toggle | Segmented control | Desktop, tablet, mobile | Switch calendar density | Select | month active, week active | Authenticated | calendarView | Enum | Week view hidden by default in prototype |
| planner-grid | Calendar grid | Calendar surface | Desktop, tablet, mobile | Visualize deadlines and study blocks | Inspect or select | month, week, current-day | Authenticated | calendar events | Time-zone normalized | Could later support drag/drop |
| planner-ai-plan | AI study planner card | AI recommendation module | Desktop, tablet, mobile | Recommend study sessions | Re-plan, add to calendar | loading, loaded, replanning | Authenticated and AI enabled | studyPlan | Conflict-aware | Core planner differentiator |
| planner-deadline-list | Upcoming deadlines list | List | Desktop, tablet, mobile | Show upcoming work and progress | Review | loaded | Authenticated | deadlines[] | Future-date and progress data | Each item carries urgency color |
| planner-add-deadline | Add deadline CTA | Button | Desktop, tablet, mobile | Open manual deadline modal | Open modal | default, hover | Authenticated | modal.addDeadline | None | Should preserve current planner context |

## 3. Pixel Perfect UI Specification
- Grid system: Use an 8px base grid. Primary paddings observed in the prototypes are 28px vertical and 32px horizontal for page bodies, 22px to 26px inside cards and modals, and 12px to 16px inside compact controls.
- Breakpoints: desktop `>= 1280px`, laptop `1024px-1279px`, tablet `768px-1023px`, mobile `< 768px`. `uniboard-ai.html` explicitly switches behavior at `1024px` and `768px`.
- Desktop layout: Preserve the fixed left rail at `256px`, a content max width between `760px` and `980px` depending on screen type, and optional right rails between `320px` and `340px`.
- Tablet layout: Collapse low-priority rails first, reduce content padding to `24px`, preserve tap-safe card spacing, and move tertiary actions into overflow menus.
- Mobile layout: Hide the desktop sidebar, show the floating bottom navigation, increase vertical rhythm, keep composer and search entry points thumb reachable, and avoid more than one persistent side panel.
- Accessibility: All interactive controls require visible focus rings, keyboard traversal order, semantic headings, ESC-to-close for overlays, and screen-reader labels for icon-only controls.
- Contrast: All text-on-surface combinations should meet WCAG AA. Accent text on sapphire, gold, red, green, and violet surfaces must be checked against the dark slate background.
- Touch targets: Minimum 44x44px for taps, including FAB, icon buttons, toggle switches, navigation items, and modal dismiss actions.

## 4. Interaction Design
- Hover: Cards lift subtly, borders brighten, and actionable rows show contrast gain. Prototype patterns include tilt on room cards, hover glow on primary buttons, and tonal background shifts on pills and chips.
- Focus: Inputs use blue-outline treatment with a 3px soft glow. Icon buttons and tabs require matching keyboard-visible focus states.
- Loading: Page-level loads use skeleton cards or opacity transitions. Local actions use inline spinners or typing indicators rather than blocking the whole screen.
- Empty: Empty states should pair a clear zero-data explanation with one primary CTA and one educational hint.
- Success: Toasts are the default success channel for non-destructive actions. Long-running AI tasks should also expose completion state in-context.
- Error: Use inline field errors for validation failures, toast or banner errors for network failures, and preserve user-entered input wherever possible.
- Disabled: Disabled controls retain context text, reduce elevation, and expose the reason through helper copy or tooltip text.

## 5. State Management
- Initial state: Planner bootstrapping, calendar rendering, AI plan refreshing, modal open, save success, schedule conflict state.
- Loading state: Use skeleton cards or section placeholders instead of blank dark panels.
- Success state: Persist server-confirmed data, reconcile optimistic changes, and surface local confirmation through toast or inline label updates.
- Error state: Keep the current screen mounted, preserve user-entered data, and show context-specific recovery actions.
- Retry state: Offer section-level retry for widget failures and route-level retry for blocking failures.
- Offline/sync state: Cache last known good payload where safe, mark stale timestamps, and queue mutating actions only when idempotency is guaranteed.

## 6. Business Logic
- Screen logic:
- AI-generated sessions derive from deadline dates, progress, engagement, and free-time assumptions
- Manual deadlines re-trigger plan generation
- Calendar views must keep current month/week selection synchronized
- Data flow: All screens should hydrate from a bootstrap payload plus route-specific queries. Local UI state should remain shallow; durable entities should be normalized in a shared client store.
- User permissions: Permission checks must execute both on the client for rendering and on the server for enforcement.
- Feature visibility rules: Hidden or disabled states are preferred over hard removal when educational context matters, but prohibited capabilities must remain non-actionable.
- Role-based rendering: Instructor, moderator, student, and tenant-admin roles must map to distinct action matrices.

## 7. API Integration
- Required integration points:
- GET /api/v1/planner
- POST /api/v1/planner/replan
- POST /api/v1/deadlines
- POST /api/v1/planner/export
- Request/response contracts: Use versioned JSON APIs, typed error envelopes, request ids for traceability, and pagination tokens for lists.
- Error handling: Distinguish validation failure, permission failure, not found, rate limit, and transient upstream errors in both copy and telemetry.
- Retry logic: Safe GETs may retry with exponential backoff; mutations retry only when idempotency keys are present.
- Caching: Short-lived in-memory caching for list views, stronger memoization for bootstrap and static metadata, and cache busting after mutations that affect visible counts.

## 8. Edge Cases
- Overlapping AI sessions
- Manual deadline in the past
- Timezone shift moves a deadline across days
- Calendar provider export fails
- Accessibility edge cases: Keyboard-only navigation, reduced motion, zoom at 200%, screen-reader landmark navigation, and narrow viewport overflow must all be validated.
- Data edge cases: Empty lists, duplicate entities, archived entities, stale references, and cross-device concurrent updates must all render deterministically.

## Source Notes
- `uniboard-ai.html` contains the richer AI assistant, summary drawer, knowledge base, analytics, leaderboard, and saved-content surfaces.
- `uniboard-complete.html` contains the refined design system plus planner, reputation, AI suite modal, inline AI drafting, and AI learning profile surfaces.
- `New Text Document (2).txt` is empty and does not contribute product requirements.
- Where a prototype shows UI without real backend wiring, the documentation defines the minimum implementation contract required to make the visible behavior production ready.
