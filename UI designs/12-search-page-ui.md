# Search Page UI

## Page Purpose
- Provide semantic and lexical search across rooms and knowledge artifacts.

## Visual Intent
- The page should feel like a high-quality academic retrieval surface, not a generic list page.

## Layout Structure
- Prominent search input at top
- AI semantic label or explanation near the search area
- Ranked results list below with strong excerpt hierarchy

## Exact Spacing Tokens
- search bar top margin: 8px
- search bar padding: 14px to 18px
- results gap: 12px
- result card padding: 14px to 18px
- meta chip gap: 6px

## Exact Component Composition Tree
SearchPage
  AppShell
    Sidebar
    MainContent
      SearchBar
      AiSemanticLabel
      ResultsList
        SearchResultCard x N
    MobileBottomNav

## Core UI Components
- search bar
- AI ranking label
- results cards
- room/type chips
- timestamps and relevance indicators

## Responsive Behavior
- Desktop allows generous excerpt width
- Tablet maintains readable result density
- Mobile stacks metadata cleanly under each result

## Exact Breakpoint Rules
### Desktop
- Use wide readable result cards
- Keep excerpts long enough to feel useful
- Preserve search bar dominance

### Tablet
- Maintain a strong content column
- Reduce non-essential horizontal metadata before shrinking excerpt width

### Mobile
- Single-column full-width results
- Move auxiliary metadata below excerpt as needed

## Typography And Tone
- Smart, precise, and academically useful.

## Interaction And State Rules
- Use consistent hover, focus, loading, error, success, and disabled states.
- Preserve spacing rhythm even when modules collapse.
- Keep primary actions visually dominant over secondary actions.
- Maintain dark-surface contrast and readable metadata hierarchy.
- Avoid local one-off component variants unless the page has a strong structural reason.

## Implementation Notes
- Search input must dominate the page
- Relevance should be visible but not visually louder than content
