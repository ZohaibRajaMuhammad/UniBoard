# Screen By Screen UI Guide

## 1. Landing Page `/`

Source: [src/app/page.tsx](/C:/Users/Wajiz.pk/.vscode/Anonymous/src/app/page.tsx)

### Screen Purpose

This is a conversion and framing page. It explains the product in operational terms and directs unauthenticated users into sign-up or sign-in.

### Visual Composition

Main layout:

- full-screen hero
- split two-column structure on large screens
- left side is narrative and CTA heavy
- right side is a mock product preview made of stacked cards

### Section Breakdown

Topmost layer:

- ambient grid texture in background
- subtle top gradient wash

Left hero card:

- chip-like intro label near top
- massive headline
- supporting paragraph
- primary CTA `Start with your class`
- secondary CTA `Sign in`
- three value cards in a small internal grid

Right preview stack:

- `Live room pulse` overview card
- `Unread pull` stat card
- `Deadline pressure` stat card
- `Posting modes` card

### Button Placement

- primary action sits left in CTA row
- secondary action sits right on desktop, stacked below on mobile

### UX Notes

- strong first impression
- high message density but still structured
- preview cards communicate product shape without requiring screenshots
- there is no tertiary information architecture such as FAQ or feature deep links

### Refinement Questions

- should the preview cards become interactive or remain static framing?
- should CTA row also include a `See how rooms work` anchor?

## 2. Sign In `/sign-in`

Source: [src/app/(auth)/sign-in/page.tsx](/C:/Users/Wajiz.pk/.vscode/Anonymous/src/app/(auth)/sign-in/page.tsx)

### Screen Structure

- centered column
- top identity block
- Clerk sign-in card below

### Top Identity Block

Contents:

- app icon tile
- heading `Sign in to UniBoard`
- small supporting line explaining Clerk + Convex sync

### Functional Behavior

- Clerk handles actual auth form rendering
- successful auth redirects to `/dashboard`

### UX Notes

- clear and minimal
- good visual continuity with app brand
- little local control over field-level UX because Clerk component owns most of it

## 3. Sign Up `/sign-up`

Source: [src/app/(auth)/sign-up/page.tsx](/C:/Users/Wajiz.pk/.vscode/Anonymous/src/app/(auth)/sign-up/page.tsx)

This mirrors sign-in structurally.

### Difference From Sign In

- heading changes to account creation framing
- support copy emphasizes joining rooms and posting

### Functional Behavior

- Clerk handles signup
- successful auth redirects to `/dashboard`

### Important Logic Context

After authentication, Convex user sync is triggered by `useCurrentUser`. New users are inserted with role `pending` until more onboarding/admin logic changes that status.

## 4. Dashboard `/dashboard`

Source: [src/app/(dashboard)/dashboard/page.tsx](/C:/Users/Wajiz.pk/.vscode/Anonymous/src/app/(dashboard)/dashboard/page.tsx)

### Screen Purpose

This is the user’s operational overview.

### Page Layout

Top hero region:

- left large welcome card
- right smaller operating note card

Optional middle section:

- horizontal deadline widgets if upcoming deadlines exist

Bottom section:

- room inventory grid

### Hero Card Anatomy

Top-left content:

- eyebrow `Dashboard`
- personalized heading using first name if available
- explanatory support text

Top-right action:

- `Create or join room` button
- links to `/rooms`

Lower hero stats:

- `Rooms`
- `Deadlines`
- `Momentum`

These are arranged in a three-card grid.

### Operating Note Card

Placement:

- right column on wide screens
- stacked below hero on smaller screens

Contents:

- eyebrow `Operating note`
- short headline
- explanatory paragraph
- three full-width chip rows

UX role:

- this card teaches behavior rather than showing data

### Upcoming Deadlines Section

Condition:

- only appears when deadline posts exist

Structure:

- section title
- horizontal scroll row of deadline widgets

### Your Rooms Section

States:

- loading skeleton grid
- empty state with centered icon and guidance
- populated grid of room cards

### UX Notes

- the dashboard is balanced between metrics and navigation
- it is not overloaded with feed content, which keeps it clean
- the main CTA is clear but could still be too generic because `Create or join room` spans two different intents

## 5. Rooms Discovery `/rooms`

