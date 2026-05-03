import type { Id } from "./_generated/dataModel";
import { mutation } from "./_generated/server";
import { v } from "convex/values";

const seedUserValidator = v.object({
  clerkId: v.string(),
  email: v.string(),
  name: v.string(),
  imageUrl: v.optional(v.string()),
  role: v.union(v.literal("student"), v.literal("teacher"), v.literal("super_admin")),
  batch: v.string(),
  department: v.string(),
  studentId: v.optional(v.string()),
  bio: v.string()
});

const DEV_SEED_KEY = "uniboard-dev-seed-2026";

type NotificationType =
  | "new_post"
  | "new_comment"
  | "upvote"
  | "comment_reply"
  | "question_answered"
  | "pinned"
  | "room_invite"
  | "announcement";

type ModerationAction =
  | "delete_post"
  | "delete_comment"
  | "pin_post"
  | "unpin_post"
  | "mute_member"
  | "unmute_member"
  | "ban_member"
  | "unban_member"
  | "promote_moderator"
  | "demote_moderator"
  | "resolve_question"
  | "flag_post"
  | "unflag_post";

type SeedPostSpec = {
  key: string;
  roomKey: string;
  authorId: Id<"users">;
  type: "announcement" | "question" | "deadline" | "resource" | "note";
  content: string;
  tags: string[];
  isAnonymous: boolean;
  isPinned: boolean;
  isResolved: boolean;
  isReported?: boolean;
  reportCount?: number;
  isFlagged?: boolean;
  flagReason?: string;
  deadlineTitle?: string;
  deadlineDate?: number;
  resourceTitle?: string;
  resourceUrl?: string;
};

type SeedCommentSpec = {
  key: string;
  postKey: string;
  roomKey: string;
  authorId: Id<"users">;
  content: string;
  isAnonymous: boolean;
  parentCommentKey?: string;
};

