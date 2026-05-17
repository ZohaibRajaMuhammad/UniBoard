# UniBoard Function Inventory

This document maps the main executable functions in UniBoard to the feature scenario they serve.

It is organized by module so a reviewer can trace:

- what the function does
- when it runs
- what user scenario triggers it
- what feature depends on it

## Private Room Join Flow

### Current implemented flow

1. A teacher or owner creates a private room through `convex/rooms.ts:create`.
2. Backend generates `joinCode` automatically for the private room.
3. The owner can see the room join code on `src/app/(dashboard)/rooms/[roomId]/settings/page.tsx`.
4. A student opens the Rooms discovery screen.
5. The student enters the join code in the new `Join private room` panel on `src/app/(dashboard)/rooms/page.tsx`.
6. Frontend calls `api.rooms.join({ joinCode })`.
7. Backend validates the code in `convex/rooms.ts:join`.
8. If valid, membership is created and the student is redirected into the room.

### Access policy now enforced

- Public rooms can be joined by `roomId`.
- Private rooms cannot be joined by `roomId` alone.
- Private rooms require `joinCode`.
- Archived rooms cannot be joined.
- Banned users cannot rejoin.

## Convex Backend

### `convex/lib.ts`

#### `getCurrentUserOrThrow`
- Scenario: Any protected mutation.
- Behavior: Resolves authenticated UniBoard user or throws.
- Used by: post creation, room join, moderation, profile updates.

#### `getCurrentUser`
- Scenario: Read-only queries for signed-in sessions.
- Behavior: Returns current user or `null`.
- Used by: analytics, notifications, rooms, posts, comments.

#### `getMembership`
- Scenario: Any room-scoped permission check.
- Behavior: Loads the current user membership for a room.
- Used by: room join duplication checks, feed access, moderation, unread counts.

#### `getRoomWithMembershipOrThrow`
- Scenario: Posting into a room or other room actions that require membership.
- Behavior: Loads room and membership together, throws when invalid.

#### `canModerateRoom`
- Scenario: Teacher/owner/moderator controls.
- Behavior: Central role gate for moderation workflows.

#### `createNotification`
- Scenario: New post, new comment, pin, moderation-related user notices.
- Behavior: Inserts a notification record.

#### `logModerationAction`
- Scenario: Administrative actions in rooms.
- Behavior: Writes moderation audit trail.

#### `buildPublicAuthor`
- Scenario: Rendering authors for comments/posts.
- Behavior: Converts author records into public-safe shape, respecting anonymity.

#### `sanitizeAuthor`
- Scenario: Post queries.
- Behavior: Applies public author shaping to posts.

### `convex/rooms.ts`

#### `generateJoinCode`
- Scenario: Private room creation or conversion from public to private.
- Behavior: Creates uppercase short join code.

#### `getMyRooms`
- Scenario: Sidebar room list, dashboard room grid.
- Behavior: Returns rooms the signed-in user belongs to and is not banned from.

#### `getById`
- Scenario: Room detail page, room settings page.
- Behavior: Fetches a room by id.

#### `getPublicRooms`
- Scenario: Rooms discovery page.
- Behavior: Returns visible public rooms, optionally batch filtered.

#### `getUnreadCount`
- Scenario: Sidebar room badges.
- Behavior: Counts unseen posts after membership `lastSeenAt`.

#### `getTotalUnreadCount`
- Scenario: Global unread badge in shell.
- Behavior: Sums unread posts across memberships.

#### `create`
- Scenario: Teacher/student creates a room.
- Behavior: Creates room record, generates private join code when needed, inserts owner membership, increments user room count.

#### `join`
- Scenario: Student joins public room from grid or private room by code.
- Behavior: Accepts either `roomId` or `joinCode`, validates room state, prevents banned re-entry, inserts membership, increments counts.
- Important rule: Private rooms now require `joinCode`.

#### `markSeen`
- Scenario: Opening a room page.
- Behavior: Updates membership `lastSeenAt` and user activity.

#### `getMembers`
- Scenario: Room settings, mentions, teacher panel.
- Behavior: Returns room memberships enriched with user objects.

#### `updateSettings`
- Scenario: Owner or teacher edits room governance.
- Behavior: Saves metadata/policy controls and ensures private rooms keep a join code.

#### `setMemberRole`
- Scenario: Promote or demote moderators.
- Behavior: Owner/teacher role adjustment with moderation log.

#### `muteOrBanMember`
- Scenario: Room moderation.
- Behavior: Mutes, unmutes, bans, or unbans a member and logs action.

### `convex/posts.ts`