Source: [src/app/(dashboard)/rooms/page.tsx](/C:/Users/Wajiz.pk/.vscode/Anonymous/src/app/(dashboard)/rooms/page.tsx)

### Screen Purpose

Discovery and entry into academic spaces.

### Top Spotlight Card

Contents in order:

- eyebrow `Rooms`
- headline
- support paragraph
- primary `Create room` button
- search input row
- two stat cards
- value chips

### Search Row

Layout on large screens:

- wide search field on left
- `Visible rooms` stat card
- `Batch` stat card

Search behavior:

- client-side filtering using a deferred query
- matches against room name, subject, description, and batch

### Room Grid

Possible states:

- loading skeletons
- empty batch-wide state
- no-results state for search
- populated grid

### Individual Room Entry

Each room appears as:

- room card
- separate full-width `Join room` button underneath

Important UX implication:

- the card itself navigates to the room detail route
- the separate button mutates membership directly
- for users who are not yet members, card click and join action create two different outcomes

This is a critical design tension:

- clicking the card suggests preview/open
- clicking `Join room` suggests commit
- if room detail requires membership, the card may not serve non-members cleanly

### Create Room Modal

Source: [src/components/rooms/CreateRoomModal.tsx](/C:/Users/Wajiz.pk/.vscode/Anonymous/src/components/rooms/CreateRoomModal.tsx)

#### Modal Layout

Header:

- title
- description
- top-right close button

Body:

- room quality checklist callout
- two-column form for core fields
- description textarea
- color and emoji selectors

Footer:

- `Cancel`
- `Create room`

#### Field Order

1. Room name
2. Subject code
3. Batch
4. Visibility
5. Description
6. Accent color
7. Emoji

#### Functional Details

- `name` and `subject` are required
- room creator becomes owner automatically
- public rooms are batch-visible
- private rooms get a generated join code in backend, though the UI does not currently display that join code anywhere

#### UX Notes

- this is one of the best-structured forms in the app
- the checklist gives useful qualitative guidance, not just field labels
- missing feedback: no inline validation messaging, no success message, no error surface

## 6. Room Detail `/rooms/[roomId]`

Source: [src/app/(dashboard)/rooms/[roomId]/page.tsx](/C:/Users/Wajiz.pk/.vscode/Anonymous/src/app/(dashboard)/rooms/[roomId]/page.tsx)

This is the central product screen.

### Top-Level Zones

1. room identity header
2. active presence strip
3. stats + feed filter section
4. pinned posts strip
5. feed list
6. bottom composer
7. optional teacher moderation panel on far right

### 6.1 Room Header

Source: [src/components/rooms/RoomHeader.tsx](/C:/Users/Wajiz.pk/.vscode/Anonymous/src/components/rooms/RoomHeader.tsx)

#### Layout

- left: large emoji tile
- center: room name and metadata chips
- below: room description
- right: `Room settings` button

Metadata chips:

- subject
- batch
- public/private status

UX role:

- very clear room framing
- strong sense of place
- settings button is visible even though the destination screen is currently read-only

### 6.2 Presence Bar

Source: [src/components/rooms/PresenceBar.tsx](/C:/Users/Wajiz.pk/.vscode/Anonymous/src/components/rooms/PresenceBar.tsx)

Condition:

- appears only when there are active users in room

Layout:

- left explanatory text
- right list of compact user pills with initials avatar and name

Logic:

- active means room membership `lastSeenAt` within last five minutes
- max five users shown

UX notes:

- this gives the room a live collaborative feeling
- presence is more "awareness" than direct collaboration because there are no typing indicators or real-time cursor interactions

### 6.3 Stats And Feed Controls Strip

Upper row:

- three stat cards: `Members`, `Posts`, `Format`

Lower row:

- left explanatory label and heading
- right filter chip buttons

Filter buttons:

- `All posts`
- `Note`
- `Deadline`
- `Question`
- `Resource`
- `Announcement`

UX notes:

- this is one of the most important scannability tools in the product
- filters are persistent in local component state only, not reflected in URL

### 6.4 Pinned Posts Banner

Source: [src/components/feed/PinnedPostsBanner.tsx](/C:/Users/Wajiz.pk/.vscode/Anonymous/src/components/feed/PinnedPostsBanner.tsx)

Condition:

- shown only when pinned posts exist

Layout:

