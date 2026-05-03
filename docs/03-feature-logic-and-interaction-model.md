# Feature Logic And Interaction Model

## 1. Identity Model

### Authentication

- Clerk handles sign-in and sign-up UI
- authenticated dashboard routes require a Clerk `userId`

### User Sync

The hook [src/hooks/useCurrentUser.ts](/C:/Users/Wajiz.pk/.vscode/Anonymous/src/hooks/useCurrentUser.ts) syncs authenticated Clerk users into Convex.

Behavior:

- if Clerk user exists and Convex user query returns `null`, a sync mutation runs
- synced users are created with role `pending`

Webhook support in [src/app/api/webhooks/clerk/route.ts](/C:/Users/Wajiz.pk/.vscode/Anonymous/src/app/api/webhooks/clerk/route.ts) also upserts and removes users based on Clerk events.

### UX Meaning

- the app depends on a dual identity layer: auth identity and product identity
- role-sensitive UI should ideally account for `pending` users, though current screens do not emphasize that state

## 2. Core Data Model

Schema source: [convex/schema.ts](/C:/Users/Wajiz.pk/.vscode/Anonymous/convex/schema.ts)

Main entities:

- `users`
- `rooms`
- `roomMembers`
- `posts`
- `comments`
- `votes`
- `reactions`
- `notifications`
- `moderationLogs`
- `postShares`
- `savedPosts`

### Product Shape

The product is room-centric:

- room membership controls access
- posts belong to rooms
- comments belong to posts
- notifications are generated from room activity

## 3. Room Logic

Source: [convex/rooms.ts](/C:/Users/Wajiz.pk/.vscode/Anonymous/convex/rooms.ts)

### Create Room

When a room is created:

- creator must be authenticated
- room metadata is inserted
- creator is automatically inserted into `roomMembers` as `owner`
- `memberCount` starts at `1`
- creator `roomsJoined` increments

Defaults:

- `allowAnonymous` defaults to true
- `allowStudentInvite` defaults to false
- `aiEnabled` defaults to false

### Join Room

Users can join by:

- `roomId`
- or join code

Important behaviors:

- archived rooms cannot be joined
- banned memberships block access
- existing membership returns room id without duplicate insert

### Read Access

Room feed access depends on membership.

This means public room discoverability and public room readability are different concepts:

- public rooms are visible in discovery
- their conversation is still effectively member-gated

### Read/Unread Model

Unread counts are based on:

- each membership record’s `lastSeenAt`
- compared against post `createdAt`

Room page side effect:

- entering a room calls `markSeen`
- this updates membership `lastSeenAt`
- also updates user `lastActiveAt` and `isOnline`

### Membership Roles

Room-specific roles:

- `member`
- `moderator`
- `owner`

Global roles:

- `student`
- `teacher`
- `admin`
- `super_admin`
- `pending`

Moderation permission helper:

- teachers
- super admins
- room owners
- room moderators

## 4. Post Logic

Source: [convex/posts.ts](/C:/Users/Wajiz.pk/.vscode/Anonymous/convex/posts.ts)

### Supported Post Types In UI

- note
- deadline
- question
- resource
- announcement

Schema also anticipates:

- poll
- project

But these are not exposed in current UI.

### Create Post Rules

To create a post:

- user must be authenticated
- user must belong to the room
- room must not be archived
- muted members cannot post until mute expires
- anonymous posting must be allowed if anonymity selected
- only teachers and super admins can create announcements

Important backend side effects:

- room `postCount` increments
- room `lastPostAt` updates
- user `postCount` increments
- author membership `lastSeenAt` updates
- notifications fan out to room members

### Announcement Special Case

Announcements are automatically pinned on creation.

This is a major information architecture choice:

- announcements are treated as structurally important, not just semantically distinct

### Author Privacy

Anonymous posts are stored with no `authorId`.

Public author sanitization returns:

- name `Anonymous`
- no image
- role `student`

UX implication:

- anonymity is strong at read time
- but it also removes some later ownership affordances for the original author

### Edit Post

Backend supports editing non-anonymous own posts within 24 hours.

Current issue:

- there is no frontend control for editing posts

### Hide Post

Backend supports author hide/unhide.

Current issue:

- no frontend surface uses it

### Pin Post

Rules:

- only moderators/teachers/owners per moderation helper

Effects:

- post `isPinned` toggles
- room `pinnedPostId` updates
- moderation log entry is created
- original post author receives notification when someone else pins it

### Mark Resolved

Rules:

- allowed for question posts only
- permitted for the identified author, teacher, or super admin

Important nuance:

- anonymous original posters cannot satisfy author ownership checks later
- so an anonymous asker cannot self-resolve by ownership

### Report Post

Rules:

- any non-banned room member can report

Effects:

- sets `isReported`
- increments `reportCount`

Current UX gap:

- no report reason input in current post card menu

### Remove Post

Rules:

- visible author can delete own post
- moderators/owners/teachers/super_admin can also delete
- anonymous original authors are not recognized as owners for self-delete

Effects:

- soft-delete only through `isDeleted`
- moderation log created if someone deletes another person’s post

### Repost

Behavior:

- clones an existing post into same room by default
- backend also supports targeting a different room
- increments original post `shareCount`
- inserts a `postShares` record

Current UI gap:

- no room picker for cross-room repost
- current interface effectively uses same-room repost only

### Save Post

Behavior:

- toggle style
- if save exists, delete it
- otherwise create saved record

Current UI gap:

- menu label always says `Save post`
- no visual state indicating whether item is already saved

## 5. Comment Logic

Source: [convex/comments.ts](/C:/Users/Wajiz.pk/.vscode/Anonymous/convex/comments.ts)

### Create Comment Rules

- user must be authenticated
- post must exist and not be deleted
- user must belong to room
- banned members blocked
- muted members blocked
- anonymous comments allowed only if room allows anonymous posting
- content must be non-empty and max 500 characters

### Reply Model

- replies can target only top-level comments
- nested replies under replies are disallowed

This keeps the thread depth at two levels:

- root comment
- one reply layer

### Side Effects

- post `commentCount` increments
- post author may receive `new_comment` notification

### Delete Comment

Allowed for:

- visible comment author
- teacher
- super admin
- room owner
- room moderator

Current UI gap:

- no moderator-specific delete affordance beyond simple button visibility in comment card logic
- no deletion confirmation

## 6. Vote And Reaction Logic

Source: [convex/votes.ts](/C:/Users/Wajiz.pk/.vscode/Anonymous/convex/votes.ts)

### Upvote

Behavior:

- toggle vote record
- increment or decrement post `upvoteCount`
- update author `upvotesReceived`
- notify author if another user upvotes

Current UI behavior:

- optimistic update
- fast and responsive

### Reactions

Allowed emojis are fixed:

- thumbs up
- heart
- laugh
- fire
- surprised
- sad

Behavior:

- toggle per emoji per user per post
- grouped results are derived at query time

UX consequence:

- controlled emoji set avoids noise
- unlike upvotes, reactions do not trigger notifications

## 7. Notification Logic

Source: [convex/notifications.ts](/C:/Users/Wajiz.pk/.vscode/Anonymous/convex/notifications.ts)

Notifications are generated for:

- new post
- announcement
- new comment
- upvote
- question resolved
- post pinned

### Notification Screen Behavior

- fetches latest 30 notifications
- unread count comes from separate query
- mark all read patches every unread item

Current UX limitations:

- no per-notification click-through behavior
- no per-notification read toggle
- no grouping by room or activity type

## 8. Search Logic

Source: [convex/posts.ts](/C:/Users/Wajiz.pk/.vscode/Anonymous/convex/posts.ts)

Search rules:

- query length must be at least 2
- only posts from rooms the user belongs to are searchable
- deleted and hidden posts excluded
- optional room filter and type filter exist in backend

Matched fields:

- post content
- deadline title
- resource title
- tags

### UX Meaning

This is substring search, not semantic or ranked search.

That means:

- predictable
- simple
- likely adequate for classroom keywords
- weaker for exploratory retrieval or typo tolerance

## 9. Presence Logic

Source: [convex/users.ts](/C:/Users/Wajiz.pk/.vscode/Anonymous/convex/users.ts)

Presence is inferred from `lastSeenAt` in room memberships.

User is shown as active in room when:

- member is not banned
- member is not muted
- `lastSeenAt` is within five minutes

### UX Meaning

This is passive room presence, not active session presence. It reflects recent room contact, not necessarily current tab focus.

## 10. Moderation And Teacher Features

Sources:

- [convex/rooms.ts](/C:/Users/Wajiz.pk/.vscode/Anonymous/convex/rooms.ts)
- [convex/posts.ts](/C:/Users/Wajiz.pk/.vscode/Anonymous/convex/posts.ts)
- [convex/analytics.ts](/C:/Users/Wajiz.pk/.vscode/Anonymous/convex/analytics.ts)

### Current Exposed Teacher UI

- delete reported posts
- mute members for 24h
- view basic analytics
- pin posts
- mark questions resolved

### Backend Supports More Than UI Exposes

Supported in backend but not surfaced fully:

- unmute
- ban
- unban
- role promotion to moderator
- room setting updates
- room archive state changes

### Analytics Model

Teacher analytics currently include:

- posts in selected period
- by-type distribution
- by-day distribution
- top contributors
- total members
- resolved questions
- anonymous posts

Current UI displays only part of the available analytics object.

## 11. Implemented Vs Implied Features

### Implemented In Both Backend And Frontend

- room creation
- room joining
- room feed
- post creation
- anonymous posting
- deadline cards and countdowns
- comments and replies
- upvotes
- reactions
- saved posts
- search
- notifications overview
- basic moderation

### Backend Exists But Frontend Is Missing Or Partial

- post editing
- post hiding
- fuller room settings editing
- room member role changes
- ban/unban controls
- unmute controls
- notification preference editing
- profile editing
- richer analytics presentation
- join code display and private room invite flows
- poll/project post UI

### Frontend Placeholder Screens

- `/settings`
- `/rooms/[roomId]/settings` as true settings editor
- `/profile` as editable account center

## 12. Key UX Logic Risks

1. `Announcement` appears selectable for all users even though students cannot submit it.
2. Anonymous authors lose some later ownership affordances because `authorId` is removed.
3. Public room discovery and actual room access are conceptually different and may confuse users.
4. Notifications cannot be clicked through to exact destination content.
5. Search results route to room, not exact post context.
6. Settings and room settings imply control depth that does not yet exist.