#### `getByRoom`
- Scenario: Main room feed.
- Behavior: Loads latest posts visible to a room member, optionally filtered by type and limit.

#### `getPinnedPosts`
- Scenario: Pinned banner at top of room feed.
- Behavior: Returns pinned posts for room.

#### `getById`
- Scenario: Linking to a specific post or opening post detail context.
- Behavior: Fetches one visible post if user belongs to room.

#### `getUpcomingDeadlines`
- Scenario: Dashboard deadlines, analytics, planner-adjacent views.
- Behavior: Returns future deadline posts globally or for one room.

#### `getUserVote`
- Scenario: Upvote button state.
- Behavior: Loads whether current user has voted.

#### `getPostReactions`
- Scenario: Reaction bar.
- Behavior: Aggregates reactions by emoji and count.

#### `getReportedPosts`
- Scenario: Teacher moderation panel.
- Behavior: Returns reported posts for moderatable room.

#### `getSavedPosts`
- Scenario: Saved page.
- Behavior: Returns posts the current user saved.

#### `search`
- Scenario: Search page.
- Behavior: Full room-scoped text match over post content, titles, and tags.

#### `getSearchSuggestions`
- Scenario: Search quick suggestions.
- Behavior: Dynamically derives top tags from user-accessible rooms.

#### `create`
- Scenario: Post composer submit.
- Behavior: Validates room policy, creates note/deadline/question/resource/announcement/poll/project post, updates counts, emits notifications.

#### `editPost`
- Scenario: Author edits own visible post.
- Behavior: Saves new content/tags within edit window.

#### `hidePost`
- Scenario: Author temporarily hides their own post.
- Behavior: Toggles `isHidden`.

#### `togglePin`
- Scenario: Teacher/owner pins or unpins post.
- Behavior: Toggles room highlight and logs moderation.

#### `markResolved`
- Scenario: Question answered workflow.
- Behavior: Marks question as resolved and notifies author.

#### `flagPost`
- Scenario: Moderator marks risky post for review.
- Behavior: Flags post and writes moderation log.

#### `reportPost`
- Scenario: Member reports post.
- Behavior: Marks post as reported and increments count.

#### `remove`
- Scenario: Delete post.
- Behavior: Soft deletes author/moderator-owned content.

#### `repost`
- Scenario: Cross-room or same-room repost.
- Behavior: Clones post into target room and tracks share record.

#### `savePost`
- Scenario: Save/unsave post.
- Behavior: Toggles saved state.

### `convex/comments.ts`

#### `getByPost`
- Scenario: Discussion thread rendering.
- Behavior: Loads non-deleted comments and enriches authors.

#### `create`
- Scenario: User adds comment or reply.
- Behavior: Validates room membership and policy, inserts comment, increments counts, notifies post author.

#### `createAiReply`
- Scenario: AI auto-replies after mention.
- Behavior: Inserts assistant comment while deduplicating repeated recent AI replies.

#### `deleteComment`
- Scenario: Author or moderator deletes a comment.
- Behavior: Soft deletes comment.

### `convex/analytics.ts`

#### `clamp`
- Scenario: Risk and score normalization.
- Behavior: Constrains calculated values to range.

#### `getRoomAnalytics`
- Scenario: Teacher panel analytics by room.
- Behavior: Returns type counts, daily counts, contributors, members, resolved questions, anonymous totals.

#### `getWorkspaceAnalytics`
- Scenario: Analytics screen and dashboard-level charts.
- Behavior: Returns room-scoped totals, post-type distribution, last 28 days activity, upcoming deadlines.

#### `getPublicSnapshot`
- Scenario: Landing page metrics.
- Behavior: Returns live public-room counts, visible public posts, deadline counts, busiest public room.

### `convex/reputation.ts`

#### `clamp`
- Scenario: XP and score normalization.

#### `tierForXp`
- Scenario: Reputation level derivation.
- Behavior: Maps XP into tier.

#### `buildScoreboard`
- Scenario: Leaderboard assembly.
- Behavior: Aggregates user reputation and activity.

#### `getLeaderboard`
- Scenario: Leaderboard page.
- Behavior: Returns ranking list.

#### `getMe`
- Scenario: Reputation profile hero stats.
- Behavior: Returns current user reputation snapshot.

#### `getActivity`
- Scenario: Reputation activity timeline.
- Behavior: Returns activity entries.

### `convex/planner.ts`

#### `startOfDay`
- Scenario: Scheduling normalization.

#### `addDays`
- Scenario: Planner date calculations.

#### `clamp`
- Scenario: Risk weighting.

