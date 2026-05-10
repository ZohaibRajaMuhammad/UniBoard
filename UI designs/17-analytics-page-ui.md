# Analytics Page UI

## Page Purpose
- Present activity trends, engagement patterns, and AI-derived risk insight.

## Visual Intent
- This page should feel data-rich, premium, and easy to scan under dense content.

## Layout Structure
- Wide analytical layout with multiple cards
- AI risk or insight card near the top
- Chart modules arranged in clean grid patterns

## Exact Spacing Tokens
- page section gap: 20px
- chart card gap: 16px
- chart card padding: 18px to 22px
- top insight card margin bottom: 16px

## Exact Component Composition Tree
AnalyticsPage
  AppShell
    Sidebar
    MainContent
      InsightCard
      ChartGrid
        ChartCard x N
      HeatmapCard?
    MobileBottomNav

## Core UI Components
- chart cards
- heatmap or activity matrix
- AI risk card
- trend summaries

## Responsive Behavior
- Desktop uses multi-card grid
- Tablet reduces to fewer columns
- Mobile stacks charts with strong section breaks

## Exact Breakpoint Rules
### Desktop
- Use wide multi-column charts where possible
- Keep AI insight near top for immediate scan value

### Tablet
- Reduce chart columns before shrinking labels
- Allow cards to expand vertically

### Mobile
- Single-column chart stack
- Use strong section spacing between cards

## Typography And Tone
- Analytical and intelligent, not decorative.

## Interaction And State Rules
- Use consistent hover, focus, loading, error, success, and disabled states.
- Preserve spacing rhythm even when modules collapse.
- Keep primary actions visually dominant over secondary actions.
- Maintain dark-surface contrast and readable metadata hierarchy.
- Avoid local one-off component variants unless the page has a strong structural reason.

## Implementation Notes
- Charts must remain understandable when compressed
- Labels must not become too faint
