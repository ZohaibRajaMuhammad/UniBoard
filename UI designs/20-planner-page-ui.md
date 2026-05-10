# Planner Page UI

## Page Purpose
- Turn deadlines and AI planning into a calendar-driven academic scheduling surface.

## Visual Intent
- This page should feel like a premium study operations console.

## Layout Structure
- Split layout: calendar left, right rail for AI plan and deadlines
- stats strip above calendar
- month/week controls near top
- manual deadline CTA below deadline list

## Exact Spacing Tokens
- planner grid columns: main 1fr + right rail 340px
- overall gap: 20px
- header padding: 22px to 28px
- stats strip gap: 12px
- calendar cell padding: compact but readable
- right rail section gap: 14px
- AI plan card padding: 16px to 18px

## Exact Component Composition Tree
PlannerPage
  AppShell
    Sidebar
    PlannerLayout
      PlannerLeft
        StatsStrip
        CalendarHeader
        MonthWeekToggle
        CalendarGrid
      PlannerRight
        AiPlanCard
        UpcomingDeadlines
        AddDeadlineAction
        TodaysSessions
    MobileBottomNav

## Core UI Components
- planner stats
- calendar nav
- month/week toggle
- calendar grid
- AI plan card
- deadline list
- add deadline CTA

## Responsive Behavior
- Desktop fully uses split layout
- Tablet may reduce rail width or stack secondary modules
- Mobile should stack calendar, plan card, and deadlines in a clear sequence

## Exact Breakpoint Rules
### Desktop
- Use full split layout with 340px right rail
- Keep calendar dominant but not oversized relative to planning rail
- Maintain strong scanning from stats to calendar to plan

### Tablet
- Reduce right rail width or stack lower-priority rail blocks
- Keep calendar controls in a single controlled header row if possible

### Mobile
- Stack in this order: stats, controls, calendar, AI plan, deadlines, sessions
- Convert calendar to simpler stacked weekly/monthly blocks if needed

## Typography And Tone
- Strategic, intelligent, and high-value.

## Interaction And State Rules
- Use consistent hover, focus, loading, error, success, and disabled states.
- Preserve spacing rhythm even when modules collapse.
- Keep primary actions visually dominant over secondary actions.
- Maintain dark-surface contrast and readable metadata hierarchy.
- Avoid local one-off component variants unless the page has a strong structural reason.

## Implementation Notes
- Maintain very strong urgency hierarchy
- The AI plan should feel useful, not ornamental