#### `buildPlannerSnapshot`
- Scenario: Planner main view and AI planning routes.
- Behavior: Builds derived deadlines, sessions, and metrics.

#### `getSnapshot`
- Scenario: Planner page and AI deadline/study logic.
- Behavior: Returns calculated planner model.

#### `replan`
- Scenario: User requests fresh plan.
- Behavior: Recalculates schedule data.

#### `createManualDeadline`
- Scenario: User adds manual planner item.
- Behavior: Inserts custom deadline.

#### `exportCalendar`
- Scenario: Planner export.
- Behavior: Produces calendar-formatted content.

### `convex/notifications.ts`

#### `getMyNotifications`
- Scenario: Notifications page.
- Behavior: Returns current user notifications ordered by recency.

#### `getUnreadNotificationCount`
- Scenario: Notification badge.
- Behavior: Counts unread notifications.

#### `markAllRead`
- Scenario: Clear notifications state.
- Behavior: Marks all unread notifications as read.

#### `markRead`
- Scenario: Single-notification acknowledgement.
- Behavior: Marks one notification as read.

### `convex/users.ts`

#### `getCurrentUser`
- Scenario: Global authenticated UI.
- Behavior: Returns current UniBoard user record.

#### `getById`
- Scenario: Profile lookups.

#### `getPublicProfile`
- Scenario: Public/member-facing profile view.

#### `getOnlineInRoom`
- Scenario: Presence bar.
- Behavior: Returns online users in room.

#### `upsertFromClerk`
- Scenario: Clerk webhook sync.
- Behavior: Creates or updates user.

#### `syncCurrentUser`
- Scenario: Session hydration.
- Behavior: Ensures current session user exists in Convex.

#### `removeByClerkId`
- Scenario: Account deletion / Clerk cleanup.

#### `completeOnboarding`
- Scenario: Initial setup.
- Behavior: Writes batch/department and profile initialization.

#### `updateProfile`
- Scenario: Profile page save.
- Behavior: Updates editable user fields and notification preferences.

#### `updatePresence`
- Scenario: Presence tracking.
- Behavior: Writes `isOnline` and `lastActiveAt`.

### `convex/votes.ts`

#### `toggle`
- Scenario: Upvote button click.
- Behavior: Adds or removes post/comment vote and updates aggregate count.

#### `toggleReaction`
- Scenario: Reaction picker click.
- Behavior: Adds/removes emoji reaction.

### `convex/ai.ts`

#### `clamp`
- Scenario: Fallback AI scoring.

#### `queryKnowledgeBase`
- Scenario: Fallback knowledge retrieval.
- Behavior: Deterministic search across room content.

#### `getDeadlineRisk`
- Scenario: Fallback deadline risk.
- Behavior: Computes risk from deadline timing without OpenAI.

#### `getLearningProfile`
- Scenario: Fallback learning profile.
- Behavior: Summarizes visible expertise from tags and activity.

## AI Service Layer

### `src/lib/ai/service.ts`

#### `getKnowledgeAnswer`
- Scenario: Knowledge base page asks academic question.
- Behavior: Uses authorized room context and OpenAI/fallback retrieval.

#### `getDeadlineRisk`
- Scenario: Analytics risk panel.
- Behavior: Produces AI-grounded deadline risk list.

#### `getLearningProfile`
- Scenario: Reputation page AI profile.
- Behavior: Produces topic-strength summary.

#### `getStudyPlan`
- Scenario: Study plan endpoint.
- Behavior: Produces sessionized plan from planner snapshot.

#### `getBriefing`
- Scenario: Dashboard AI briefing.
- Behavior: Summarizes current workspace priorities and warnings.

#### `getRoomSummary`
- Scenario: Room page AI summary card.
- Behavior: Summarizes visible room posts only.

#### `getAssistantReply`
- Scenario: AI assistant chat and room mentions.
- Behavior: Answers direct questions from authorized room/workspace context.

#### `getComposerSuggestion`
- Scenario: Post composer AI draft.
- Behavior: Produces grounded draft post body and tags.

#### `toErrorEnvelope`
- Scenario: API route failure handling.
- Behavior: Normalizes AI route error response.

### `src/lib/ai/mentions.ts`

#### `containsAiMention`
- Scenario: Post/comment includes assistant handle.
- Behavior: Detects `@UniBoardAI`, `@UniBoard`, and lowercase aliases.

#### `stripAiMentions`
- Scenario: Preparing prompt content.
- Behavior: Removes assistant mention token from user text.

#### `extractAssistantUserRequest`
- Scenario: AI service receives mention-generated prompt.
- Behavior: Extracts direct user request body from prompt wrapper.

