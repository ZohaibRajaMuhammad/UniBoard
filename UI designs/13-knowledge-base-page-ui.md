# Knowledge Base Page UI

## Page Purpose
- Let users ask direct course questions and receive grounded AI answers.

## Visual Intent
- This page should feel more like an academic answer console than a chat room.

## Layout Structure
- Main input area at top
- AI answer panel below
- source references below the answer text

## Exact Spacing Tokens
- input bottom margin: 16px
- answer card padding: 16px to 18px
- source chip gap: 6px
- answer line height should remain generous under long text

## Exact Component Composition Tree
KnowledgeBasePage
  AppShell
    Sidebar
    MainContent
      QueryInput
      AnswerCard
        AnswerLabel
        AnswerBody
        SourceLinks
    MobileBottomNav

## Core UI Components
- question input
- answer card
- answer label
- source chips or links

## Responsive Behavior
- Desktop preserves clean vertical flow
- Tablet compresses width but keeps answer readability
- Mobile turns answer blocks into stacked cards with large tap-friendly source rows

## Exact Breakpoint Rules
### Desktop
- Keep answer body wide and readable
- Allow source row to wrap cleanly

### Tablet
- Preserve vertical clarity
- Do not compress answer line height

### Mobile
- Use full-width stacked answer panel
- Make sources large enough to tap accurately

## Typography And Tone
- High-trust, grounded, and study-focused.

## Interaction And State Rules
- Use consistent hover, focus, loading, error, success, and disabled states.
- Preserve spacing rhythm even when modules collapse.
- Keep primary actions visually dominant over secondary actions.
- Maintain dark-surface contrast and readable metadata hierarchy.
- Avoid local one-off component variants unless the page has a strong structural reason.

## Implementation Notes
- Answer panel must remain readable for longer content
- Source visibility is mandatory for trust