export const resetAndSeed = mutation({
  args: {
    key: v.string(),
    users: v.array(seedUserValidator)
  },
  handler: async (ctx, args) => {
    if (args.key !== DEV_SEED_KEY) {
      throw new Error("Invalid seed key");
    }

    const tableNames = [
      "savedPosts",
      "postShares",
      "moderationLogs",
      "notifications",
      "reactions",
      "votes",
      "comments",
      "posts",
      "roomMembers",
      "rooms",
      "users"
    ] as const;

    for (const tableName of tableNames) {
      const docs = await ctx.db.query(tableName).collect();
      for (const doc of docs) {
        await ctx.db.delete(doc._id);
      }
    }

    const now = Date.now();
    const usersByRole = new Map<string, string>();
    const insertedUsers = new Map<string, Id<"users">>();

    for (const [index, user] of args.users.entries()) {
      const userId = await ctx.db.insert("users", {
        clerkId: user.clerkId,
        email: user.email,
        name: user.name,
        imageUrl: user.imageUrl,
        bio: user.bio,
        role: user.role,
        batch: user.batch,
        department: user.department,
        studentId: user.studentId,
        postCount: 0,
        upvotesReceived: 0,
        roomsJoined: 0,
        badges: index < 3 ? ["early_adopter", "top_contributor"] : ["early_adopter"],
        isOnline: true,
        lastActiveAt: now - index * 60_000,
        joinedAt: now - (index + 2) * 86_400_000,
        notifPrefs: {
          newPost: true,
          upvote: true,
          comment: true,
          announcement: true,
          mention: true
        }
      });

      insertedUsers.set(user.clerkId, userId);
      if (!usersByRole.has(user.role)) {
        usersByRole.set(user.role, user.clerkId);
      }
    }

    const teacher = insertedUsers.get(usersByRole.get("teacher") ?? "");
    const superAdmin = insertedUsers.get(usersByRole.get("super_admin") ?? "");
    const studentEntries = args.users
      .filter((user) => user.role === "student")
      .map((user) => ({
        ...user,
        userId: insertedUsers.get(user.clerkId)
      }))
      .filter((user): user is typeof user & { userId: Id<"users"> } => user.userId !== undefined);

    if (!teacher || !superAdmin || studentEntries.length < 4) {
      throw new Error("Seed users are incomplete");
    }

    const userIdByEmail = new Map(args.users.map((user) => [user.email, insertedUsers.get(user.clerkId)]));
    const userIdsByKey = {
      teacher,
      superAdmin,
      zohaib: userIdByEmail.get("zohaib99080@gmail.com") as Id<"users">,
      sara: userIdByEmail.get("student.sara.uniboard@example.com") as Id<"users">,
      hamza: userIdByEmail.get("student.hamza.uniboard@example.com") as Id<"users">,
      mina: userIdByEmail.get("student.mina.uniboard@example.com") as Id<"users">,
      aleena: userIdByEmail.get("student.aleena.uniboard@example.com") as Id<"users">,
      ai: userIdByEmail.get("uniboard.ai@example.com") as Id<"users">
    } as const;

    const allMembers: Id<"users">[] = [
      teacher,
      superAdmin,
      userIdsByKey.zohaib,
      userIdsByKey.sara,
      userIdsByKey.hamza,
      userIdsByKey.mina,
      userIdsByKey.aleena,
      userIdsByKey.ai
    ];

    const roomConfigs = [
      {
        key: "ai",
        name: "AI Systems Lab",
        subject: "CS-445",
        description: "Models, labs, inference notes, prompts, and deployment reviews.",
        color: "indigo",
        emoji: "AI",
        isPublic: true,
        allowAnonymous: true,
        aiEnabled: true,
        joinCode: undefined
      },
      {
        key: "design",
        name: "Software Design Studio",
        subject: "SE-320",
        description: "Architecture reviews, diagrams, studio critiques, and sprint checkpoints.",
        color: "teal",
        emoji: "SD",
        isPublic: false,
        allowAnonymous: false,
        aiEnabled: false,
        joinCode: "SE320X"
      },
      {
        key: "db",
        name: "Database Engineering",
        subject: "CS-350",
        description: "Query tuning, schema reviews, labs, and exam-focused revision threads.",
        color: "emerald",
        emoji: "DB",
        isPublic: true,
        allowAnonymous: true,
        aiEnabled: false,
        joinCode: undefined
      },
      {
        key: "fyp",
        name: "Final Year Project War Room",
        subject: "SE-499",
        description: "Project planning, blockers, demos, deliverables, and advisor announcements.",
        color: "amber",
        emoji: "FY",
        isPublic: false,
        allowAnonymous: false,
        aiEnabled: true,
        joinCode: "FYP499"
      }
    ] as const;

    const roomIdsByKey = new Map<string, Id<"rooms">>();
    for (const [index, roomConfig] of roomConfigs.entries()) {
      const roomId = await ctx.db.insert("rooms", {
        name: roomConfig.name,
        subject: roomConfig.subject,
        batch: "SP26-BS(SE)-AM",
        description: roomConfig.description,
        createdBy: teacher,
        isPublic: roomConfig.isPublic,
        isArchived: false,
        color: roomConfig.color,
        emoji: roomConfig.emoji,
        memberCount: allMembers.length,
        postCount: 0,
        pinnedPostId: undefined,
        lastPostAt: now - index * 3_600_000,
        joinCode: roomConfig.joinCode,
        allowStudentInvite: true,
        allowAnonymous: roomConfig.allowAnonymous,
        aiEnabled: roomConfig.aiEnabled,
        createdAt: now - (10 - index) * 86_400_000,
        updatedAt: now - index * 7_200_000
      });
      roomIdsByKey.set(roomConfig.key, roomId);

      for (const memberId of allMembers) {
        const isOwner = memberId === teacher;
        const isModerator =
          (roomConfig.key === "ai" && memberId === userIdsByKey.zohaib) ||
          (roomConfig.key === "db" && memberId === userIdsByKey.hamza) ||
          (roomConfig.key === "fyp" && memberId === superAdmin);
        const isMuted = roomConfig.key === "design" && memberId === userIdsByKey.aleena;

        await ctx.db.insert("roomMembers", {
          roomId,
          userId: memberId,
          role: isOwner ? "owner" : isModerator ? "moderator" : "member",
          lastSeenAt: now - (memberId === userIdsByKey.zohaib ? 15 : 180) * 60_000,
          joinedAt: now - (6 + index) * 86_400_000,
          notificationsEnabled: memberId !== userIdsByKey.aleena,
          isMuted,
          mutedUntil: isMuted ? now + 12 * 60 * 60 * 1000 : undefined,
          isBanned: false
        });
      }
    }

    const postSpecs: SeedPostSpec[] = [
      {
        key: "ai_announcement",
        roomKey: "ai",
        authorId: teacher,
        type: "announcement" as const,
        content: "Model evaluation plan is final. Focus on precision, recall, F1, and an ablation table in the report.",
        tags: ["evaluation", "important"],
        isAnonymous: false,
        isPinned: true,
        isResolved: false
      },
      {
        key: "ai_question",
        roomKey: "ai",
        authorId: userIdsByKey.zohaib,
        type: "question" as const,
        content: "What is the clearest way to explain overfitting vs data leakage in tomorrow's presentation?",
        tags: ["revision", "presentation"],
        isAnonymous: true,
        isPinned: false,
        isResolved: false,
        isReported: true,
        reportCount: 2,
        isFlagged: true,
        flagReason: "Needs teacher follow-up"
      },
      {
        key: "ai_deadline",
        roomKey: "ai",
        authorId: teacher,
        type: "deadline" as const,
        content: "Lab 6 submission closes this Friday. Include notebook, export, and two failure cases.",
        tags: ["lab6", "deadline"],
        isAnonymous: false,
        isPinned: false,
        isResolved: false,
        deadlineTitle: "AI Lab 6",
        deadlineDate: now + 2 * 86_400_000
      },
      {
        key: "ai_resource",
        roomKey: "ai",
        authorId: userIdsByKey.hamza,
        type: "resource" as const,
        content: "This confusion-matrix walkthrough is concise enough for pre-demo revision.",
        tags: ["metrics", "resource"],
        isAnonymous: false,
        isPinned: false,
        isResolved: false,
        resourceTitle: "Confusion Matrix Quick Guide",
        resourceUrl: "https://example.com/confusion-matrix-guide"
      },
      {
        key: "design_announcement",
        roomKey: "design",
        authorId: teacher,
        type: "announcement" as const,
        content: "Studio review starts at 11:00 sharp. Bring the latest sequence diagram and deployment view.",
        tags: ["studio", "review"],
        isAnonymous: false,
        isPinned: true,
        isResolved: false
      },
      {
        key: "design_note",
        roomKey: "design",
        authorId: userIdsByKey.mina,
        type: "note" as const,
        content: "Design note: define service ownership first, then shape APIs around failure boundaries instead of happy paths.",
        tags: ["architecture", "notes"],
        isAnonymous: false,
        isPinned: false,
        isResolved: false
      },
      {
        key: "design_question",
        roomKey: "design",
        authorId: userIdsByKey.sara,
        type: "question" as const,
        content: "Should our notification worker own retries, or should retries stay inside the queueing layer?",
        tags: ["queues", "ownership"],
        isAnonymous: false,
        isPinned: false,
        isResolved: true
      },
      {
        key: "design_resource",
        roomKey: "design",
        authorId: superAdmin,
        type: "resource" as const,
        content: "Sharing a lightweight architecture review checklist for the next round of room demos.",
        tags: ["checklist", "review"],
        isAnonymous: false,
        isPinned: false,
        isResolved: false,
        resourceTitle: "Architecture Review Checklist",
        resourceUrl: "https://example.com/architecture-review-checklist"
      },
      {
        key: "db_announcement",
        roomKey: "db",
        authorId: teacher,
        type: "announcement" as const,
        content: "Query optimization quiz will emphasize indexing strategy, joins, and execution plan interpretation.",
        tags: ["quiz", "important"],
        isAnonymous: false,
        isPinned: true,
        isResolved: false
      },
      {
        key: "db_deadline",
        roomKey: "db",
        authorId: teacher,
        type: "deadline" as const,
        content: "Normalization worksheet must be uploaded before the practical starts.",
        tags: ["worksheet", "deadline"],
        isAnonymous: false,
        isPinned: false,
        isResolved: false,
        deadlineTitle: "Normalization Worksheet",
        deadlineDate: now + 5 * 86_400_000
      },
      {
        key: "db_question",
        roomKey: "db",
        authorId: userIdsByKey.aleena,
        type: "question" as const,
        content: "Why does a covering index help here if the query still filters on a low-cardinality column?",
        tags: ["indexes", "query-plan"],
        isAnonymous: true,
        isPinned: false,
        isResolved: false
      },
      {
        key: "db_note",
        roomKey: "db",
        authorId: userIdsByKey.zohaib,
        type: "note" as const,
        content: "Remember: third normal form removes transitive dependency, but denormalization can still be valid for read-heavy workloads.",
        tags: ["normalization", "revision"],
        isAnonymous: false,
        isPinned: false,
        isResolved: false
      },
      {
        key: "fyp_announcement",
        roomKey: "fyp",
        authorId: teacher,
        type: "announcement" as const,
        content: "Final demo order is published. Team leads must upload deck, repo link, and deployment URL before noon.",
        tags: ["fyp", "demo"],
        isAnonymous: false,
        isPinned: true,
        isResolved: false
      },
      {
        key: "fyp_deadline",
        roomKey: "fyp",
        authorId: superAdmin,
        type: "deadline" as const,
        content: "Compliance sheet and supervisor approval form are due this weekend.",
        tags: ["compliance", "approval"],
        isAnonymous: false,
        isPinned: false,
        isResolved: false,
        deadlineTitle: "Approval Pack",
        deadlineDate: now + 7 * 86_400_000
      },
      {
        key: "fyp_resource",
        roomKey: "fyp",
        authorId: userIdsByKey.hamza,
        type: "resource" as const,
        content: "This release checklist is useful before staging demos and final submission handoff.",
        tags: ["release", "deployment"],
        isAnonymous: false,
        isPinned: false,
        isResolved: false,
        resourceTitle: "Release Readiness Checklist",
        resourceUrl: "https://example.com/release-readiness"
      },
      {
        key: "fyp_note",
        roomKey: "fyp",
        authorId: userIdsByKey.mina,
        type: "note" as const,
        content: "Project rooms work better when blockers, ownership, and demo risks are posted separately instead of inside one long thread.",
        tags: ["process", "project-management"],
        isAnonymous: false,
        isPinned: false,
        isResolved: false
      }
    ];

    const commentSpecs: SeedCommentSpec[] = [
      { key: "c1", postKey: "ai_question", roomKey: "ai", authorId: teacher, content: "Frame overfitting as memorization and leakage as invalid information crossing the train-test boundary.", isAnonymous: false },
      { key: "c2", postKey: "ai_question", roomKey: "ai", authorId: userIdsByKey.sara, content: "A small example table with leaked target-derived features usually lands well in presentations.", isAnonymous: false },
      { key: "c3", postKey: "ai_announcement", roomKey: "ai", authorId: userIdsByKey.zohaib, content: "Will the report need confidence intervals for the ablation table as well?", isAnonymous: false },
      { key: "c4", postKey: "ai_announcement", roomKey: "ai", authorId: teacher, content: "Yes. Include them where the comparison is close enough to create ambiguity.", isAnonymous: false, parentCommentKey: "c3" },
      { key: "c5", postKey: "ai_deadline", roomKey: "ai", authorId: userIdsByKey.hamza, content: "Can we submit one notebook plus a separate PDF summary?", isAnonymous: false },
      { key: "c6", postKey: "design_question", roomKey: "design", authorId: teacher, content: "Keep retries in infrastructure unless domain rules require semantic retry decisions.", isAnonymous: false },
      { key: "c7", postKey: "design_question", roomKey: "design", authorId: superAdmin, content: "Also log retry exhaustion centrally so ops can triage it without reading application traces.", isAnonymous: false },
      { key: "c8", postKey: "design_resource", roomKey: "design", authorId: userIdsByKey.mina, content: "Adding this checklist into our next review deck.", isAnonymous: false },
      { key: "c9", postKey: "db_question", roomKey: "db", authorId: teacher, content: "Because the covering index avoids extra heap lookups even when selectivity is not ideal.", isAnonymous: false },
      { key: "c10", postKey: "db_question", roomKey: "db", authorId: userIdsByKey.hamza, content: "Try comparing the execution plan costs before and after adding included columns.", isAnonymous: false },
      { key: "c11", postKey: "db_deadline", roomKey: "db", authorId: userIdsByKey.zohaib, content: "Uploading tonight so the practical checklist stays clear tomorrow morning.", isAnonymous: false },
      { key: "c12", postKey: "fyp_announcement", roomKey: "fyp", authorId: userIdsByKey.mina, content: "Should the deployment URL point to staging or production-like hosting?", isAnonymous: false },
      { key: "c13", postKey: "fyp_announcement", roomKey: "fyp", authorId: teacher, content: "Use the environment that reviewers can access reliably without setup friction.", isAnonymous: false, parentCommentKey: "c12" },
      { key: "c14", postKey: "fyp_resource", roomKey: "fyp", authorId: userIdsByKey.aleena, content: "The rollback section in that checklist is the part most teams usually forget.", isAnonymous: false }
    ];

    const voteSpecs = [
      { postKey: "ai_announcement", userId: userIdsByKey.zohaib },
      { postKey: "ai_announcement", userId: userIdsByKey.sara },
      { postKey: "ai_announcement", userId: userIdsByKey.hamza },
      { postKey: "ai_announcement", userId: userIdsByKey.mina },
      { postKey: "ai_announcement", userId: superAdmin },
      { postKey: "ai_question", userId: teacher },
      { postKey: "ai_question", userId: userIdsByKey.sara },
      { postKey: "ai_question", userId: userIdsByKey.hamza },
      { postKey: "ai_deadline", userId: userIdsByKey.zohaib },
      { postKey: "ai_deadline", userId: userIdsByKey.sara },
      { postKey: "ai_deadline", userId: superAdmin },
      { postKey: "ai_resource", userId: userIdsByKey.mina },
      { postKey: "design_announcement", userId: userIdsByKey.zohaib },
      { postKey: "design_announcement", userId: userIdsByKey.mina },
      { postKey: "design_announcement", userId: superAdmin },
      { postKey: "design_note", userId: teacher },
      { postKey: "design_note", userId: userIdsByKey.sara },
      { postKey: "design_question", userId: teacher },
      { postKey: "design_question", userId: superAdmin },
      { postKey: "design_question", userId: userIdsByKey.hamza },
      { postKey: "design_resource", userId: userIdsByKey.mina },
      { postKey: "db_announcement", userId: userIdsByKey.zohaib },
      { postKey: "db_announcement", userId: userIdsByKey.hamza },
      { postKey: "db_announcement", userId: userIdsByKey.aleena },
      { postKey: "db_deadline", userId: teacher },
      { postKey: "db_deadline", userId: superAdmin },
      { postKey: "db_deadline", userId: userIdsByKey.sara },
      { postKey: "db_question", userId: teacher },
      { postKey: "db_question", userId: userIdsByKey.zohaib },
      { postKey: "db_note", userId: userIdsByKey.sara },
      { postKey: "db_note", userId: userIdsByKey.hamza },
      { postKey: "fyp_announcement", userId: userIdsByKey.zohaib },
      { postKey: "fyp_announcement", userId: userIdsByKey.sara },
      { postKey: "fyp_announcement", userId: userIdsByKey.mina },
      { postKey: "fyp_deadline", userId: teacher },
      { postKey: "fyp_deadline", userId: userIdsByKey.hamza },
      { postKey: "fyp_deadline", userId: userIdsByKey.aleena },
      { postKey: "fyp_resource", userId: teacher },
      { postKey: "fyp_resource", userId: superAdmin },
      { postKey: "fyp_note", userId: userIdsByKey.zohaib }
    ] as const;

    const reactionSpecs = [
      { postKey: "ai_announcement", userId: userIdsByKey.zohaib, emoji: "🔥" },
      { postKey: "ai_announcement", userId: userIdsByKey.sara, emoji: "👍" },
      { postKey: "ai_question", userId: teacher, emoji: "😮" },
      { postKey: "design_note", userId: userIdsByKey.hamza, emoji: "❤️" },
      { postKey: "design_question", userId: teacher, emoji: "👍" },
      { postKey: "db_deadline", userId: userIdsByKey.zohaib, emoji: "🔥" },
      { postKey: "db_question", userId: teacher, emoji: "😮" },
      { postKey: "fyp_announcement", userId: superAdmin, emoji: "👍" },
      { postKey: "fyp_resource", userId: userIdsByKey.mina, emoji: "❤️" }
    ] as const;

    const savedPostSpecs = [
      { userId: userIdsByKey.zohaib, postKey: "ai_announcement" },
      { userId: userIdsByKey.zohaib, postKey: "db_deadline" },
      { userId: userIdsByKey.sara, postKey: "design_resource" },
      { userId: userIdsByKey.hamza, postKey: "fyp_resource" },
      { userId: userIdsByKey.mina, postKey: "fyp_announcement" }
    ] as const;

    const shareSpecs = [
      { postKey: "ai_announcement", sharedByUserId: userIdsByKey.mina, targetRoomKey: "fyp", newPostKey: "fyp_note", shareType: "cross_room" as const },
      { postKey: "design_resource", sharedByUserId: userIdsByKey.hamza, targetRoomKey: "db", newPostKey: "db_note", shareType: "cross_room" as const },
      { postKey: "fyp_resource", sharedByUserId: userIdsByKey.zohaib, targetRoomKey: "ai", newPostKey: "ai_resource", shareType: "cross_room" as const }
    ] as const;

    const notificationSpecs: Array<{
      userId: Id<"users">;
      type: NotificationType;
      postKey?: string;
      roomKey: string;
      commentKey?: string;
      fromUserId?: Id<"users">;
      message: string;
      isRead: boolean;
    }> = [
      { userId: userIdsByKey.zohaib, type: "announcement", postKey: "ai_announcement", roomKey: "ai", fromUserId: teacher, message: "New announcement in AI Systems Lab", isRead: false },
      { userId: teacher, type: "new_comment", postKey: "ai_announcement", roomKey: "ai", fromUserId: userIdsByKey.zohaib, message: "Zohaib commented on your pinned announcement", isRead: false },
      { userId: userIdsByKey.sara, type: "question_answered", postKey: "design_question", roomKey: "design", fromUserId: teacher, message: "Your software design question was resolved", isRead: false },
      { userId: userIdsByKey.hamza, type: "upvote", postKey: "ai_resource", roomKey: "ai", fromUserId: userIdsByKey.mina, message: "Mina upvoted your resource post", isRead: true },
      { userId: userIdsByKey.mina, type: "pinned", postKey: "design_note", roomKey: "design", fromUserId: teacher, message: "Teacher pinned a post from your room workflow", isRead: false },
      { userId: superAdmin, type: "room_invite", roomKey: "fyp", fromUserId: teacher, message: "You were added to Final Year Project War Room", isRead: true },
      { userId: userIdsByKey.aleena, type: "new_post", postKey: "db_announcement", roomKey: "db", fromUserId: teacher, message: "New post in Database Engineering", isRead: false },
      { userId: userIdsByKey.zohaib, type: "comment_reply", postKey: "ai_announcement", roomKey: "ai", commentKey: "c4", fromUserId: teacher, message: "Teacher replied to your comment", isRead: false }
    ];

    const moderationSpecs: Array<{
      roomKey: string;
      actorId: Id<"users">;
      targetPostKey?: string;
      targetUserId?: Id<"users">;
      action: ModerationAction;
      reason?: string;
    }> = [
      { roomKey: "ai", actorId: teacher, targetPostKey: "ai_question", action: "flag_post", reason: "Needs teacher follow-up" },
      { roomKey: "design", actorId: teacher, targetUserId: userIdsByKey.aleena, action: "mute_member", reason: "Cooldown after repeated off-topic messages" },
      { roomKey: "db", actorId: teacher, targetUserId: userIdsByKey.hamza, action: "promote_moderator" },
      { roomKey: "fyp", actorId: superAdmin, targetPostKey: "fyp_announcement", action: "pin_post" }
    ];

    const countByPostKey = <T extends { postKey: string }>(items: readonly T[]) => {
      const counts = new Map<string, number>();
      for (const item of items) {
        counts.set(item.postKey, (counts.get(item.postKey) ?? 0) + 1);
      }
      return counts;
    };

    const commentCounts = countByPostKey(commentSpecs);
    const voteCounts = countByPostKey(voteSpecs);
    const shareCounts = countByPostKey(shareSpecs);
    const postIdsByKey = new Map<string, Id<"posts">>();
    const postCreatedAtByKey = new Map<string, number>();

    for (const [index, postSpec] of postSpecs.entries()) {
      const roomId = roomIdsByKey.get(postSpec.roomKey);
      if (!roomId) {
        throw new Error(`Missing room for ${postSpec.key}`);
      }

      const createdAt = now - (postSpecs.length - index) * 5_400_000;
      const postId = await ctx.db.insert("posts", {
        roomId,
        authorId: postSpec.isAnonymous ? undefined : postSpec.authorId,
        content: postSpec.content,
        type: postSpec.type,
        tags: postSpec.tags,
        deadlineDate: "deadlineDate" in postSpec ? postSpec.deadlineDate : undefined,
        deadlineTitle: "deadlineTitle" in postSpec ? postSpec.deadlineTitle : undefined,
        resourceUrl: "resourceUrl" in postSpec ? postSpec.resourceUrl : undefined,
        resourceTitle: "resourceTitle" in postSpec ? postSpec.resourceTitle : undefined,
        resourceType: "resourceUrl" in postSpec ? "link" : undefined,
        upvoteCount: voteCounts.get(postSpec.key) ?? 0,
        commentCount: commentCounts.get(postSpec.key) ?? 0,
        shareCount: shareCounts.get(postSpec.key) ?? 0,
        isPinned: postSpec.isPinned,
        isResolved: postSpec.isResolved,
        isAnonymous: postSpec.isAnonymous,
        isEdited: false,
        isHidden: false,
        isDeleted: false,
        isReported: "isReported" in postSpec ? postSpec.isReported : false,
        reportCount: "reportCount" in postSpec ? postSpec.reportCount : 0,
        isFlagged: "isFlagged" in postSpec ? postSpec.isFlagged : false,
        flagReason: "flagReason" in postSpec ? postSpec.flagReason : undefined,
        createdAt
      });
      postIdsByKey.set(postSpec.key, postId);
      postCreatedAtByKey.set(postSpec.key, createdAt);
    }

    const roomStats = new Map<string, { postCount: number; lastPostAt: number; pinnedPostId?: Id<"posts"> }>();
    for (const postSpec of postSpecs) {
      const postId = postIdsByKey.get(postSpec.key);
      const createdAt = postCreatedAtByKey.get(postSpec.key);
      if (!postId || createdAt === undefined) {
        continue;
      }
      const stats = roomStats.get(postSpec.roomKey) ?? { postCount: 0, lastPostAt: 0 };
      stats.postCount += 1;
      stats.lastPostAt = Math.max(stats.lastPostAt, createdAt);
      if (postSpec.isPinned) {
        stats.pinnedPostId = postId;
      }
      roomStats.set(postSpec.roomKey, stats);
    }

    for (const roomConfig of roomConfigs) {
      const roomId = roomIdsByKey.get(roomConfig.key);
      const stats = roomStats.get(roomConfig.key);
      if (!roomId || !stats) {
        continue;
      }
      await ctx.db.patch(roomId, {
        postCount: stats.postCount,
        pinnedPostId: stats.pinnedPostId,
        lastPostAt: stats.lastPostAt,
        updatedAt: stats.lastPostAt
      });
    }

    const commentIdsByKey = new Map<string, Id<"comments">>();
    for (const [index, commentSpec] of commentSpecs.entries()) {
      const postId = postIdsByKey.get(commentSpec.postKey);
      const roomId = roomIdsByKey.get(commentSpec.roomKey);
      if (!postId || !roomId) {
        continue;
      }

      const commentId = await ctx.db.insert("comments", {
        postId,
        roomId,
        authorId: commentSpec.authorId,
        content: commentSpec.content,
        parentCommentId: commentSpec.parentCommentKey ? commentIdsByKey.get(commentSpec.parentCommentKey) : undefined,
        isAnonymous: commentSpec.isAnonymous,
        isDeleted: false,
        isEdited: false,
        upvoteCount: index % 3 === 0 ? 2 : 0,
        createdAt: now - (commentSpecs.length - index) * 2_700_000
      });
      commentIdsByKey.set(commentSpec.key, commentId);
    }

    for (const [index, voteSpec] of voteSpecs.entries()) {
      const postId = postIdsByKey.get(voteSpec.postKey);
      if (!postId) {
        continue;
      }
      await ctx.db.insert("votes", {
        targetId: postId,
        targetType: "post",
        postId,
        userId: voteSpec.userId,
        createdAt: now - (voteSpecs.length - index) * 600_000
      });
    }

    for (const [index, reactionSpec] of reactionSpecs.entries()) {
      const postId = postIdsByKey.get(reactionSpec.postKey);
      if (!postId) {
        continue;
      }
      await ctx.db.insert("reactions", {
        postId,
        userId: reactionSpec.userId,
        emoji: reactionSpec.emoji,
        createdAt: now - (reactionSpecs.length - index) * 420_000
      });
    }

    for (const [index, savedPost] of savedPostSpecs.entries()) {
      const postId = postIdsByKey.get(savedPost.postKey);
      if (!postId) {
        continue;
      }
      await ctx.db.insert("savedPosts", {
        userId: savedPost.userId,
        postId,
        createdAt: now - (savedPostSpecs.length - index) * 480_000
      });
    }

    for (const [index, shareSpec] of shareSpecs.entries()) {
      const originalPostId = postIdsByKey.get(shareSpec.postKey);
      const targetRoomId = roomIdsByKey.get(shareSpec.targetRoomKey);
      const newPostId = postIdsByKey.get(shareSpec.newPostKey);
      if (!originalPostId || !targetRoomId || !newPostId) {
        continue;
      }
      await ctx.db.insert("postShares", {
        originalPostId,
        sharedByUserId: shareSpec.sharedByUserId,
        targetRoomId,
        shareType: shareSpec.shareType,
        newPostId,
        createdAt: now - (shareSpecs.length - index) * 300_000
      });
    }

    for (const [index, notification] of notificationSpecs.entries()) {
      await ctx.db.insert("notifications", {
        userId: notification.userId,
        type: notification.type,
        postId: notification.postKey ? postIdsByKey.get(notification.postKey) : undefined,
        roomId: roomIdsByKey.get(notification.roomKey),
        commentId: notification.commentKey ? commentIdsByKey.get(notification.commentKey) : undefined,
        fromUserId: notification.fromUserId,
        message: notification.message,
        isRead: notification.isRead,
        createdAt: now - (notificationSpecs.length - index) * 900_000
      });
    }

    for (const [index, moderation] of moderationSpecs.entries()) {
      const roomId = roomIdsByKey.get(moderation.roomKey);
      if (!roomId) {
        continue;
      }
      await ctx.db.insert("moderationLogs", {
        roomId,
        actorId: moderation.actorId,
        targetPostId: moderation.targetPostKey ? postIdsByKey.get(moderation.targetPostKey) : undefined,
        targetUserId: moderation.targetUserId,
        action: moderation.action,
        reason: moderation.reason,
        createdAt: now - (moderationSpecs.length - index) * 750_000
      });
    }

    for (const user of args.users) {
      const userId = insertedUsers.get(user.clerkId);
      if (!userId) {
        continue;
      }

      const authoredPosts = postSpecs.filter((post) => !post.isAnonymous && post.authorId === userId);
      await ctx.db.patch(userId, {
        roomsJoined: roomConfigs.length,
        postCount: authoredPosts.length,
        upvotesReceived: authoredPosts.reduce((total, post) => total + (voteCounts.get(post.key) ?? 0), 0)
      });
    }

    return {
      users: args.users.length,
      rooms: roomConfigs.length,
      posts: postSpecs.length,
      comments: commentSpecs.length
    };
  }
});
