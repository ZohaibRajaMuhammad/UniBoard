# 02 — Convex Schema (Complete)

## File: `convex/schema.ts`

```typescript
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({

  // ═══════════════════════════════════════════════════════
  // USERS
  // ═══════════════════════════════════════════════════════
  users: defineTable({
    clerkId:          v.string(),
    email:            v.string(),
    name:             v.string(),
    imageUrl:         v.optional(v.string()),
    bio:              v.optional(v.string()),          // "3rd year SE student | loves OSes"
    role: v.union(
      v.literal("student"),
      v.literal("teacher"),
      v.literal("super_admin"),
      v.literal("pending"),                            // Pre-onboarding
    ),
    batch:            v.optional(v.string()),           // "SP26-BS(SE)-AM"
    department:       v.optional(v.string()),           // "Software Engineering"
    studentId:        v.optional(v.string()),           // University roll number
    // Engagement stats (cached, updated via mutations)
    postCount:        v.number(),
    upvotesReceived:  v.number(),
    roomsJoined:      v.number(),
    // Badges earned
    badges:           v.array(v.string()),              // ["early_adopter", "top_contributor"]
    // Presence
    isOnline:         v.boolean(),
    lastActiveAt:     v.number(),
    joinedAt:         v.number(),
    // Preferences
    theme:            v.optional(v.string()),           // "dark" | "light" | "system"
    notifPrefs: v.optional(v.object({
      newPost:         v.boolean(),
      upvote:          v.boolean(),
      comment:         v.boolean(),
      announcement:    v.boolean(),
      mention:         v.boolean(),
    })),
  })
    .index("by_clerkId",    ["clerkId"])
    .index("by_email",      ["email"])
    .index("by_role",       ["role"])
    .index("by_batch",      ["batch"]),

  // ═══════════════════════════════════════════════════════
  // ROOMS
  // One room = one subject in one batch
  // ═══════════════════════════════════════════════════════
  rooms: defineTable({
    name:             v.string(),                       // "Parallel Computing"
    subject:          v.string(),                       // "CS-401"
    batch:            v.string(),                       // "SP26-BS(SE)-AM"
    description:      v.optional(v.string()),
    createdBy:        v.id("users"),
    isPublic:         v.boolean(),
    isArchived:       v.boolean(),                      // Archived rooms = read-only
    color:            v.string(),                       // Tailwind color name
    emoji:            v.string(),                       // Room emoji "📚"
    coverImageUrl:    v.optional(v.string()),           // Optional banner image
    // Cached counters
    memberCount:      v.number(),
    postCount:        v.number(),
    pinnedPostId:     v.optional(v.id("posts")),
    lastPostAt:       v.optional(v.number()),
    // Access control
    joinCode:         v.optional(v.string()),           // 6-char code for private rooms
    allowStudentInvite: v.boolean(),                    // Students can invite others?
    allowAnonymous:   v.boolean(),                      // Anonymous posts allowed?
    // Teacher config
    aiEnabled:        v.boolean(),                      // AI Tutor enabled for this room?
    createdAt:        v.number(),
    updatedAt:        v.number(),
  })
    .index("by_batch",       ["batch"])
    .index("by_lastPostAt",  ["lastPostAt"])
    .index("by_createdBy",   ["createdBy"])
    .index("by_joinCode",    ["joinCode"]),

  // ═══════════════════════════════════════════════════════
  // ROOM MEMBERS
  // Junction: user ↔ room
  // ═══════════════════════════════════════════════════════
  roomMembers: defineTable({
    roomId:           v.id("rooms"),
    userId:           v.id("users"),
    role: v.union(
      v.literal("member"),
      v.literal("moderator"),
      v.literal("owner"),
    ),
    lastSeenAt:       v.number(),
    joinedAt:         v.number(),
    notificationsEnabled: v.boolean(),
    isMuted:          v.boolean(),                      // Muted by moderator/owner
    mutedUntil:       v.optional(v.number()),           // Mute expiry timestamp
    isBanned:         v.boolean(),                      // Banned from room
    bannedBy:         v.optional(v.id("users")),
    bannedAt:         v.optional(v.number())),
    banReason:        v.optional(v.string()),
  })
    .index("by_roomId",          ["roomId"])
    .index("by_userId",          ["userId"])
    .index("by_roomId_userId",   ["roomId", "userId"]),

  // ═══════════════════════════════════════════════════════
  // POSTS
  // Core content unit — all types
  // ═══════════════════════════════════════════════════════
  posts: defineTable({
    roomId:           v.id("rooms"),
    authorId:         v.optional(v.id("users")),        // undefined = anonymous
    content:          v.string(),                       // Max 2000 chars
    type: v.union(
      v.literal("note"),
      v.literal("deadline"),
      v.literal("question"),
      v.literal("resource"),
      v.literal("announcement"),
      v.literal("poll"),
      v.literal("project"),
    ),
    // Type-specific metadata
    deadlineDate:     v.optional(v.number()),
    deadlineTitle:    v.optional(v.string()),
    resourceUrl:      v.optional(v.string()),
    resourceTitle:    v.optional(v.string()),
    resourceType:     v.optional(v.string()),           // "pdf" | "video" | "link" | "repo"
    pollId:           v.optional(v.id("polls")),
    projectId:        v.optional(v.id("projects")),
    // Tags
    tags:             v.optional(v.array(v.string())),  // ["midterm", "chapter3"]
    // Engagement (cached)
    upvoteCount:      v.number(),
    commentCount:     v.number(),
    shareCount:       v.number(),
    // State flags
    isPinned:         v.boolean(),
    isResolved:       v.boolean(),
    isAnonymous:      v.boolean(),
    isEdited:         v.boolean(),
    isHidden:         v.boolean(),                      // Hidden by author (not deleted)
    isDeleted:        v.boolean(),
    // Moderation
    isReported:       v.boolean(),
    reportCount:      v.number(),
    isFlagged:        v.boolean(),                      // Flagged by teacher/mod for review
    flagReason:       v.optional(v.string()),
    deletedBy:        v.optional(v.id("users")),
    deletedAt:        v.optional(v.number()),
    // AI
    aiSummary:        v.optional(v.string()),           // AI-generated summary
    aiAnswerId:       v.optional(v.id("aiResponses")), // For questions: AI answer
    // Timestamps
    createdAt:        v.number(),
    editedAt:         v.optional(v.number()),
  })
    .index("by_roomId",             ["roomId"])
    .index("by_roomId_createdAt",   ["roomId", "createdAt"])
    .index("by_roomId_type",        ["roomId", "type"])
    .index("by_roomId_pinned",      ["roomId", "isPinned"])
    .index("by_authorId",           ["authorId"])
    .index("by_type",               ["type"])
    .index("by_roomId_isReported",  ["roomId", "isReported"]),

  // ═══════════════════════════════════════════════════════
  // COMMENTS
  // Threaded comments on posts
  // ═══════════════════════════════════════════════════════
  comments: defineTable({
    postId:           v.id("posts"),
    roomId:           v.id("rooms"),
    authorId:         v.optional(v.id("users")),
    content:          v.string(),                       // Max 500 chars
    parentCommentId:  v.optional(v.id("comments")),    // For replies (1 level deep)
    isAnonymous:      v.boolean(),
    isDeleted:        v.boolean(),
    isEdited:         v.boolean(),
    upvoteCount:      v.number(),
    createdAt:        v.number(),
    editedAt:         v.optional(v.number()),
  })
    .index("by_postId",           ["postId"])
    .index("by_postId_createdAt", ["postId", "createdAt"])
    .index("by_authorId",         ["authorId"]),

  // ═══════════════════════════════════════════════════════
  // VOTES
  // Upvotes on posts AND comments
  // ═══════════════════════════════════════════════════════
  votes: defineTable({
    targetId:         v.string(),                       // postId or commentId as string
    targetType:       v.union(v.literal("post"), v.literal("comment")),
    userId:           v.id("users"),
    createdAt:        v.number(),
  })
    .index("by_targetId",          ["targetId"])
    .index("by_userId",            ["userId"])
    .index("by_targetId_userId",   ["targetId", "userId"]),

  // ═══════════════════════════════════════════════════════
  // REACTIONS
  // Emoji reactions on posts (like Twitter/Slack)
  // ═══════════════════════════════════════════════════════
  reactions: defineTable({
    postId:           v.id("posts"),
    userId:           v.id("users"),
    emoji:            v.string(),                       // "👍" | "❤️" | "😂" | "🔥" | "😮" | "😢"
    createdAt:        v.number(),
  })
    .index("by_postId",           ["postId"])
    .index("by_postId_userId",    ["postId", "userId"]),

  // ═══════════════════════════════════════════════════════
  // POLLS
  // Teacher-created polls
  // ═══════════════════════════════════════════════════════
  polls: defineTable({
    roomId:           v.id("rooms"),
    createdBy:        v.id("users"),
    question:         v.string(),
    options:          v.array(v.object({
      id:             v.string(),
      text:           v.string(),
      voteCount:      v.number(),                       // Cached
    })),
    isAnonymous:      v.boolean(),                      // Anonymous voting
    isClosed:         v.boolean(),
    closedAt:         v.optional(v.number()),
    totalVotes:       v.number(),                       // Cached
    expiresAt:        v.optional(v.number()),
    createdAt:        v.number(),
  })
    .index("by_roomId",   ["roomId"])
    .index("by_createdBy", ["createdBy"]),

  // Poll votes (who voted what)
  pollVotes: defineTable({
    pollId:           v.id("polls"),
    userId:           v.id("users"),
    optionId:         v.string(),
    createdAt:        v.number(),
  })
    .index("by_pollId",           ["pollId"])
    .index("by_pollId_userId",    ["pollId", "userId"]),

  // ═══════════════════════════════════════════════════════
  // PROJECTS
  // Group project boards (Kanban-style)
  // ═══════════════════════════════════════════════════════
  projects: defineTable({
    roomId:           v.id("rooms"),
    name:             v.string(),
    description:      v.optional(v.string()),
    createdBy:        v.id("users"),
    memberIds:        v.array(v.id("users")),
    status: v.union(
      v.literal("planning"),
      v.literal("active"),
      v.literal("completed"),
    ),
    dueDate:          v.optional(v.number()),
    githubUrl:        v.optional(v.string()),
    isPublic:         v.boolean(),                      // Visible to whole room?
    createdAt:        v.number(),
    updatedAt:        v.number(),
  })
    .index("by_roomId",   ["roomId"])
    .index("by_createdBy", ["createdBy"]),

  // Project tasks (Kanban cards)
  projectTasks: defineTable({
    projectId:        v.id("projects"),
    title:            v.string(),
    description:      v.optional(v.string()),
    assignedTo:       v.optional(v.id("users")),
    status: v.union(
      v.literal("todo"),
      v.literal("in_progress"),
      v.literal("review"),
      v.literal("done"),
    ),
    priority: v.union(
      v.literal("low"),
      v.literal("medium"),
      v.literal("high"),
    ),
    dueDate:          v.optional(v.number()),
    order:            v.number(),                       // For drag-and-drop ordering
    createdAt:        v.number(),
    updatedAt:        v.number(),
  })
    .index("by_projectId",         ["projectId"])
    .index("by_projectId_status",  ["projectId", "status"]),

  // ═══════════════════════════════════════════════════════
  // NOTIFICATIONS
  // ═══════════════════════════════════════════════════════
  notifications: defineTable({
    userId:           v.id("users"),
    type: v.union(
      v.literal("new_post"),
      v.literal("new_comment"),
      v.literal("upvote"),
      v.literal("comment_reply"),
      v.literal("question_answered"),
      v.literal("ai_answered"),
      v.literal("pinned"),
      v.literal("room_invite"),
      v.literal("announcement"),
      v.literal("poll_created"),
      v.literal("project_assigned"),
      v.literal("mention"),
      v.literal("badge_earned"),
    ),
    postId:           v.optional(v.id("posts")),
    commentId:        v.optional(v.id("comments")),
    roomId:           v.optional(v.id("rooms")),
    projectId:        v.optional(v.id("projects")),
    fromUserId:       v.optional(v.id("users")),
    message:          v.string(),
    isRead:           v.boolean(),
    createdAt:        v.number(),
  })
    .index("by_userId",            ["userId"])
    .index("by_userId_isRead",     ["userId", "isRead"])
    .index("by_userId_createdAt",  ["userId", "createdAt"]),

  // ═══════════════════════════════════════════════════════
  // AI RESPONSES
  // Cache AI-generated content
  // ═══════════════════════════════════════════════════════
  aiResponses: defineTable({
    type: v.union(
      v.literal("answer"),           // Answer to a question post
      v.literal("summary"),          // Room/thread summary
      v.literal("moderation"),       // Content moderation check
      v.literal("duplicate_check"), // Is this a duplicate question?
    ),
    inputHash:        v.string(),    // Hash of input for cache lookup
    prompt:           v.string(),
    response:         v.string(),
    postId:           v.optional(v.id("posts")),
    roomId:           v.optional(v.id("rooms")),
    thumbsUp:         v.number(),    // User feedback
    thumbsDown:       v.number(),
    createdAt:        v.number(),
    expiresAt:        v.number(),    // Cache TTL
  })
    .index("by_inputHash",  ["inputHash"])
    .index("by_postId",     ["postId"])
    .index("by_roomId",     ["roomId"]),

  // ═══════════════════════════════════════════════════════
  // MODERATION LOGS
  // Audit trail for teacher actions
  // ═══════════════════════════════════════════════════════
  moderationLogs: defineTable({
    roomId:           v.id("rooms"),
    actorId:          v.id("users"),   // Who performed the action
    targetPostId:     v.optional(v.id("posts")),
    targetUserId:     v.optional(v.id("users")),
    targetCommentId:  v.optional(v.id("comments")),
    action: v.union(
      v.literal("delete_post"),
      v.literal("delete_comment"),
      v.literal("pin_post"),
      v.literal("unpin_post"),
      v.literal("mute_member"),
      v.literal("unmute_member"),
      v.literal("ban_member"),
      v.literal("unban_member"),
      v.literal("promote_moderator"),
      v.literal("demote_moderator"),
      v.literal("resolve_question"),
      v.literal("flag_post"),
      v.literal("unflag_post"),
      v.literal("reveal_anonymous"), // Future: premium feature
    ),
    reason:           v.optional(v.string()),
    metadata:         v.optional(v.string()),  // JSON blob for extra context
    createdAt:        v.number(),
  })
    .index("by_roomId",       ["roomId"])
    .index("by_actorId",      ["actorId"])
    .index("by_roomId_createdAt", ["roomId", "createdAt"]),

  // ═══════════════════════════════════════════════════════
  // POST SHARES
  // Track reposts/shares
  // ═══════════════════════════════════════════════════════
  postShares: defineTable({
    originalPostId:   v.id("posts"),
    sharedByUserId:   v.id("users"),
    targetRoomId:     v.optional(v.id("rooms")),  // Shared to another room
    shareType: v.union(
      v.literal("repost"),          // Reposted in same room
      v.literal("cross_room"),      // Shared to another room
      v.literal("external"),        // Copied link externally
    ),
    newPostId:        v.optional(v.id("posts")),  // The repost post
    createdAt:        v.number(),
  })
    .index("by_originalPostId",  ["originalPostId"])
    .index("by_sharedByUserId",  ["sharedByUserId"]),

  // ═══════════════════════════════════════════════════════
  // SAVED POSTS
  // Bookmarks per user
  // ═══════════════════════════════════════════════════════
  savedPosts: defineTable({
    userId:           v.id("users"),
    postId:           v.id("posts"),
    createdAt:        v.number(),
  })
    .index("by_userId",          ["userId"])
    .index("by_userId_postId",   ["userId", "postId"]),
});
```

