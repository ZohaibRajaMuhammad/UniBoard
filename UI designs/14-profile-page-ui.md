# Profile Page UI

## Page Purpose
- Represent personal identity, account details, and academic posture.

## Visual Intent
- The page should feel credible and organized, with quiet prestige.

## Layout Structure
- Identity card or hero section at top
- Details and editable fields below
- Optional AI learning profile insights in secondary cards

## Exact Spacing Tokens
- hero card padding: 20px to 24px
- section gap: 18px to 24px
- field row padding: 10px to 12px vertical
- card gap: 16px

## Exact Component Composition Tree
ProfilePage
  AppShell
    Sidebar
    MainContent
      ProfileHero
      DetailsCard
      LearningProfileCard?
    MobileBottomNav

## Core UI Components
- avatar block
- name and email rows
- profile fields
- AI learning profile module

## Responsive Behavior
- Desktop can show multiple cards side by side if needed
- Mobile should stack into one clear reading flow

## Exact Breakpoint Rules
### Desktop
- Allow side-by-side cards only if content remains readable
- Keep profile hero visually primary

### Tablet
- Prefer stacking after moderate width reduction
- Do not make field rows too dense

### Mobile
- Single-column stacked profile narrative
- Increase spacing between cards for touch readability

## Typography And Tone
- Polished, personal, but not overly social.

## Interaction And State Rules
- Use consistent hover, focus, loading, error, success, and disabled states.
- Preserve spacing rhythm even when modules collapse.
- Keep primary actions visually dominant over secondary actions.
- Maintain dark-surface contrast and readable metadata hierarchy.
- Avoid local one-off component variants unless the page has a strong structural reason.

## Implementation Notes
- Keep editable vs non-editable fields obvious
- The page should feel more professional than playful
