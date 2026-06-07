/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as ai from "../ai.js";
import type * as analytics from "../analytics.js";
import type * as assignments from "../assignments.js";
import type * as comments from "../comments.js";
import type * as devSeed from "../devSeed.js";
import type * as lib from "../lib.js";
import type * as notifications from "../notifications.js";
import type * as planner from "../planner.js";
import type * as posts from "../posts.js";
import type * as reputation from "../reputation.js";
import type * as rooms from "../rooms.js";
import type * as users from "../users.js";
import type * as votes from "../votes.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  ai: typeof ai;
  analytics: typeof analytics;
  assignments: typeof assignments;
  comments: typeof comments;
  devSeed: typeof devSeed;
  lib: typeof lib;
  notifications: typeof notifications;
  planner: typeof planner;
  posts: typeof posts;
  reputation: typeof reputation;
  rooms: typeof rooms;
  users: typeof users;
  votes: typeof votes;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
