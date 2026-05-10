# Notifications Page UI

## Page Purpose
- Show actionable alerts in a clean, low-friction list.

## Visual Intent
- The page should feel quiet and operational, not noisy.

## Layout Structure
- Single-column notification list
- Compact header and filter row
- Each item shows icon, summary, timestamp, and unread treatment

## Exact Spacing Tokens
- page header margin bottom: 16px
- filter row gap: 10px
- notification list gap: 8px to 10px
- row internal padding: 14px to 16px
- icon-to-body gap: 12px

## Exact Component Composition Tree
NotificationsPage
  AppShell
    Sidebar
    MainContent
      HeaderRow
      FilterTabs
      NotificationList
        NotificationRow x N
    MobileBottomNav

## Core UI Components
- filter tabs
- notification rows
- unread indicators
- deep-link behavior

## Responsive Behavior
- Desktop and tablet remain list-first
- Mobile increases row height and spacing for tap accuracy

## Exact Breakpoint Rules
### Desktop
- Keep a readable single-column list with comfortable row width
- Allow compact metadata alignment

### Tablet
- Maintain single-column flow
- Slightly increase row height if text wraps

### Mobile
- Increase row tap size
- Stack metadata under message when width tightens

## Typography And Tone
- Calm, efficient, and utility-driven.

## Interaction And State Rules
- Use consistent hover, focus, loading, error, success, and disabled states.
- Preserve spacing rhythm even when modules collapse.
- Keep primary actions visually dominant over secondary actions.
- Maintain dark-surface contrast and readable metadata hierarchy.
- Avoid local one-off component variants unless the page has a strong structural reason.

## Implementation Notes
- Prioritize readability and urgency labeling over decorative graphics
- Unread states should be visible without overwhelming the list