#### `buildAssistantPrompt`
- Scenario: Post/comment mention triggers assistant.
- Behavior: Builds room-aware prompt with post and parent-comment context.

#### `formatAssistantComment`
- Scenario: Storing assistant reply as discussion comment.
- Behavior: Formats reply plus optional next steps.

### `src/lib/ai/retrieval.ts`

#### `retrieveChunks`
- Scenario: Any AI answer grounded in room content.
- Behavior: Embeds query and chunks, ranks semantic/context relevance, returns top chunks.

## Frontend Core Components

### `src/components/layout/Sidebar.tsx`

#### `Sidebar`
- Scenario: Desktop workspace shell.
- Behavior: Renders nav groups, unread counts, room list, profile controls.

#### `NavItem`
- Scenario: Individual sidebar route item.

#### `SidebarRoomItem`
- Scenario: Room row in sidebar.
- Behavior: Shows room icon and unread badge.

### `src/components/layout/MobileSidebar.tsx`

#### `MobileSidebar`
- Scenario: Mobile workspace shell.
- Behavior: Opens slide-over sidebar drawer.

### `src/components/layout/MobileNav.tsx`

#### `MobileNav`
- Scenario: Bottom navigation on small screens.

#### `MobileNavItem`
- Scenario: Per-tab mobile navigation element.

### `src/components/rooms/CreateRoomModal.tsx`

#### `CreateRoomModal`
- Scenario: User creates room from shell or rooms page.
- Behavior: Collects room metadata and submits `api.rooms.create`.

#### `handleSubmit`
- Scenario: Modal submit click.
- Behavior: Validates room name/subject and creates room.

#### `Field`
- Scenario: Shared labeled field wrapper.

### `src/components/rooms/RoomCard.tsx`

#### `RoomCard`
- Scenario: Rooms discovery grid and dashboard room grid.
- Behavior: Shows room summary, batch, membership count, last activity.

### `src/components/rooms/RoomHeader.tsx`

#### `RoomHeader`
- Scenario: Top of room page.
- Behavior: Shows room identity, scope chips, description, settings access.

### `src/components/rooms/PresenceBar.tsx`

#### `PresenceBar`
- Scenario: Room page top presence strip.
- Behavior: Shows currently active users in room.

### `src/components/feed/PostComposer.tsx`

#### `PostComposer`
- Scenario: Create a room post.
- Behavior: Supports note/deadline/resource/question/announcement/poll/project creation, mentions, AI drafting, tags, anonymous mode.

#### `insertMention`
- Scenario: Click quick mention chip.

#### `buildContent`
- Scenario: Poll submit.
- Behavior: Converts options into final post content.

#### `handleSubmit`
- Scenario: Post submission.
- Behavior: Creates post and optionally triggers AI mention reply.

#### `handleAiDraft`
- Scenario: Draft with AI button.
- Behavior: Requests AI suggestion and fills composer.

#### `onKeyDown`
- Scenario: Keyboard submit.

### `src/components/feed/CommentThread.tsx`

#### `CommentThread`
- Scenario: Open post discussion.
- Behavior: Renders comments/replies, quick mentions, reply state, anonymous comment mode.

#### `insertMention`
- Scenario: Insert user or AI mention in comment box.

#### `handleSubmit`
- Scenario: Submit comment/reply.
- Behavior: Creates comment and optionally triggers AI reply.

#### `onKeyDown`
- Scenario: Enter-to-submit in comment box.

#### `CommentCard`
- Scenario: Single comment render with delete/reply controls.

### `src/components/feed/PostCard.tsx`

#### `PostCard`
- Scenario: Main feed item render.
- Behavior: Displays metadata, edit/delete/save/report/pin/resolve/reactions/comments.

#### `saveEdit`
- Scenario: Save edited post content.

#### `ActionButton`
- Scenario: Reusable post action control.

### `src/components/feed/PostFeed.tsx`

#### `PostFeed`
- Scenario: Room feed list.
- Behavior: Renders loading, empty, and populated feed states.

### `src/components/feed/ReactionBar.tsx`

#### `ReactionBar`
- Scenario: Emoji reactions.

#### `handleReact`
- Scenario: Click reaction emoji.

### `src/components/feed/UpvoteButton.tsx`

#### `UpvoteButton`
- Scenario: Upvote interaction.

#### `handleVote`
- Scenario: Toggle upvote.

### `src/components/feed/DeadlineWidget.tsx`

#### `DeadlineWidget`
- Scenario: Dashboard upcoming deadlines strip.

