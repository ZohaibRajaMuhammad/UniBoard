# 08 — Roles & Permissions Matrix

## Overview

UniBoard Pro has **three primary roles**:

| Role | Scope | Created by |
|------|-------|-----------|
| `student` | Member of rooms they join | Self-selected at onboarding |
| `teacher` | Can create + manage rooms | Self-selected at onboarding |
| `super_admin` | System-wide access | Manually assigned in DB |

Within a room, users also have a **room role**:

| Room Role | Granted by | Capabilities |
|-----------|-----------|-------------|
| `owner` | Created the room | All room-level permissions |
| `moderator` | Assigned by owner/teacher | Pin, mute, delete, flag |
| `member` | Joined the room | Post, comment, react, vote |

---

## 🎓 Teacher — 20 Capabilities

### Class Management (6)

**1. Create a Room**
- Teacher can create a new room for any subject + batch combination
- Configures: name, emoji, color, public/private, join code, anonymous allowed, AI enabled
- Auto-assigned as `owner` of the room
- Mutation: `rooms:create`

**2. Archive a Room**
- Teacher can archive rooms (end of semester)
- Archived rooms become read-only — students can view but not post
- Room disappears from "active rooms" list but is accessible via "archived"
- Mutation: `rooms:updateSettings({ isArchived: true })`

**3. Edit Room Settings**
- Change room name, description, emoji, color
- Toggle: public/private, anonymous posting, AI tutor, student invite permissions
- Regenerate join code for private rooms
- Mutation: `rooms:updateSettings`

**4. Promote Member to Moderator**
- Teacher can elevate trusted students to moderator within a room
- Moderators can: pin posts, delete posts, mute/flag members
- Logged to `moderationLogs`
- Mutation: `rooms:setMemberRole`

**5. Remove Member from Room**
- Teacher can remove (ban) a member from their room
- Banned member cannot rejoin with same account
- Mutation: `rooms:muteOrBanMember({ action: "ban" })`

**6. Transfer Room Ownership**
- Teacher can transfer ownership to another teacher/user
- Former owner becomes moderator
- Mutation: `rooms:transferOwnership` (to be implemented)

---

### Content Moderation (7)

**7. Delete Any Post**
- Teacher can delete any post in their room — not just their own
- Deletion is soft (shows "[Removed by teacher]" in feed)
- Deletion reason is saved to `moderationLogs`
- Mutation: `posts:remove`

**8. Delete Any Comment**
- Same as post deletion but for comments
- Mutation: `comments:deleteComment`

**9. Pin / Unpin Posts**
- Teacher can pin any post to the top of the feed
- Pinned posts appear in `PinnedPostsBanner` above the feed
- Multiple posts can be pinned
- Mutation: `posts:togglePin`

**10. Flag Post for Review**
- Teacher or moderator can flag posts as "needs review"
- Flagged posts appear in the Teacher Panel's "Flagged" tab
- Mutation: `posts:flagPost`

**11. Mute a Member**
- Teacher can temporarily mute a student (they can still read but not post)
- Mute duration: 1h, 6h, 24h, or indefinite
- Visible as "You are muted" to muted student
- Mutation: `rooms:muteOrBanMember({ action: "mute" })`

**12. Mark Question as Resolved**
- Teacher can mark any question-type post as resolved
- Shows green "✓ Answered" badge
- Closes the AI Tutor prompt for that question
- Mutation: `posts:markResolved`

**13. View Reported Posts Dashboard**
- Teacher-only tab in room: shows all posts reported by members
- Quick actions: Delete, Flag, Dismiss report
- Query: `posts:getReportedPosts` (teacher-only guard)

---

### Analytics & Insights (4)

**14. Room Analytics Dashboard**
- Teacher gets `/rooms/[roomId]/analytics` page
- Shows: posts per day chart, posts by type breakdown, top contributors, unresolved questions count, anonymous post ratio
- Query: `analytics:getRoomAnalytics`

**15. Moderation Log**
- Teacher can view full audit trail of all moderation actions in their room
- Shows: who did what, when, to which post/user
- Query: `moderationLogs` filtered by roomId

**16. Member Activity Report**
- Per-member breakdown: post count, comment count, upvotes received, last active
- Helps identify disengaged or highly active students
- Query: `analytics:getMemberActivity` (to be implemented)

**17. Export Class Data**
- Teacher can export room posts to CSV/JSON
- Useful for end-of-semester archival
- Implemented as a Next.js API route that queries Convex and streams a file

---

### Content Creation (3)

**18. Post Announcements**
- Only teachers can post `type: "announcement"`
- Announcements auto-pin, auto-notify ALL members (regardless of notification preferences)
- Displayed with purple "📢 Announcement" badge
- Mutation: `posts:create({ type: "announcement" })`

**19. Create Polls**
- Teacher can create polls with up to 6 options
- Options: anonymous voting, expiry time
- Real-time vote count updates
- Results visible to all after voting (or after teacher closes poll)
- Mutation: `polls:create` (to be implemented)

**20. Reshare Any Post to Another Room**
- Teacher can reshare a post from one room to another room they own
- Useful for sharing important notes/deadlines across sections
- Mutation: `posts:repost({ originalPostId, targetRoomId })`

---

## 🎒 Student — 20 Capabilities

### Core Posting (5)

**1. Create a Post**
- Student can post in any room they are a member of
- Post types available: note, deadline, question, resource
- Character limit: 2000 characters
- Mutation: `posts:create`

**2. Post Anonymously**
- Student can toggle "Anonymous" mode per post
- Anonymous posts store no `authorId` in the database
- Room must have `allowAnonymous: true`
- Cannot be anonymous for project posts (accountability)

