# Room Settings Page UI

## Page Purpose
- Support administrative control over room metadata and room policy.

## Visual Intent
- This page should feel administrative, stable, and structured.

## Layout Structure
- Two-card or two-column layout: metadata and policy controls
- Save action placed at the end of the policy section

## Exact Spacing Tokens
- layout gap: 18px
- card padding: 22px to 24px
- settings row padding: 12px vertical
- save CTA top margin: 16px

## Exact Component Composition Tree
RoomSettingsPage
  AppShell
    Sidebar
    MainContent
      MetadataCard
      PolicyCard
        PolicyRow x N
        SaveButton
    MobileBottomNav

## Core UI Components
- metadata card
- settings toggles
- save button

## Responsive Behavior
- Desktop benefits from two-column split
- Mobile stacks cards vertically with save CTA kept visible near the end

## Exact Breakpoint Rules
### Desktop
- Use side-by-side cards where width allows
- Keep metadata and policy visually distinct

### Tablet
- Reduce to stacked cards before internal compression
- Preserve row legibility

### Mobile
- Single-column admin stack
- Keep save CTA close to policy controls

## Typography And Tone
- Administrative, clear, and low-ambiguity.

## Interaction And State Rules
- Use consistent hover, focus, loading, error, success, and disabled states.
- Preserve spacing rhythm even when modules collapse.
- Keep primary actions visually dominant over secondary actions.
- Maintain dark-surface contrast and readable metadata hierarchy.
- Avoid local one-off component variants unless the page has a strong structural reason.

## Implementation Notes
- Policy descriptions must remain legible
- The page should feel separate from student-facing feed surfaces
