# Landing Page UI

## Page Purpose
- Introduce UniBoard as a premium academic intelligence product and drive sign-up conversion.

## Visual Intent
- The page should feel premium, clear, and academically serious. It is a product showcase, not a playful marketing splash.

## Layout Structure
- Top marketing header with logo left and auth CTAs right
- Hero content block with strong headline, supportive copy, and primary CTA
- Supporting value cards below hero showing deadlines, rooms, and AI assistance
- Max width container around 1280px to 1320px

## Exact Spacing Tokens
- page outer padding: 24px desktop / 20px tablet / 16px mobile
- header vertical spacing: 20px
- hero top margin: 32px to 48px
- hero content max width: 500px
- feature card gap: 16px
- CTA gap: 12px

## Exact Component Composition Tree
LandingPage
  MarketingHeader
    BrandLogo
    AuthActions
  HeroSection
    Eyebrow
    Headline
    SupportingCopy
    PrimaryCtaRow
  ValueGrid
    ValueCard x N

## Core UI Components
- brand mark
- sign in button
- get started button
- hero CTA
- value proposition cards

## Responsive Behavior
- Desktop keeps a clean two-zone hero balance
- Tablet keeps the hero stacked but spacious
- Mobile stacks hero text, CTA, then value cards with generous vertical spacing

## Exact Breakpoint Rules
### Desktop
- Use centered max-width marketing shell
- Keep feature cards in a multi-column row when width allows
- Leave enough negative space around hero text

### Tablet
- Collapse wide hero balance into stacked content
- Reduce horizontal padding before shrinking typography
- Keep CTA row intact if width permits

### Mobile
- Single-column flow
- Value cards become full-width stacked blocks
- Keep headline, copy, and CTA visible in one reading sweep

## Typography And Tone
- Large headline, soft supporting copy, high trust, low noise.

## Interaction And State Rules
- Use consistent hover, focus, loading, error, success, and disabled states.
- Preserve spacing rhythm even when modules collapse.
- Keep primary actions visually dominant over secondary actions.
- Maintain dark-surface contrast and readable metadata hierarchy.
- Avoid local one-off component variants unless the page has a strong structural reason.

## Implementation Notes
- Keep hero above the fold on common laptop sizes
- Avoid overcrowding with too many marketing blocks
- Preserve premium dark-mode polish