- amber-tinted strip
- section label with pin icon
- horizontally scrollable cards with pinned post excerpts

UX role:

- prevents important content from disappearing into feed chronology
- card snippets are concise but not interactive beyond visibility; they do not jump into post context

### 6.5 Feed List

Source: [src/components/feed/PostFeed.tsx](/C:/Users/Wajiz.pk/.vscode/Anonymous/src/components/feed/PostFeed.tsx)

Possible states:

- loading skeleton cards
- empty state with large plus icon and helpful copy
- list of post cards

The feed list ends with extra bottom spacing to avoid visual collision with the composer.

### 6.6 Post Card

Source: [src/components/feed/PostCard.tsx](/C:/Users/Wajiz.pk/.vscode/Anonymous/src/components/feed/PostCard.tsx)

#### Structure From Top To Bottom

- author avatar
- author name
- post type badge
- pinned/resolved/edited status indicators
- relative timestamp at top-right
- overflow action menu trigger when allowed
- optional tags row
- main content
- optional deadline countdown
- optional resource link card
- action row
- expandable comments region

#### Overflow Menu Placement

- top-right within card header row
- only visible when user has at least one permitted contextual action

#### Menu Actions

Potential actions by state and role:

- pin / unpin
- mark resolved
- save post
- repost
- report post
- delete post

#### Action Row

Left to right:

- upvote button
- comment toggle button
- reaction bar

#### Important Permission Behavior

- anonymous authors cannot later be recognized as owners in UI logic
- because of that, the original anonymous author cannot delete or edit via ownership checks
- teachers and super admins still can moderate anonymous posts

This is a major product logic decision with UX implications.

### 6.7 Comments Thread

Source: [src/components/feed/CommentThread.tsx](/C:/Users/Wajiz.pk/.vscode/Anonymous/src/components/feed/CommentThread.tsx)

#### Structure

- section title `Discussion`
- comment list
- reply indentation for child comments
- composer at bottom

#### Composer Controls

- textarea
- anonymity toggle
- cancel reply link when replying
- submit button

#### Reply Model

- only top-level comments can be replied to
- replies cannot themselves receive replies

UX implication:

- the conversation tree is intentionally shallow
- this helps readability in a classroom context

### 6.8 Reaction Bar

Source: [src/components/feed/ReactionBar.tsx](/C:/Users/Wajiz.pk/.vscode/Anonymous/src/components/feed/ReactionBar.tsx)

Layout:

- existing reaction pills first
- smile icon button opens picker

Picker behavior:

- small popover anchored above icon
- clicking outside closes it

UX notes:

- fast lightweight expression layer
- no text labels for reactions
- no animation or confirmation state beyond count change

### 6.9 Upvote Button

Source: [src/components/feed/UpvoteButton.tsx](/C:/Users/Wajiz.pk/.vscode/Anonymous/src/components/feed/UpvoteButton.tsx)

Behavior:

- optimistic toggle
- count updates immediately
- vote state resets to server truth shortly after mutation resolves

UX notes:

- excellent responsiveness
- no explicit loading state

### 6.10 Composer

Source: [src/components/feed/PostComposer.tsx](/C:/Users/Wajiz.pk/.vscode/Anonymous/src/components/feed/PostComposer.tsx)

#### Layout

Top row:

- left helper copy
- right anonymity mode toggle

Second row:

- post type selector button
- selected type chip

Conditional fields:

- deadline title + datetime inputs for deadline posts
- resource URL + resource title inputs for resource posts

Main body:

- large textarea

Bottom row:

- character count and keyboard shortcut hint on left
- post button on right

#### Type Selector

- button opens menu above itself
- menu lists supported types

Implemented frontend types:

- note
- deadline
- question
- resource
- announcement

Important backend constraint:

- announcements can only be created by teacher or super admin
- the UI does not hide `Announcement` from students
- students can select it and fail at mutation time

This is a clear refinement opportunity.

#### Anonymity Toggle

States:

- `Visible identity`
- `Anonymous mode`

Important logic:

- room backend can disable anonymous posting
- UI does not pre-read that setting to disable the toggle before submit

#### Keyboard Behavior

- `Ctrl+Enter` or `Cmd+Enter` posts

## 7. Room Settings `/rooms/[roomId]/settings`

