# Rooms Discovery Page UI

## Page Purpose
- Help users find and join academic rooms through a clean discovery experience.

## Visual Intent
- The page should feel searchable, structured, and lightly exploratory.

## Layout Structure
- Header and subtitle at top
- Search bar below header
- Grid or stacked room cards below
- Optional create-room action

## Exact Spacing Tokens
- page header bottom margin: 16px
- search bar padding: 11px to 16px
- search-to-grid gap: 22px
- room card gap: 16px to 20px
- card internal padding: 18px to 22px

## Exact Component Composition Tree
RoomsDiscoveryPage
  AppShell
    Sidebar
    MainContent
      HeaderBlock
      SearchBar
      CreateRoomAction?
      RoomGrid
        RoomCard x N
    MobileBottomNav

## Core UI Components
- page header
- room search bar
- room discovery cards
- join/open CTA
- create room CTA

## Responsive Behavior
- Desktop uses multi-column room card grid
- Tablet reduces columns
- Mobile uses single-column cards with spacious vertical rhythm

## Exact Breakpoint Rules
### Desktop
- Use 3 to 4 cards per row depending on width
- Keep search bar near top and full-width within content zone

### Tablet
- Reduce to 2 columns
- Keep search width full and dominant

### Mobile
- Single-column stacked cards
- Move create action below search if needed
- Preserve generous vertical rhythm

## Typography And Tone
- Straightforward and academic, with enough polish to feel premium.

## Interaction And State Rules
- Use consistent hover, focus, loading, error, success, and disabled states.
- Preserve spacing rhythm even when modules collapse.
- Keep primary actions visually dominant over secondary actions.
- Maintain dark-surface contrast and readable metadata hierarchy.
- Avoid local one-off component variants unless the page has a strong structural reason.

## Implementation Notes
- Keep room chips and metadata easy to scan
- Search should remain visually prominent
