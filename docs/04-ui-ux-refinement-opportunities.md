# UI UX Refinement Opportunities

## 1. Highest Priority Mismatches

### Room Settings Naming Mismatch

Problem:

- room header exposes `Room settings`
- destination is currently read-only metadata

Refine by:

- either making the page editable
- or renaming it to `Room overview`

### Global Settings Placeholder

Problem:

- settings is reachable from persistent navigation
- destination contains no usable controls

Refine by:

- hiding it until real controls exist
- or shipping minimal notification and profile preference controls first

### Announcement Selection For Students

Problem:

- composer exposes `Announcement` to all users
- backend rejects non-teacher submission

Refine by:

- hiding or disabling the option for unauthorized users
- adding tooltip text if visible but restricted

### Anonymous Ownership Gap

Problem:

- anonymous authors cannot later edit/delete/resolve via ownership logic

Refine by:

- keeping internal ownership while sanitizing only public rendering
- or explicitly stating that anonymous posts cannot be managed later by original author

## 2. Navigation Refinements

### Add Search To Mobile Primary Navigation Or Header

Current issue:

- search is a major feature but not a top-level mobile tab

Possible refinements:

- swap profile for search on mobile if search is more core
- or add a floating search entry in key screens

### Clarify Room Discovery Actions

Current issue:

- room card click and `Join room` button represent different intents

Possible refinements:

- add `Preview` vs `Join`
- or make card itself the join action and use a details icon/button for preview

## 3. Room Screen Refinements

### Better Pinned Content Navigation

Current issue:

- pinned banner shows snippets but does not jump to post in feed

Refine by:

- making pinned cards scroll to or open the full post context

### Filter Persistence

Current issue:

- feed filters live only in component state

Refine by:

- using URL query params so sharing and refresh preserve filter state

### Composer Context Awareness

Current issue:

- composer does not proactively adapt to room rules or user permissions

Refine by:

- disable anonymity toggle when room disallows anonymous posting
- suppress announcement type for students
- show short room policy hints inline

## 4. Notification Refinements

### Add Destination Links

Each notification should ideally support:

- click to room
- optionally jump to post
- optional mark-as-read on click

### Add Per-Item Actions

Useful additions:

- mark read
- open source room
- filter by type

## 5. Search Refinements

### Jump To Exact Result

Current issue:

- results open room only

Refine by:

- supporting post anchor deep links
- highlighting matched post after navigation

### Ranking And Snippets

Current issue:

- simple inclusion filtering only

Refine by:

- ranking title/tag matches above body matches
- highlighting matched terms
- truncating content around matched segment instead of showing raw full content block

## 6. Moderation Refinements

### Make Teacher Panel Reachable On Smaller Screens

Current issue:

- moderation panel is hidden below `2xl`

Refine by:

- collapsing it into a drawer
- or exposing a `Moderation` button in room header for eligible roles

### Surface More Existing Backend Actions

Backed by existing server logic:

- unmute
- ban
- unban
- promote moderator
- demote moderator

## 7. Profile And Personal Utility Refinements

### Turn Profile Into A Personal Control Center

Potential sections:

- editable name/bio/department
- notification preferences
- saved posts collections
- contribution stats

### Improve Saved Post UX

Current issue:

- saved posts appear only in profile
- no visual "saved" state on originating post card

Refine by:

- toggled saved icon state in post menu or card
- dedicated `Saved` view or filter

## 8. Empty State Refinements

The app already has decent empty states, but several could become more actionable.

Examples:

- dashboard no rooms: add direct `Create room` and `Browse rooms` buttons
- notifications empty: explain when notifications are generated
- settings placeholder: remove until useful

## 9. Good Existing UX Patterns To Preserve

- strong room identity header
- split between operational metrics and content feed
- bottom composer anchored in room context
- concise, chip-based metadata presentation
- lightweight but useful presence bar
- optimistic upvote feedback
- shallow comments threading for readability

## 10. Recommended Documentation Use

If the next goal is UI refinement only, use the docs in this order:

1. read [01-app-shell-and-navigation.md](/C:/Users/Wajiz.pk/.vscode/Anonymous/docs/01-app-shell-and-navigation.md)
2. read [02-screen-by-screen-ui-guide.md](/C:/Users/Wajiz.pk/.vscode/Anonymous/docs/02-screen-by-screen-ui-guide.md)
3. validate assumptions against [03-feature-logic-and-interaction-model.md](/C:/Users/Wajiz.pk/.vscode/Anonymous/docs/03-feature-logic-and-interaction-model.md)
4. use this file as the first-pass UX backlog

The most important rule for future refinement is to preserve the product’s strongest trait: it feels like an academic operations workspace, not a generic social feed.
