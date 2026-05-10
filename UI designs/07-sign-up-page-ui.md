# Sign Up Page UI

## Page Purpose
- Create a new account with institutional credibility and strong guidance.

## Visual Intent
- The page should feel trustworthy and structured, with enough explanation for academic onboarding.

## Layout Structure
- Centered registration card
- Title and supporting copy at top
- Full form body with stacked fields
- Terms/support text near CTA

## Exact Spacing Tokens
- page shell padding: 24px
- card max width: 440px
- card padding: 24px to 28px
- field gap: 14px
- helper text gap: 4px
- CTA top margin: 16px
- footer switch margin top: 12px

## Exact Component Composition Tree
SignUpPage
  BackAction
  AuthCard
    TitleBlock
    RegistrationForm
      NameField
      UniversityEmailField
      PasswordField
      SubmitButton
    ExistingAccountFooter

## Core UI Components
- name field
- university email field
- password field
- account creation CTA
- switch-to-sign-in link

## Responsive Behavior
- Desktop uses centered form with stable max width
- Tablet reduces card margins slightly
- Mobile increases vertical separation between inputs for readability

## Exact Breakpoint Rules
### Desktop
- Keep centered fixed-width registration shell
- Avoid adding secondary marketing modules

### Tablet
- Preserve card width until viewport forces near-full-width behavior
- Keep helper copy short and stacked

### Mobile
- Use full-width card with safe edge padding
- Increase vertical gap between fields to 16px if needed
- Keep CTA easy to reach

## Typography And Tone
- More guided than sign-in, but still refined and concise.

## Interaction And State Rules
- Use consistent hover, focus, loading, error, success, and disabled states.
- Preserve spacing rhythm even when modules collapse.
- Keep primary actions visually dominant over secondary actions.
- Maintain dark-surface contrast and readable metadata hierarchy.
- Avoid local one-off component variants unless the page has a strong structural reason.

## Implementation Notes
- Domain guidance and password guidance must fit without clutter
- Keep field labels explicit
- Error states should not collapse layout
