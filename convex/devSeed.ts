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
    const students = args.users
      .filter((user) => user.role === "student")
      .map((user) => insertedUsers.get(user.clerkId))
      .filter((userId): userId is Id<"users"> => userId !== undefined);

    if (!teacher || !superAdmin || students.length < 3) {
      throw new Error("Seed users are incomplete");
    }

    const roomConfigs = [
      {
        name: "Parallel Computing",
        subject: "CS-401",
        description: "High-signal room for notes, deadlines, labs, and class announcements.",
        color: "indigo",
        emoji: "💻",
        isPublic: true,
        allowAnonymous: true,
        aiEnabled: true
      },
      {
        name: "Software Design Studio",
        subject: "SE-320",
        description: "Project-heavy collaboration space with resources, Q&A, and design reviews.",
        color: "teal",
        emoji: "🧠",
        isPublic: false,
        allowAnonymous: false,
        aiEnabled: false
      }
    ] as const;

    const roomIds: Id<"rooms">[] = [];
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
        memberCount: students.length + 2,
        postCount: 0,
        pinnedPostId: undefined,
        lastPostAt: now - index * 3_600_000,
        joinCode: roomConfig.isPublic ? undefined : "SE320X",
        allowStudentInvite: true,
        allowAnonymous: roomConfig.allowAnonymous,
        aiEnabled: roomConfig.aiEnabled,
        createdAt: now - (7 - index) * 86_400_000,
        updatedAt: now - index * 7_200_000
      });

      roomIds.push(roomId);

      const members: Id<"users">[] = [teacher, superAdmin, ...students];
      for (const memberId of members) {
        await ctx.db.insert("roomMembers", {
          roomId,
          userId: memberId,
          role: memberId === teacher ? "owner" : memberId === students[0] && index === 0 ? "moderator" : "member",
          lastSeenAt: now - 15 * 60_000,
          joinedAt: now - 6 * 86_400_000,
          notificationsEnabled: true,
          isMuted: false,
          isBanned: false
        });
      }
    }

    const [parallelRoom, designRoom] = roomIds;
    const [studentA, studentB, studentC] = students;

    const postSpecs: Array<{
      roomId: Id<"rooms">;
      authorId: Id<"users">;
      type: "announcement" | "question" | "deadline" | "resource" | "note";
      content: string;
      tags: string[];
      isAnonymous: boolean;
      isPinned: boolean;
      isResolved: boolean;
      resourceTitle?: string;
      resourceUrl?: string;
      deadlineTitle?: string;
      deadlineDate?: number;
      commentCount: number;
      upvoteCount: number;
      shareCount: number;
    }> = [
      {
        roomId: parallelRoom,
        authorId: teacher,
        type: "announcement",
        content: "Midterm format is locked. Review chapters 1-6 and bring your lab notebook.",
        tags: ["midterm", "important"],
        isAnonymous: false,
        isPinned: true,
        isResolved: false,
        commentCount: 2,
        upvoteCount: 4,
        shareCount: 1
      },
      {
        roomId: parallelRoom,
        authorId: studentA,
        type: "question",
        content: "Can someone explain the difference between SIMD and MIMD with one practical example each?",
        tags: ["architecture", "revision"],
        isAnonymous: true,
        isPinned: false,
        isResolved: false,
        commentCount: 2,
        upvoteCount: 3,
        shareCount: 0
      },
      {
        roomId: parallelRoom,
        authorId: teacher,
        type: "deadline",
        content: "Lab 5 report submission closes this week. Keep results, screenshots, and a short interpretation section.",
        tags: ["lab5", "deadline"],
        isAnonymous: false,
        isPinned: false,
        isResolved: false,
        deadlineTitle: "Lab 5 Report",
        deadlineDate: now + 3 * 86_400_000,
        commentCount: 1,
        upvoteCount: 5,
        shareCount: 0
      },
      {
        roomId: designRoom,
        authorId: studentB,
        type: "resource",
        content: "This system design checklist is clean and actionable for our next review.",
        tags: ["design", "review"],
        isAnonymous: false,
        isPinned: false,
        isResolved: false,
        resourceTitle: "Architecture Review Checklist",
        resourceUrl: "https://example.com/architecture-review-checklist",
        commentCount: 1,
        upvoteCount: 2,
        shareCount: 0
      },
      {
        roomId: designRoom,
        authorId: studentC,
        type: "note",
        content: "Today's takeaway: define failure boundaries early, otherwise every service leaks responsibility into the next.",
        tags: ["notes", "architecture"],
        isAnonymous: false,
        isPinned: false,
        isResolved: false,
        commentCount: 0,
        upvoteCount: 3,
        shareCount: 1
      }
    ];

    const postIds: Id<"posts">[] = [];
    for (const [index, postSpec] of postSpecs.entries()) {
      const createdAt = now - (postSpecs.length - index) * 7_200_000;
      const postId = await ctx.db.insert("posts", {
        roomId: postSpec.roomId,
        authorId: postSpec.isAnonymous ? undefined : postSpec.authorId,
        content: postSpec.content,
        type: postSpec.type,
        tags: postSpec.tags,
        deadlineDate: postSpec.deadlineDate,
        deadlineTitle: postSpec.deadlineTitle,
        resourceUrl: postSpec.resourceUrl,
        resourceTitle: postSpec.resourceTitle,
        resourceType: postSpec.resourceUrl ? "link" : undefined,
        upvoteCount: postSpec.upvoteCount,
        commentCount: postSpec.commentCount,
        shareCount: postSpec.shareCount,
        isPinned: postSpec.isPinned,
        isResolved: postSpec.isResolved,
        isAnonymous: postSpec.isAnonymous,
        isEdited: false,
        isHidden: false,
        isDeleted: false,
        isReported: postSpec.type === "question",
        reportCount: postSpec.type === "question" ? 1 : 0,
        isFlagged: postSpec.type === "question",
        flagReason: postSpec.type === "question" ? "Needs teacher follow-up" : undefined,
        createdAt
      });
      postIds.push(postId);
    }

    await ctx.db.patch(parallelRoom, {
      postCount: 3,
      pinnedPostId: postIds[0],
      lastPostAt: now - 2 * 3_600_000,
      updatedAt: now - 2 * 3_600_000
    });
    await ctx.db.patch(designRoom, {
      postCount: 2,
      lastPostAt: now - 3_600_000,
      updatedAt: now - 3_600_000
    });

    const comments: Array<{
      postId: Id<"posts">;
      roomId: Id<"rooms">;
      authorId: Id<"users">;
      content: string;
      isAnonymous: boolean;
      parentCommentId?: Id<"comments">;
    }> = [
      {
        postId: postIds[1],
        roomId: parallelRoom,
        authorId: teacher,
        content: "Use SIMD when one instruction stream can apply to many data points, like image filters.",
        isAnonymous: false
      },
      {
        postId: postIds[1],
        roomId: parallelRoom,
        authorId: studentB,
        content: "MIMD is closer to multiple processors working on different tasks at the same time.",
        isAnonymous: false
      },
      {
        postId: postIds[0],
        roomId: parallelRoom,
        authorId: studentA,
        content: "Will the midterm include numerical scheduling questions?",
        isAnonymous: false
      },
      {
        postId: postIds[3],
        roomId: designRoom,
        authorId: teacher,
        content: "Good find. Add this to the next presentation deck.",
        isAnonymous: false
      }
    ];

    for (const [index, comment] of comments.entries()) {
      await ctx.db.insert("comments", {
        postId: comment.postId,
        roomId: comment.roomId,
        authorId: comment.authorId,
        content: comment.content,
        parentCommentId: comment.parentCommentId,
        isAnonymous: comment.isAnonymous,
        isDeleted: false,
        isEdited: false,
        upvoteCount: index === 0 ? 2 : 0,
        createdAt: now - (comments.length - index) * 3_600_000
      });
    }

    const votes: Array<{ targetId: Id<"posts">; userId: Id<"users"> }> = [
      { targetId: postIds[0], userId: studentA },
      { targetId: postIds[0], userId: studentB },
      { targetId: postIds[0], userId: studentC },
      { targetId: postIds[0], userId: superAdmin },
      { targetId: postIds[1], userId: studentB },
      { targetId: postIds[1], userId: studentC },
      { targetId: postIds[1], userId: teacher },
      { targetId: postIds[2], userId: studentA },
      { targetId: postIds[2], userId: studentB },
      { targetId: postIds[2], userId: studentC },
      { targetId: postIds[2], userId: superAdmin },
      { targetId: postIds[2], userId: teacher }
    ];

    for (const vote of votes) {
      await ctx.db.insert("votes", {
        targetId: vote.targetId,
        targetType: "post",
        userId: vote.userId,
        createdAt: now - 90 * 60_000
      });
    }

    const reactions: Array<{ postId: Id<"posts">; userId: Id<"users">; emoji: string }> = [
      { postId: postIds[0], userId: studentA, emoji: "🔥" },
      { postId: postIds[0], userId: studentB, emoji: "👍" },
      { postId: postIds[1], userId: teacher, emoji: "😮" },
      { postId: postIds[2], userId: studentC, emoji: "👍" },
      { postId: postIds[3], userId: teacher, emoji: "❤️" }
    ];

    for (const reaction of reactions) {
      await ctx.db.insert("reactions", {
        postId: reaction.postId,
        userId: reaction.userId,
        emoji: reaction.emoji,
        createdAt: now - 45 * 60_000
      });
    }

    await ctx.db.insert("savedPosts", {
      userId: studentA,
      postId: postIds[0],
      createdAt: now - 40 * 60_000
    });
    await ctx.db.insert("savedPosts", {
      userId: studentB,
      postId: postIds[3],
      createdAt: now - 35 * 60_000
    });

    await ctx.db.insert("postShares", {
      originalPostId: postIds[0],
      sharedByUserId: studentC,
      targetRoomId: designRoom,
      shareType: "cross_room",
      newPostId: postIds[4],
      createdAt: now - 20 * 60_000
    });

    const notifications: Array<{
      userId: Id<"users">;
      type: "announcement" | "new_comment" | "question_answered";
      postId: Id<"posts">;
      roomId: Id<"rooms">;
      fromUserId: Id<"users">;
      message: string;
    }> = [
      {
        userId: studentA,
        type: "announcement",
        postId: postIds[0],
        roomId: parallelRoom,
        fromUserId: teacher,
        message: "New announcement in Parallel Computing"
      },
      {
        userId: teacher,
        type: "new_comment",
        postId: postIds[0],
        roomId: parallelRoom,
        fromUserId: studentA,
        message: "A student commented on your announcement"
      },
      {
        userId: studentB,
        type: "question_answered",
        postId: postIds[1],
        roomId: parallelRoom,
        fromUserId: teacher,
        message: "Teacher follow-up is available on the SIMD/MIMD thread"
      }
    ];

    for (const [index, notification] of notifications.entries()) {
      await ctx.db.insert("notifications", {
        userId: notification.userId,
        type: notification.type,
        postId: notification.postId,
        roomId: notification.roomId,
        fromUserId: notification.fromUserId,
        message: notification.message,
        isRead: index === 0,
        createdAt: now - (index + 1) * 30 * 60_000
      });
    }

    await ctx.db.insert("moderationLogs", {
      roomId: parallelRoom,
      actorId: teacher,
      targetPostId: postIds[1],
      action: "flag_post",
      reason: "Needs teacher follow-up",
      createdAt: now - 50 * 60_000
    });

    for (const user of args.users) {
      const userId = insertedUsers.get(user.clerkId);
      if (!userId) {
        continue;
      }

      await ctx.db.patch(userId, {
        roomsJoined: 2,
        postCount: postSpecs.filter((post) => post.authorId === userId).length,
        upvotesReceived: postSpecs
          .filter((post) => post.authorId === userId)
          .reduce((total, post) => total + post.upvoteCount, 0)
      });
    }

    return {
      users: args.users.length,
      rooms: roomIds.length,
      posts: postIds.length,
      comments: comments.length
    };
  }
});
