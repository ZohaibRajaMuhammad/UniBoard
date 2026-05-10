# Dashboard Page UI

## Page Purpose
- Act as the academic home surface showing momentum, deadlines, room access, and AI briefing.

## Visual Intent
- This page should feel like an intelligent academic command center: fast to scan, rich, but calm.

## Layout Structure
- Fixed left sidebar
- Main content region with page padding 28px x 32px
- Top summary or AI briefing module
- Stat cards and deadline modules
- Room cards and digest modules below

## Exact Spacing Tokens
- sidebar width: 256px
- main page padding: 28px top / 32px sides
- section gap: 24px
- stat card grid gap: 16px
- room card grid gap: 16px to 20px
- AI briefing padding: 16px to 20px
- header bottom margin: 20px

## Exact Component Composition Tree
DashboardPage
  AppShell
    Sidebar
      BrandMark
      GlobalNav
      RoomList
      UserInfo
    MainContent
      PageHeader
      AiBriefingCard
      StatCardsRow
      DeadlinesSection
      RoomsSection
        RoomCard x N
      DigestOrSecondaryInsight
    MobileBottomNav

## Core UI Components
- sidebar nav
- room list
- AI briefing card
- stat cards
- deadline strips or cards
- room cards
- create room action
- mobile bottom nav

## Responsive Behavior
- Desktop preserves full sidebar and content grid
- Tablet collapses secondary density before reducing hierarchy
- Mobile stacks all modules and moves navigation to bottom floating shell

## Exact Breakpoint Rules
### Desktop
- Sidebar remains persistent
- Use 2 to 4 column internal card arrangement based on width
- Keep main content under a comfortable readable max width

### Tablet
- Sidebar may remain if width allows, otherwise reduce visual weight
- Stat cards may wrap to 2 columns
- Room cards shift to fewer columns before stacking

### Mobile
- Hide sidebar
- Show mobile bottom nav
- Stack AI briefing, stats, deadlines, and rooms vertically with 16px to 20px gaps

## Typography And Tone
- Analytical, premium, high-signal, never visually chaotic.

## Interaction And State Rules
- Use consistent hover, focus, loading, error, success, and disabled states.
- Preserve spacing rhythm even when modules collapse.
- Keep primary actions visually dominant over secondary actions.
- Maintain dark-surface contrast and readable metadata hierarchy.
- Avoid local one-off component variants unless the page has a strong structural reason.

## Implementation Notes
- The top AI or intelligence module must feel important but not dominant over urgent deadlines
- Room cards should remain visually rich even when stacked