---

## Schema Design Decisions

### Why `reactions` is separate from `votes`

Reactions (emoji) and upvotes serve different UX purposes. Reactions are multi-type (multiple emojis per post), while upvotes are binary (one upvote per post). Keeping them separate makes queries cleaner and allows independent feature gates.

### Why `comments.parentCommentId` only goes 1 level deep

Unlimited nesting creates UX complexity (Reddit-style threading). 1 level of reply (comment → reply) hits the sweet spot for a university noticeboard — enough for conversation without infinite rabbit holes.

### Why `polls` and `pollVotes` are separate tables

A poll options array on the poll record works for display, but individual votes need to be tracked per-user for uniqueness enforcement and anonymous voting (can't store userId on the poll itself).

### Why `projectTasks.order` is a number

For drag-and-drop Kanban reordering. When a task is moved, we only update its `order` value. Tasks are sorted by `order` within each `status` column.

### Why `aiResponses.inputHash` for caching

Multiple users asking the same question in the same room shouldn't each trigger an AI call. Hash the input (room context + question text) and return cached response if it exists and hasn't expired.

### Why `moderationLogs` is never deleted

It's an immutable audit trail. Teachers can review all moderation actions for accountability. Super admins can audit teacher behavior. This builds institutional trust in the platform.

---

*Continue to `03-queries.md` →*
