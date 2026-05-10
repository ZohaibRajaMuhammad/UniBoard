# AI Assistant UI

## Purpose
- The AI assistant is the always-available academic copilot.
- It should feel embedded in the product ecosystem, not like a separate chatbot product.

## Entry Pattern
- Floating action button in the lower-right zone on desktop
- Visible when inside the authenticated app shell
- Compact pulse animation allowed

## Panel Structure
- Header with status dot, title, model tag, and close action
- Scrollable message area
- Quick-action row for common AI intents
- Input row at bottom

## Visual Tone
- Slightly more luminous than standard system panels
- Still consistent with the dark slate palette
- Blue and violet accents are appropriate here

## Message Design
- Assistant messages: neutral dark bubble
- User messages: blue-tinted bubble
- Strong distinction between speaker types
- Typing state should be subtle

## Responsive Rules
- Desktop can use floating panel anchored to the FAB
- Tablet may reduce width but keep floating behavior
- Mobile should use a larger overlay or bottom-sheet style if the floating panel becomes cramped

## Required States
- closed
- open
- sending
- typing
- answered
- timeout
- unavailable
- low-confidence

## AI Trust Rules
- Always label AI clearly
- Do not visually imply certainty when confidence is low
- Fallback states must look intentional, not broken
