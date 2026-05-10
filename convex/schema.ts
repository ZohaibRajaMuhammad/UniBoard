import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export const roleValidator = v.union(
  v.literal("student"),
  v.literal("teacher"),
  v.literal("admin"),
  v.literal("super_admin"),
  v.literal("pending")
);

export const roomRoleValidator = v.union(v.literal("member"), v.literal("moderator"), v.literal("owner"));

export const postTypeValidator = v.union(
  v.literal("note"),
  v.literal("deadline"),
  v.literal("question"),
  v.literal("resource"),
  v.literal("announcement"),
  v.literal("poll"),
  v.literal("project")
);

const notificationTypeValidator = v.union(
  v.literal("new_post"),
  v.literal("new_comment"),
  v.literal("upvote"),
  v.literal("comment_reply"),
  v.literal("question_answered"),
  v.literal("pinned"),
  v.literal("room_invite"),
  v.literal("announcement")
);

const moderationActionValidator = v.union(
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
  v.literal("unflag_post")
);

export default defineSchema({
  users: defineTable({
    clerkId: v.string(),
    email: v.string(),
    name: v.string(),
    imageUrl: v.optional(v.string()),
    bio: v.optional(v.string()),
    role: roleValidator,
    batch: v.optional(v.string()),
    department: v.optional(v.string()),
    studentId: v.optional(v.string()),
    postCount: v.optional(v.number()),
    upvotesReceived: v.optional(v.number()),
    roomsJoined: v.optional(v.number()),
    badges: v.optional(v.array(v.string())),
    isOnline: v.boolean(),
    lastActiveAt: v.number(),
    joinedAt: v.number(),
    theme: v.optional(v.string()),
    notifPrefs: v.optional(
      v.object({
        newPost: v.boolean(),
        upvote: v.boolean(),
        comment: v.boolean(),
        announcement: v.boolean(),
        mention: v.boolean()
      })
    )
  })
    .index("by_clerkId", ["clerkId"])
    .index("by_email", ["email"])
    .index("by_role", ["role"])
    .index("by_batch", ["batch"]),

  rooms: defineTable({
    name: v.string(),
    subject: v.string(),
    batch: v.string(),
    description: v.optional(v.string()),
    createdBy: v.id("users"),
    isPublic: v.boolean(),
    isArchived: v.optional(v.boolean()),
    color: v.string(),
    emoji: v.string(),
    coverImageUrl: v.optional(v.string()),
    memberCount: v.number(),
    postCount: v.number(),
    pinnedPostId: v.optional(v.id("posts")),
    lastPostAt: v.optional(v.number()),
    joinCode: v.optional(v.string()),
    allowStudentInvite: v.optional(v.boolean()),
    allowAnonymous: v.optional(v.boolean()),
    aiEnabled: v.optional(v.boolean()),
    createdAt: v.number(),
    updatedAt: v.optional(v.number())
  })
    .index("by_batch", ["batch"])
    .index("by_lastPostAt", ["lastPostAt"])
    .index("by_createdBy", ["createdBy"])
    .index("by_joinCode", ["joinCode"]),

  roomMembers: defineTable({
    roomId: v.id("rooms"),
    userId: v.id("users"),
    role: roomRoleValidator,
    lastSeenAt: v.number(),
    joinedAt: v.number(),
    notificationsEnabled: v.boolean(),
    isMuted: v.optional(v.boolean()),
    mutedUntil: v.optional(v.number()),
    isBanned: v.optional(v.boolean()),
    bannedBy: v.optional(v.id("users")),
    bannedAt: v.optional(v.number()),
    banReason: v.optional(v.string())
  })
    .index("by_roomId", ["roomId"])
    .index("by_userId", ["userId"])
    .index("by_roomId_userId", ["roomId", "userId"]),

  posts: defineTable({
    roomId: v.id("rooms"),
    authorId: v.optional(v.id("users")),
    content: v.string(),
    type: postTypeValidator,
    deadlineDate: v.optional(v.number()),
    deadlineTitle: v.optional(v.string()),
    resourceUrl: v.optional(v.string()),
    resourceTitle: v.optional(v.string()),
    resourceType: v.optional(v.string()),
    pollId: v.optional(v.string()),
    projectId: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    upvoteCount: v.number(),
    commentCount: v.optional(v.number()),
    shareCount: v.optional(v.number()),
    isPinned: v.boolean(),
    isResolved: v.boolean(),
    isAnonymous: v.boolean(),
    isEdited: v.optional(v.boolean()),
    isHidden: v.optional(v.boolean()),
    isDeleted: v.boolean(),
    isReported: v.optional(v.boolean()),
    reportCount: v.optional(v.number()),
    isFlagged: v.optional(v.boolean()),
    flagReason: v.optional(v.string()),
    deletedBy: v.optional(v.id("users")),
    deletedAt: v.optional(v.number()),
    aiSummary: v.optional(v.string()),
    aiAnswerId: v.optional(v.string()),
    createdAt: v.number(),
    editedAt: v.optional(v.number())
  })
    .index("by_roomId", ["roomId"])
    .index("by_roomId_createdAt", ["roomId", "createdAt"])
    .index("by_roomId_type", ["roomId", "type"])
    .index("by_roomId_pinned", ["roomId", "isPinned"])
    .index("by_authorId", ["authorId"])
    .index("by_type", ["type"])
    .index("by_roomId_isReported", ["roomId", "isReported"]),

  comments: defineTable({
    postId: v.id("posts"),
    roomId: v.id("rooms"),
    authorId: v.optional(v.id("users")),
    content: v.string(),
    parentCommentId: v.optional(v.id("comments")),
    isAnonymous: v.boolean(),
    isDeleted: v.boolean(),
    isEdited: v.boolean(),
    upvoteCount: v.number(),
    createdAt: v.number(),
    editedAt: v.optional(v.number())
  })
    .index("by_postId", ["postId"])
    .index("by_postId_createdAt", ["postId", "createdAt"])
    .index("by_authorId", ["authorId"]),

  votes: defineTable({
    targetId: v.optional(v.string()),
    targetType: v.optional(v.union(v.literal("post"), v.literal("comment"))),
    postId: v.optional(v.id("posts")),
    userId: v.id("users"),
    createdAt: v.number()
  })
    .index("by_targetId", ["targetId"])
    .index("by_userId", ["userId"])
    .index("by_targetId_userId", ["targetId", "userId"])
    .index("by_postId", ["postId"])
    .index("by_postId_userId", ["postId", "userId"]),

  reactions: defineTable({
    postId: v.id("posts"),
    userId: v.id("users"),
    emoji: v.string(),
    createdAt: v.number()
  })
    .index("by_postId", ["postId"])
    .index("by_postId_userId", ["postId", "userId"]),

  notifications: defineTable({
    userId: v.id("users"),
    type: notificationTypeValidator,
    postId: v.optional(v.id("posts")),
    commentId: v.optional(v.id("comments")),
    roomId: v.optional(v.id("rooms")),
    fromUserId: v.optional(v.id("users")),
    message: v.string(),
    isRead: v.boolean(),
    createdAt: v.number()
  })
    .index("by_userId", ["userId"])
    .index("by_userId_isRead", ["userId", "isRead"])
    .index("by_userId_createdAt", ["userId", "createdAt"]),

  moderationLogs: defineTable({
    roomId: v.id("rooms"),
    actorId: v.id("users"),
    targetPostId: v.optional(v.id("posts")),
    targetUserId: v.optional(v.id("users")),
    targetCommentId: v.optional(v.id("comments")),
    action: moderationActionValidator,
    reason: v.optional(v.string()),
    metadata: v.optional(v.string()),
    createdAt: v.number()
  })
    .index("by_roomId", ["roomId"])
    .index("by_actorId", ["actorId"])
    .index("by_roomId_createdAt", ["roomId", "createdAt"]),

  postShares: defineTable({
    originalPostId: v.id("posts"),
    sharedByUserId: v.id("users"),
    targetRoomId: v.optional(v.id("rooms")),
    shareType: v.union(v.literal("repost"), v.literal("cross_room"), v.literal("external")),
    newPostId: v.optional(v.id("posts")),
    createdAt: v.number()
  })
    .index("by_originalPostId", ["originalPostId"])
    .index("by_sharedByUserId", ["sharedByUserId"]),

  savedPosts: defineTable({
    userId: v.id("users"),
    postId: v.id("posts"),
    createdAt: v.number()
  })
    .index("by_userId", ["userId"])
    .index("by_userId_postId", ["userId", "postId"]),

  plannerDeadlines: defineTable({
    userId: v.id("users"),
    roomId: v.optional(v.id("rooms")),
    title: v.string(),
    notes: v.optional(v.string()),
    dueDate: v.number(),
    estimatedMinutes: v.optional(v.number()),
    completed: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number()
  })
    .index("by_userId_dueDate", ["userId", "dueDate"])
    .index("by_userId_completed", ["userId", "completed"])
});
