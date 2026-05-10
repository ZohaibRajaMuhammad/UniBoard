# Saved Page UI

## Page Purpose
- Provide a personal archive of bookmarked academic content.

## Visual Intent
- This page should feel simple, private, and retrieval-friendly.

## Layout Structure
- List of saved items with source metadata
- strong empty state when nothing is saved

## Exact Spacing Tokens
- list gap: 12px
- card padding: 16px to 18px
- empty state top margin: 40px

## Exact Component Composition Tree
SavedPage
  AppShell
    Sidebar
    MainContent
      SavedList | EmptyState
        SavedCard x N
    MobileBottomNav

## Core UI Components
- saved content cards
- unsave action
- source room/type metadata

## Responsive Behavior
- Desktop and mobile both work well as stacked lists
- Mobile should favor clear open targets

## Exact Breakpoint Rules
### Desktop
- Single readable column with comfortable card width

### Tablet
- Maintain same list-first model with minor padding reduction

### Mobile
- Full-width stacked cards with generous tap spacing

## Typography And Tone
- Quiet and utility-focused.

## Interaction And State Rules
- Use consistent hover, focus, loading, error, success, and disabled states.
- Preserve spacing rhythm even when modules collapse.
- Keep primary actions visually dominant over secondary actions.
- Maintain dark-surface contrast and readable metadata hierarchy.
- Avoid local one-off component variants unless the page has a strong structural reason.

## Implementation Notes
- Empty states matter here
- Saved cards should remain easy to scan and reopen
