# Settings Page UI

## Page Purpose
- Give users control over preferences, privacy, notifications, and AI behavior.

## Visual Intent
- The page should feel controlled and trustworthy.

## Layout Structure
- Section headers with grouped settings rows
- Label left, control right layout
- AI settings called out with subtle emphasis

## Exact Spacing Tokens
- section header margin bottom: 14px
- row vertical padding: 15px
- row border spacing: 1px separators
- group gap: 24px

## Exact Component Composition Tree
SettingsPage
  AppShell
    Sidebar
    MainContent
      SettingsGroup x N
        GroupTitle
        SettingsRow x N
          LabelBlock
          Control
    MobileBottomNav

## Core UI Components
- settings rows
- toggles
- helper descriptions
- save or immediate-persist behavior

## Responsive Behavior
- Desktop uses wide settings rows
- Mobile stacks labels and controls without losing clarity

## Exact Breakpoint Rules
### Desktop
- Keep label and toggle on one line where comfortable
- Allow long descriptions to wrap beneath labels

### Tablet
- Keep settings rows readable before stacking controls
- Reduce horizontal padding carefully

### Mobile
- Stack control under label if width is tight
- Keep toggles right-aligned only when space permits

## Typography And Tone
- Utility-first, clear, and operational.

## Interaction And State Rules
- Use consistent hover, focus, loading, error, success, and disabled states.
- Preserve spacing rhythm even when modules collapse.
- Keep primary actions visually dominant over secondary actions.
- Maintain dark-surface contrast and readable metadata hierarchy.
- Avoid local one-off component variants unless the page has a strong structural reason.

## Implementation Notes
- Make policy-locked states obvious
- Avoid dense walls of text
