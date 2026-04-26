import type { Doc, Id } from "../../convex/_generated/dataModel";

export type Room = Doc<"rooms">;
export type Post = Doc<"posts">;
export type Notification = Doc<"notifications">;
export type RoomId = Id<"rooms">;
export type PostId = Id<"posts">;