**3. Edit Own Post**
- Student can edit their own (non-anonymous) posts within 24 hours of posting
- Edited posts show "(edited)" badge
- Mutation: `posts:editPost`

**4. Delete Own Post**
- Student can delete their own posts at any time
- Anonymous posts cannot be deleted by the student (no auth link)
- Mutation: `posts:remove`

**5. Hide Own Post**
- Student can hide their post (visible to teacher, invisible to others)
- Different from delete — hidden posts can be unhidden
- Useful for "draft" behavior or temporary removal
- Mutation: `posts:hidePost`

---

### Engagement (5)

**6. Upvote Posts**
- One upvote per post, toggleable
- Optimistic update — instant UI feedback
- Contributes to author's `upvotesReceived` stat
- Mutation: `votes:togglePostVote`

**7. React with Emoji**
- 6 emoji reactions: 👍 ❤️ 😂 🔥 😮 😢
- Multiple different emojis allowed per post, one of each per user
- Reaction bar shows grouped counts with overlap avatars
- Mutation: `votes:toggleReaction`

**8. Comment on Posts**
- Students can comment on any post in their rooms
- Max 500 characters per comment
- Can be anonymous (if room allows)
- Mutation: `comments:create`

**9. Reply to Comments**
- One level of reply threading (comment → reply)
- Reply shows "@username" reference to parent
- Mutation: `comments:create({ parentCommentId })`

**10. Delete Own Comment**
- Student can delete their own comments at any time
- Mutation: `comments:deleteComment`

---

### Discovery & Saving (4)

**11. Save / Bookmark Posts**
- Student can save any post to their personal "Saved" collection
- Accessible at `/profile` → Saved tab
- Mutation: `posts:savePost` (toggles saved state)

**12. Repost to Same Room**
- Student can repost a post into the same room
- Repost shows "↻ Reposted" badge and links to original
- Useful for boosting visibility of important notes
- Mutation: `posts:repost`

**13. Share Post Cross-Room**
- Student can share a post to another room they are a member of
- Requires confirmation dialog (to prevent spam)
- Mutation: `posts:repost({ targetRoomId })`

**14. Report a Post**
- Student can report inappropriate posts to the teacher
- Reported posts get a flag on teacher's moderation dashboard
- Student sees "Report submitted" confirmation
- Mutation: `posts:reportPost`

---

### Personal Features (4)

**15. Update Profile**
- Student can update: display name, bio, department, student ID
- Changes reflected across all their posts and comments in real-time
- Mutation: `users:updateProfile`

**16. Configure Notification Preferences**
- Per-type toggle: new posts, upvotes, comments, announcements, mentions
- Per-room mute: mute specific rooms without leaving them
- Saved to `users.notifPrefs` + `roomMembers.notificationsEnabled`

**17. Mark Own Question as Resolved**
- Student who asked a question can mark it resolved (they found the answer)
- Mutation: `posts:markResolved`

**18. Join Rooms by Code**
- Student can join private rooms using a 6-character join code from the teacher
- Input at: `/rooms` → "Join with code" button
- Mutation: `rooms:join({ joinCode })`

---

### Project & Collaboration (2)

**19. Create a Group Project**
- Student can initiate a project board within a room
- Add teammates (room members only)
- Set project name, description, GitHub URL, due date
- Mutation: `projects:create` (to be implemented fully)

**20. Manage Project Tasks**
- Student can create, edit, and move Kanban tasks on their project board
- Drag-and-drop columns: Todo → In Progress → Review → Done
- Assign tasks to project members
- Mutation: `projectTasks:create/update/delete`

---

## 🛡️ Super Admin — Capabilities

Super admin is a system-level role, not a primary user-facing role.

| Capability | Description |
|-----------|-------------|
| View all rooms | Access to every room regardless of membership |
| Manage all users | Change roles, ban globally, view all profiles |
| System analytics | Platform-wide stats (total users, rooms, posts) |
| Global moderation | Delete any post, any room, globally |
| Assign teacher role | Upgrade a student to teacher |
| Audit all actions | View moderation logs across all rooms |

Super admin UI: simple admin panel at `/admin` (route protected by `super_admin` role check).

---

## Permission Check Reference Table

| Action | Student | Teacher | Moderator | Owner | Super Admin |
|--------|---------|---------|-----------|-------|------------|
| Create post | ✅ | ✅ | ✅ | ✅ | ✅ |
| Post announcement | ❌ | ✅ | ❌ | ✅* | ✅ |
| Edit own post | ✅ | ✅ | ✅ | ✅ | ✅ |
| Delete own post | ✅ | ✅ | ✅ | ✅ | ✅ |
| Delete others' posts | ❌ | ✅ | ✅** | ✅ | ✅ |
| Pin posts | ❌ | ✅ | ✅ | ✅ | ✅ |
| Flag posts | ❌ | ✅ | ✅ | ✅ | ✅ |
| Mute members | ❌ | ✅ | ✅ | ✅ | ✅ |
| Ban members | ❌ | ✅ | ❌ | ✅ | ✅ |
| View analytics | ❌ | ✅ | ❌ | ✅ | ✅ |
| Edit room settings | ❌ | ✅*** | ❌ | ✅ | ✅ |
| Archive room | ❌ | ✅*** | ❌ | ✅ | ✅ |
| View reported posts | ❌ | ✅ | ✅ | ✅ | ✅ |
| Create poll | ❌ | ✅ | ❌ | ✅* | ✅ |
| Repost any post cross-room | ❌ | ✅ | ❌ | ❌ | ✅ |

\* Owner can do this if they are also a teacher
\** Moderators can delete in their specific room only
\*** Teacher can edit rooms they created; Owner can edit rooms they own

---

*Continue to `09-ui-system.md` →*
