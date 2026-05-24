import type { Doc, Id } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";

type Ctx = QueryCtx | MutationCtx;

export type PublicAuthor = {
  name: string;
  imageUrl: string | null;
  role: "student" | "teacher" | "admin" | "super_admin" | "pending";
};

export async function getCurrentUserOrThrow(ctx: Ctx): Promise<Doc<"users">> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error("Unauthenticated");
  }

  const user = await ctx.db
    .query("users")
    .withIndex("by_clerkId", (query) => query.eq("clerkId", identity.subject))
    .unique();

  if (!user) {
    throw new Error("User not found");
  }

  return user;
}

export async function getCurrentUser(ctx: Ctx): Promise<Doc<"users"> | null> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    return null;
  }

  return ctx.db
    .query("users")
    .withIndex("by_clerkId", (query) => query.eq("clerkId", identity.subject))
    .unique();
}

export async function getMembership(
  ctx: Ctx,
  roomId: Id<"rooms">,
  userId: Id<"users">
) {
  return ctx.db
    .query("roomMembers")
    .withIndex("by_roomId_userId", (query) => query.eq("roomId", roomId).eq("userId", userId))
    .unique();
}

export async function getRoomWithMembershipOrThrow(
  ctx: Ctx,
  roomId: Id<"rooms">,
  userId: Id<"users">
) {
  const room = await ctx.db.get(roomId);
  if (!room) {
    throw new Error("Room not found");
  }

  const membership = await getMembership(ctx, roomId, userId);
  if (!membership || membership.isBanned) {
    throw new Error("Not a member of this room");
  }

  return { room, membership };
}

export function canModerateRoom(user: Doc<"users">, membership: Doc<"roomMembers"> | null | undefined) {
  return (
    user.role === "teacher" ||
    user.role === "super_admin" ||
    membership?.role === "owner" ||
    membership?.role === "moderator"
  );
}

export function assertPortalAccess(user: Doc<"users">) {
  if (user.role === "pending") {
    throw new Error("Finish profile onboarding or wait for approval before using collaborative workspace actions.");
  }
}

export function isTeacherAccessRequested(user: Doc<"users">) {
  return (user.badges ?? []).includes("teacher_access_requested");
}

export async function createNotification(
  ctx: MutationCtx,
  notification: Omit<Doc<"notifications">, "_id" | "_creationTime">
) {
  return ctx.db.insert("notifications", notification);
}

export async function logModerationAction(
  ctx: MutationCtx,
  data: Omit<Doc<"moderationLogs">, "_id" | "_creationTime" | "createdAt"> & { createdAt?: number }
) {
  await ctx.db.insert("moderationLogs", {
    ...data,
    createdAt: data.createdAt ?? Date.now()
  });
}

export function buildPublicAuthor(
  isAnonymous: boolean,
  authorId: Id<"users"> | undefined,
  author: Doc<"users"> | null
): { authorId: Id<"users"> | undefined; author: PublicAuthor } {
  if (isAnonymous || !authorId) {
    return {
      authorId: undefined,
      author: {
        name: isAnonymous ? "Anonymous" : "UniBoard AI",
        imageUrl: null,
        role: isAnonymous ? "student" : "admin"
      }
    };
  }

  return {
    authorId,
    author: {
      name: author?.name ?? "Unknown",
      imageUrl: author?.imageUrl ?? null,
      role: author?.role ?? "student"
    }
  };
}

export function sanitizeAuthor(post: Doc<"posts">, author: Doc<"users"> | null) {
  return buildPublicAuthor(post.isAnonymous, post.authorId, author);
}
