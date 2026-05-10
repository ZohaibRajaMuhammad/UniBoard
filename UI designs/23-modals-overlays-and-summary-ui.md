# Modals, Overlays, And Summary UI

## Covered Surfaces
- Create room modal
- Add deadline modal
- AI summary drawer
- AI suite overlay
- any blurred fullscreen overlay state

## Modal Style
- Dark glass panel
- Rounded large corners
- Blurred dark overlay backdrop
- Strong header/body/footer rhythm

## Summary Drawer Style
- Feels like an intelligent sidecar or bottom-sheet insight module
- Must remain clearly separate from the main feed
- Should highlight AI-generated summary text and key points cleanly

## Interaction Rules
- ESC closes
- click outside closes if safe
- primary CTA in footer
- destructive actions visually separated

## Responsive Rules
- Desktop: centered modal or anchored side panel
- Tablet: centered but slightly wider relative to viewport
- Mobile: convert to full-width sheet or near-fullscreen modal

## Quality Rules
- Never let overlays obscure whether the user can recover their prior state
- Never hide close actions
- Always preserve internal spacing clarity even on smaller screens
