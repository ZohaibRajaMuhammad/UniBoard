# Reputation Page UI

## Page Purpose
- Represent academic standing, XP, expertise, streaks, achievements, and ranking.

## Visual Intent
- This page should feel prestigious, information-rich, and highly polished.

## Layout Structure
- Split layout with profile/achievements left and streak/leaderboard right
- strong hero card at the top
- XP progress and expertise modules
- achievements grid and recent activity feed

## Exact Spacing Tokens
- layout gap: 20px
- hero card padding: 20px to 24px
- achievement grid gap: 12px
- activity row padding: 12px to 14px
- right rail section gap: 14px

## Exact Component Composition Tree
ReputationPage
  AppShell
    Sidebar
    ReputationLayout
      LeftColumn
        ReputationHero
        XpProgress
        ExpertiseGrid
        AchievementsGrid
        RecentXpActivity
      RightColumn
        StreakCard
        LeaderboardHeader
        LeaderboardList
    MobileBottomNav

## Core UI Components
- reputation hero card
- XP bar
- expertise cards
- achievements grid
- recent XP activity
- streak card
- leaderboard filter and rows

## Responsive Behavior
- Desktop benefits from two-column authority layout
- Tablet reduces side density carefully
- Mobile stacks into a linear prestige narrative

## Exact Breakpoint Rules
### Desktop
- Use authoritative two-column split
- Keep hero and expertise in left primary column
- Use right rail for status and competitive context

### Tablet
- Reduce visual density before full stacking
- Keep hero full-width above split if needed

### Mobile
- Linear order: hero, XP, expertise, achievements, activity, streak, leaderboard
- Ensure score and rank remain readable in narrow widths

## Typography And Tone
- Prestige, transparency, and motivation.

## Interaction And State Rules
- Use consistent hover, focus, loading, error, success, and disabled states.
- Preserve spacing rhythm even when modules collapse.
- Keep primary actions visually dominant over secondary actions.
- Maintain dark-surface contrast and readable metadata hierarchy.
- Avoid local one-off component variants unless the page has a strong structural reason.

## Implementation Notes
- Do not let the page become visually noisy
- Keep score explanation readable and trustworthy
