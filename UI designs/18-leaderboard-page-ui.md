# Leaderboard Page UI

## Page Purpose
- Show rankings and academic competition in a polished, motivating way.

## Visual Intent
- The page should feel rewarding and slightly prestigious, but still academic.

## Layout Structure
- Top-ranked users highlighted above the list
- Main ranked list below
- Optional filters for scope or timeframe

## Exact Spacing Tokens
- podium bottom margin: 20px
- row gap: 8px
- row padding: 12px to 16px
- filter gap: 8px

## Exact Component Composition Tree
LeaderboardPage
  AppShell
    Sidebar
    MainContent
      FilterRow?
      TopRanks
      LeaderboardList
        LeaderboardRow x N
    MobileBottomNav

## Core UI Components
- podium or highlight band
- leaderboard rows
- scope filter

## Responsive Behavior
- Desktop can show richer metadata in each row
- Mobile keeps rank, avatar, name, and score clear without clutter

## Exact Breakpoint Rules
### Desktop
- Allow podium or top-rank block above list
- Use comfortable row width for metadata

### Tablet
- Simplify row metadata before shrinking avatar/name area
- Keep scores aligned

### Mobile
- Reduce to compact rows
- Stack secondary metadata under primary identity when needed

## Typography And Tone
- Prestige-driven but not flashy.

## Interaction And State Rules
- Use consistent hover, focus, loading, error, success, and disabled states.
- Preserve spacing rhythm even when modules collapse.
- Keep primary actions visually dominant over secondary actions.
- Maintain dark-surface contrast and readable metadata hierarchy.
- Avoid local one-off component variants unless the page has a strong structural reason.

## Implementation Notes
- Gold and blue accents should signal achievement without overpowering readability
