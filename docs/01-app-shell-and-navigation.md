# App Shell And Navigation

## 1. Global Shell

The application uses a dark, immersive shell with blue brand emphasis. The visual language is consistent across landing, dashboard, room, and utility screens.

Core shell characteristics:

- background is a layered dark gradient, not a flat black
- panels use blurred glass cards with thin translucent borders
- spacing is fluid through CSS variables rather than fixed only at Tailwind breakpoints
- focus styling is present globally through `:focus-visible`
- touch targets are intentionally padded through reusable classes like `touch-target`
- safe-area insets are respected for mobile devices

The top-level wrapper is defined in [src/app/layout.tsx](/C:/Users/Wajiz.pk/.vscode/Anonymous/src/app/layout.tsx). The visual foundation lives in [src/app/globals.css](/C:/Users/Wajiz.pk/.vscode/Anonymous/src/app/globals.css).

## 2. Typography And Spacing System

The app uses `Manrope` and a fluid token system:

- `--text-fluid-xs` through `--text-fluid-hero`
- `--space-page-x` and `--space-page-y`
- `--radius-panel` and `--radius-card`

This means layout rhythm is not purely breakpoint-based. Pages scale smoothly across viewport widths.

UX implication:

- the system already supports a polished responsive feel
- refinement should preserve token-driven spacing rather than replacing it with one-off hardcoded values

## 3. Dashboard Shell Structure

Authenticated app routes use [src/app/(dashboard)/layout.tsx](/C:/Users/Wajiz.pk/.vscode/Anonymous/src/app/(dashboard)/layout.tsx).

Shell behavior:

- left sidebar is visible on `lg` and above
- main content occupies the flexible center region
- mobile bottom navigation is fixed and always present on smaller screens
- main content gets bottom padding on mobile so the fixed nav does not cover content

Spatial model:

- desktop: left persistent rail, main content center, optional right panel in room detail for teachers
- mobile: no left rail, fixed floating bottom bar, content scrolls under a reserved bottom area

## 4. Sidebar Anatomy

The sidebar is implemented in [src/components/layout/Sidebar.tsx](/C:/Users/Wajiz.pk/.vscode/Anonymous/src/components/layout/Sidebar.tsx).

Section order from top to bottom:

1. Brand header
2. Search entry link
3. Main navigation
4. Rooms heading with create button
5. Scrollable room list
6. Account card with Clerk user button and settings button

### 4.1 Brand Header

Placement:

- top of sidebar
- full width
- separated by bottom border

Contents:

- left: square brand tile with icon
- center: product name `UniBoard` and sublabel `Academic command center`
- right: total unread room count badge when non-zero

UX role:

- establishes identity and system status immediately
- unread badge at brand level reinforces "inbox/workspace" framing

### 4.2 Search Entry Link

Placement:

- directly below brand header
- inside its own bordered section

Behavior:

- visually styled like an input
- actually navigates to `/search`
- includes search icon on left and placeholder-like helper text

UX implication:

- good for discoverability
- not ideal if users expect inline quick search behavior
- current pattern says "search is a dedicated screen", not "search anywhere in place"

### 4.3 Primary Nav

Current links:

- `Dashboard`
- `Notifications`

Placement:

- below the search entry
- vertically stacked
- active state shown via stronger background and white text

Badges:

- notifications item shows unread count if non-zero

### 4.4 Rooms Section Header

Placement:

- between primary nav and room list
- left aligned `Rooms` eyebrow label
- right aligned small icon button with plus symbol

Button meaning:

- opens create room modal
- this is a high-priority creation shortcut for desktop users

### 4.5 Room List

Behavior:

- scrollable within sidebar
- each room item shows emoji, room name, and unread badge
- active room is highlighted
- empty state shows a dashed container with `No rooms joined yet.`

Important UX point:

- rooms are treated as first-class operational spaces, not secondary destinations
- unread counts per room support triage behavior

### 4.6 Account Card

Placement:

- pinned at bottom
- separated by top border

Contents:

- Clerk `UserButton`
- account text block
- settings icon button linking to `/settings`

UX role:

- account controls are intentionally de-emphasized compared to room navigation
- this supports product focus on shared academic activity rather than profile-centric behavior

## 5. Mobile Bottom Navigation

Implemented in [src/components/layout/MobileNav.tsx](/C:/Users/Wajiz.pk/.vscode/Anonymous/src/components/layout/MobileNav.tsx).

Placement:

- fixed near bottom
- inset from left and right
- floating rounded container rather than full-width edge-to-edge tab bar

Tabs:

- `Home` -> `/dashboard`
- `Rooms` -> `/rooms`
- `Alerts` -> `/notifications`
- `Profile` -> `/profile`

Badge behavior:

- `Rooms` shows total unread room count
- `Alerts` shows unread notification count
- values over 9 collapse to `9+`

UX implications:

- mobile prioritizes the four most important actions
- search is not top-level on mobile; it must be reached by sidebar on desktop or other navigation paths, which is a discoverability gap
- settings is not exposed directly in mobile bottom navigation

## 6. Room Detail Shell

Room detail uses a more complex layout than general pages.

Order from top to bottom:

1. Room header
2. Presence bar if active users exist
3. Stats and feed filters strip
4. Pinned posts banner if any pinned posts exist
5. Scrollable post feed
6. Bottom composer

Desktop teacher view adds:

- right moderation panel visible only on very large screens `2xl`

UX implication:

- the room page is the real product core
- everything else is supporting navigation, discovery, and personal utility

## 7. Reusable Surface Patterns

The UI repeatedly uses these patterns:

- `glass-panel` for major surfaces
- `stat-card` for metric blocks
- `panel-chip` for metadata and filter chips
- rounded cards with strong radius values
- subtle hover lift on click targets like room cards

These patterns create a consistent hierarchy:

- hero or spotlight card for page headline
- stat cards for concise numeric or categorical facts
- list cards for navigable objects
- utility chips for metadata

## 8. Accessibility And Input Behavior

Current positives:

- skip link exists
- focus-visible styling exists globally
- touch-target sizing is intentionally considered
- input font size avoids iOS zoom behavior
- reduced motion preference is respected

Current gaps:

- several custom popovers and menus do not appear to manage focus robustly
- some icon-only controls rely on visual familiarity rather than rich labels
- several action confirmations are absent for destructive actions

## 9. Responsive Behavior Summary

Desktop:

- sidebar anchors navigation
- content is framed and centered
- room detail can expand into a three-zone mental model: left nav, center conversation, right moderation

Tablet:

- sidebar disappears before teacher panel becomes relevant
- content becomes single-column more often

Mobile:

- bottom navigation becomes primary
- page content must remain concise because the composer and bottom bar compete for space
- room feed and post composer are the highest-risk zones for cramped interaction density