### `src/components/feed/DeadlineCountdown.tsx`

#### `DeadlineCountdown`
- Scenario: Live time-left rendering for deadlines.

### `src/components/feed/PinnedPostsBanner.tsx`

#### `PinnedPostsBanner`
- Scenario: Room pinned content ribbon.

### `src/components/teacher/TeacherPanel.tsx`

#### `TeacherPanel`
- Scenario: Room moderation/teacher analytics panel.
- Behavior: Displays moderation actions, reports, role controls, and analytics.

## Frontend Routes

### Auth

#### `src/app/(auth)/sign-in/page.tsx -> SignInPage`
- Scenario: User signs in with Clerk.

#### `src/app/(auth)/sign-up/page.tsx -> SignUpPage`
- Scenario: User creates account with Clerk.

### Dashboard shell

#### `src/app/(dashboard)/layout.tsx -> DashboardLayout`
- Scenario: Protected app shell.
- Behavior: Wraps sidebar, mobile nav, mobile sidebar, AI assistant.

### Main pages

#### `dashboard/page.tsx -> DashboardRoutePage`
- Scenario: User opens dashboard home.
- Behavior: Shows briefing, room counts, deadlines, joined rooms.

#### `rooms/page.tsx -> RoomsPage`
- Scenario: Discovery and joining.
- Behavior: Search public rooms, join public room, join private room by code, create room.

#### `rooms/[roomId]/page.tsx -> RoomPage`
- Scenario: User opens a room.
- Behavior: Shows room stats, AI summary, feed filters, teacher panel, feed, composer.

#### `rooms/[roomId]/settings/page.tsx -> RoomSettingsPage`
- Scenario: Owner/teacher adjusts room governance.
- Behavior: Metadata, policy toggles, membership summary, join code display.

#### `search/page.tsx -> SearchPage`
- Scenario: Search posts/resources.

#### `analytics/page.tsx -> AnalyticsPage`
- Scenario: Review workspace metrics.
- Behavior: Renders dynamic line, donut, and sparkline charts from live analytics.

#### `planner/page.tsx -> PlannerPage`
- Scenario: Deadline planning and schedule generation.

#### `knowledge-base/page.tsx -> KnowledgeBasePage`
- Scenario: Ask room-grounded academic questions.

#### `leaderboard/page.tsx -> LeaderboardPage`
- Scenario: Rank users by contribution/reputation.

#### `reputation/page.tsx -> ReputationPage`
- Scenario: Inspect current user’s reputation and AI-derived learning profile.

#### `notifications/page.tsx -> NotificationsPage`
- Scenario: Review alerts and mark them read.

#### `saved/page.tsx -> SavedPage`
- Scenario: Revisit saved posts.

#### `profile/page.tsx -> ProfilePage`
- Scenario: Edit personal profile and inspect static account facts.

#### `settings/page.tsx -> SettingsPage`
- Scenario: Theme and notification preferences.

## API Routes

### `src/app/api/v1/ai/*`

- `assistant/route.ts`: AI assistant reply endpoint
- `briefing/route.ts`: workspace briefing endpoint
- `composer/suggest/route.ts`: AI draft endpoint
- `deadline-risk/route.ts`: deadline risk endpoint
- `knowledge/query/route.ts`: academic knowledge query endpoint
- `learning-profile/route.ts`: learning profile endpoint
- `room-summary/route.ts`: room summary endpoint
- `study-plan/route.ts`: study plan endpoint

### `src/app/api/webhooks/clerk/route.ts`

- Scenario: Clerk user lifecycle sync.
- Behavior: Creates, updates, or removes Convex user records as Clerk events arrive.

## Hooks and Shared Utilities

### `src/hooks/useCurrentUser.ts`

#### `useCurrentUser`
- Scenario: Any client component needing session-linked UniBoard user.

### `src/hooks/useUnreadCounts.ts`

#### `useUnreadCounts`
- Scenario: Shell-level unread badges.

### `src/lib/utils.ts`

#### `cn`
- Scenario: Tailwind class composition.

#### `formatRelativeTime`
- Scenario: Feed, notifications, rooms, analytics timestamps.

#### `truncate`
- Scenario: Preview text shortening.

#### `initials`
- Scenario: Avatar fallback text.

#### `formatDeadline`
- Scenario: Deadline labels in analytics/planner/feed.

## Summary

The main room-access model is now:

- Public room: searchable and joinable from room discovery.
- Private room: invisible from public discovery and joinable only through join code.
- Owner/teacher: can read and distribute the private join code from room settings.
- Student: can enter that code from the Rooms page and join safely.
