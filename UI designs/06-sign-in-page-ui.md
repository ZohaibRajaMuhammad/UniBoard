# Sign In Page UI

## Page Purpose
- Authenticate returning users through a focused, low-distraction form.

## Visual Intent
- The page should feel secure, calm, and efficient. It should reduce friction and build confidence.

## Layout Structure
- Centered auth card
- Back action above or near the card
- Vertical form stack
- Clear submit area and account-switch text below

## Exact Spacing Tokens
- page shell padding: 24px
- card max width: 420px to 440px
- card padding: 24px to 28px
- field gap: 14px
- label-to-input gap: 6px
- action area top margin: 18px
- footer helper top margin: 14px

## Exact Component Composition Tree
SignInPage
  BackAction
  AuthCard
    TitleBlock
    Form
      EmailField
      PasswordField
      ForgotPasswordLink
      SubmitButton
    SwitchAccountFooter

## Core UI Components
- email field
- password field
- forgot password link
- primary submit button
- switch-to-sign-up link

## Responsive Behavior
- Desktop keeps the card centered with strong breathing room
- Tablet preserves centered layout with slightly tighter padding
- Mobile expands card width and increases touch-friendly spacing

## Exact Breakpoint Rules
### Desktop
- Keep form card visually centered in viewport
- Allow wide side breathing room
- Preserve fixed readable card width

### Tablet
- Reduce card margin before reducing internal padding
- Maintain centered form rhythm

### Mobile
- Card spans most available width with safe margins
- Increase tap spacing between controls
- Keep submit button full-width if needed

## Typography And Tone
- Compact but elegant, with restrained typography and strong contrast.

## Interaction And State Rules
- Use consistent hover, focus, loading, error, success, and disabled states.
- Preserve spacing rhythm even when modules collapse.
- Keep primary actions visually dominant over secondary actions.
- Maintain dark-surface contrast and readable metadata hierarchy.
- Avoid local one-off component variants unless the page has a strong structural reason.

## Implementation Notes
- Never overwhelm with extra chrome
- Keep validation inline and immediate
- Loading state must clearly lock submission