Source: [src/app/(dashboard)/rooms/[roomId]/settings/page.tsx](/C:/Users/Wajiz.pk/.vscode/Anonymous/src/app/(dashboard)/rooms/[roomId]/settings/page.tsx)

### Current Reality

This is not a true settings editor yet. It is a read-only operational summary card.

### Layout

- page wrapper
- single glass panel
- title and support copy
- definition list of room facts

Displayed fields:

- Name
- Subject
- Batch
- Members / Posts

### UX Note

The screen title and entry point imply editability, but current implementation only exposes metadata. This mismatch should be resolved by either:

- adding actual editable controls, or
- renaming/reframing the page as `Room overview`

## 8. Notifications `/notifications`

Source: [src/app/(dashboard)/notifications/page.tsx](/C:/Users/Wajiz.pk/.vscode/Anonymous/src/app/(dashboard)/notifications/page.tsx)

### Layout

Top summary card:

- icon tile
- title
- descriptive text
- `Mark all read` button
- unread stat card
- total stat card
- filter toggle row

Bottom list card:

- loading skeletons
- empty state
- or divided notification items

### Filter Buttons

- `All activity`
- `Unread only`

### Notification Row

Each row contains:

- message
- type label
- relative timestamp
- unread rows get subtle background emphasis

### UX Notes

- very clear triage screen
- currently no row click behavior even though notifications often conceptually point to content
- missing per-item mark-read and destination affordances

## 9. Search `/search`

Source: [src/app/(dashboard)/search/page.tsx](/C:/Users/Wajiz.pk/.vscode/Anonymous/src/app/(dashboard)/search/page.tsx)

### Layout

Top search hero:

- icon tile
- title
- support copy
- large search field
- suggestion chips

Results header:

- explanatory status text on left
- match count on right

Results list:

- loading state
- empty state
- result cards linking to room

### Search Result Card

Contains:

- room name
- post type chip
- post content excerpt
- author attribution
- relative timestamp

### Search Logic

- requires at least 2 characters
- searches only rooms the current user belongs to
- matches content, deadline title, resource title, and tags
- not full-text ranked search; simple inclusion filtering

### UX Notes

- good dedicated search page
- suggestion chips make it feel guided
- results navigate to room, not directly to exact post anchor

That means search answers "which room contains this" better than "jump me to the exact result context."

## 10. Profile `/profile`

Source: [src/app/(dashboard)/profile/page.tsx](/C:/Users/Wajiz.pk/.vscode/Anonymous/src/app/(dashboard)/profile/page.tsx)

### Layout

Top profile identity panel:

- title
- support copy
- definition-list style identity fields

Bottom saved posts panel:

- title
- support copy
- loading skeletons, empty state, or saved post cards

### Fields Shown

- Name
- Email
- Role
- Batch

### UX Notes

- this is informational rather than editable
- profile is not yet treated as a self-management center
- saved posts are arguably the most useful part of the screen right now

## 11. Settings `/settings`

Source: [src/app/(dashboard)/settings/page.tsx](/C:/Users/Wajiz.pk/.vscode/Anonymous/src/app/(dashboard)/settings/page.tsx)

### Current State

This is a placeholder screen.

### Layout

- single glass panel
- title
- paragraph describing future plans

### UX Risk

Users can reach this from the sidebar account card, but the destination currently provides no actionable controls.

## 12. Teacher Panel

Source: [src/components/teacher/TeacherPanel.tsx](/C:/Users/Wajiz.pk/.vscode/Anonymous/src/components/teacher/TeacherPanel.tsx)

### Visibility

- only rendered in room detail
- only for users with `teacher` or `super_admin` role
- only visible at `2xl` breakpoint and above

### Placement

- right side of room detail
- full-height vertical panel

### Tabs

- `Flagged`
- `Members`
- `Stats`

### Flagged Tab

Shows:

- loading skeletons
- empty state
- reported posts with delete button

### Members Tab

Shows:

- each member name and role
- `Mute 24h` button for non-owner, non-muted members

Important note:

- backend supports ban, unmute, unban, and role changes
- UI currently exposes only mute

### Stats Tab

Shows:

- posts count
- members count
- resolved questions count
- anonymous posts count
- type distribution bars

### UX Notes

- extremely useful for moderation and governance
- current breakpoint gating makes it invisible on smaller laptops and all mobile devices
- this may be too hidden for a critical teacher workflow
