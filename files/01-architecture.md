# 01 — Architecture & System Design

## System Overview

```
┌──────────────────────────────────────────────────────────────────┐
│                        Browser (Next.js 14)                       │
│                                                                    │
│  ┌──────────┐  ┌──────────────┐  ┌───────────────┐  ┌─────────┐ │
│  │  Clerk   │  │  useQuery    │  │  useMutation  │  │  AI     │ │
│  │  Auth UI │  │  (live sub)  │  │  (optimistic) │  │  Hooks  │ │
│  └────┬─────┘  └──────┬───────┘  └───────┬───────┘  └────┬────┘ │
└───────┼───────────────┼──────────────────┼───────────────┼──────┘
        │               │                  │               │
        ▼               ▼                  ▼               ▼
┌───────────────────────────────────────────────────────────────┐
│                        Convex Cloud                            │
│                                                                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐ │
│  │   Queries    │  │  Mutations   │  │   Actions (async)    │ │
│  │  (read-only) │  │ (write+side  │  │  - Gemini AI calls   │ │
│  │  real-time   │  │  effects)    │  │  - Email via webhook │ │
│  └──────┬───────┘  └──────┬───────┘  └──────────────────────┘ │
│         └─────────────────┘                                    │
│                    ▼                                           │
│          ┌─────────────────────┐                              │
│          │      Convex DB      │                              │
│          │  (MongoDB-like,     │                              │
│          │   ACID, real-time)  │                              │
│          │                     │                              │
│          │  users              │                              │
│          │  rooms              │                              │
│          │  roomMembers        │                              │
│          │  posts              │                              │
│          │  comments           │                              │
│          │  votes              │                              │
│          │  reactions          │                              │
│          │  polls + pollVotes  │                              │
│          │  projects + tasks   │                              │
│          │  notifications      │                              │
│          │  moderationLogs     │                              │
│          │  aiResponses        │                              │
│          └─────────────────────┘                              │
└───────────────────────────────────────────────────────────────┘
        │                               │
        ▼                               ▼
┌───────────────┐              ┌────────────────────┐
│  Clerk        │              │  Google Gemini AI   │
│  (Identity)   │              │  (free 1.5 Flash)   │
│  JWT tokens   │              │  summarize, answer, │
│  Webhooks     │              │  moderate, detect   │
└───────────────┘              └────────────────────┘
```

---

## Real-Time Data Flow

```
Teacher posts an announcement
        │
        ▼
useMutation("posts:create") called with type="announcement"
        │
        ▼
Optimistic update: post appears INSTANTLY for teacher (no roundtrip)
        │
        ▼
Convex mutation runs on server:
  - Validates teacher role
  - Inserts post with isPinned=true, authorId set
  - Updates room.lastPostAt and room.postCount
  - Creates notification records for ALL room members
  - Triggers AI content moderation check (async action)
        │
        ▼
Convex invalidates all subscriptions for this room
        │
        ▼
Every useQuery("posts:getByRoom") subscriber receives new data
        │
        ▼
All students see the announcement — pinned at top — within ~100ms
        │
        ▼
Notification bell badge increments for all students in real-time
```

---

## Authentication & Authorization Flow

```
User visits uniboard.app
        │
        ▼
middleware.ts → Clerk session check
        │
        ├── No session → redirect /sign-in
        │
        └── Has session → ConvexProviderWithClerk wraps app
                │
                ▼
        Convex receives Clerk JWT automatically
        ctx.auth.getUserIdentity() available in all handlers
                │
                ▼
        First login → upsertFromClerk mutation runs
        User created in Convex with role="pending"
                │
                ▼
        Redirect to /onboarding
        User selects: role (teacher/student) + batch + department
                │
                ▼
        completeOnboarding mutation runs
        User role set, profile complete
                │
                ▼
        Redirect to /dashboard
```

---

## Role Hierarchy

```
super_admin
    └── Full system access (manage all rooms, users, ban, export)

teacher (per room)
    └── 20 features — see 08-roles-permissions.md
    └── Room owner: created the room
    └── Room moderator: assigned by owner

student
    └── 20 features — see 08-roles-permissions.md
    └── Room member: joined the room

guest (not implemented — kept for future)
    └── View public rooms, no post
```

---

## Layered Permission Model

Every Convex mutation enforces permissions at THREE layers:

```typescript
// Layer 1 — Authentication
const identity = await ctx.auth.getUserIdentity();
if (!identity) throw new Error("UNAUTHENTICATED");

// Layer 2 — User exists in DB
const user = await ctx.db.query("users")
  .withIndex("by_clerkId", q => q.eq("clerkId", identity.subject))
  .unique();
if (!user) throw new Error("USER_NOT_FOUND");

// Layer 3 — Permission check (role + room membership)
const membership = await ctx.db.query("roomMembers")
  .withIndex("by_roomId_userId", q =>
    q.eq("roomId", args.roomId).eq("userId", user._id))
  .unique();

const canPerformAction =
  user.role === "teacher" ||
  user.role === "super_admin" ||
  membership?.role === "owner" ||
  membership?.role === "moderator";

if (!canPerformAction) throw new Error("PERMISSION_DENIED");
```

---

## Anonymous Posting — Security Architecture

**Anonymity is enforced at the DATA layer, not the UI layer.**

```typescript
// In posts table — authorId is OPTIONAL
authorId: v.optional(v.id("users"))  // undefined = anonymous

// In create mutation — authorId conditionally set
const authorId = args.isAnonymous ? undefined : user._id;

// In query response — authorId NEVER sent to client for anonymous posts
if (post.isAnonymous || !post.authorId) {
  return {
    ...post,
    authorId: undefined,   // Stripped from payload
    author: { name: "Anonymous", imageUrl: null, role: "student" }
  };
}

// For teacher moderation: authorId stored in moderationLogs
// Teacher can request reveal — logged audit trail
// This is a future premium feature, foundation is laid now
```

---

## AI Integration Architecture

```
Client component triggers AI feature
        │
        ▼
Next.js API Route (/api/ai/*)
  OR Convex Action (for server-side, rate-limited)
        │
        ▼
Gemini 1.5 Flash API (free tier)
  - Model: gemini-1.5-flash
  - RPM: 15 requests/minute free
  - TPM: 1M tokens/minute free
  - TPD: 1.5B tokens/day free
        │
        ▼
Response streamed or returned to client
Response cached in Convex aiResponses table
  (cache key = hash of input, TTL = 1 hour)
        │
        ▼
UI renders AI output with clear "AI" badge
User can thumbs up/down AI response
```

---

## Post Type System

```typescript
type PostType =
  | "note"           // Lecture notes, summaries — any user
  | "deadline"       // Assignment/exam deadlines — any user, shows countdown
  | "question"       // Asking for help — shows unanswered badge, AI can answer
  | "resource"       // Links, PDFs, references — any user
  | "announcement"   // Teacher-only — auto-pinned, notifies all
  | "poll"           // Teacher-only — creates votable poll
  | "project"        // Links to a group project board

// Announcement rules:
//   - Only teacher/owner can create
//   - Auto-pinned on creation
//   - Notifies ALL room members (not just notification-enabled)
//   - Cannot be anonymous

// Question rules:
//   - Gets "Unanswered" badge until resolved
//   - AI Tutor watches unanswered questions > 30min and generates answer
//   - Author OR teacher can mark resolved
//   - Resolved questions show green "Answered" badge
```

---

## Unread Count Architecture

```
Room unread count for user X =
  COUNT(posts WHERE roomId = R AND createdAt > roomMembers.lastSeenAt)
  WHERE roomMembers.userId = X AND roomMembers.roomId = R

lastSeenAt is updated when:
  1. User opens the room (markSeen mutation)
  2. User posts in the room (they see their own post)

Displayed as:
  - Red badge on room in sidebar
  - Number on mobile nav "Rooms" icon
  - Total across all rooms in header
```

---

## Mobile Architecture

```
Desktop (≥1024px):
  ┌─────────────────┬──────────────────────────────────────┐
  │   Sidebar       │           Main Content               │
  │   (280px)       │                                      │
  │   - Logo        │   RoomHeader + PresenceBar           │
  │   - Search      │   ──────────────────────────         │
  │   - Nav         │   PinnedBanner (if pins exist)       │
  │   - Room list   │   ──────────────────────────         │
  │     + badges    │   PostFeed (infinite scroll)         │
  │   - User footer │                                      │
  └─────────────────┤   PostComposer (fixed bottom)        │
                    └──────────────────────────────────────┘

Tablet (768px–1023px):
  Same as desktop but sidebar collapses to icon-only (64px)
  Hover expands sidebar

Mobile (<768px):
  ┌─────────────────────────────────────┐
  │  Header: [Back] [Room Name] [⋮]    │
  ├─────────────────────────────────────┤
  │  PresenceBar (avatars row)          │
  ├─────────────────────────────────────┤
  │                                     │
  │  PostFeed (scrollable)              │
  │                                     │
  │  h-24 padding at bottom             │
  ├─────────────────────────────────────┤
  │  PostComposer (fixed, above nav)    │
  ├─────────────────────────────────────┤
  │  Bottom Nav [🏠][📚][🔔][👤]       │
  └─────────────────────────────────────┘
```

---

## Caching Strategy

| Data | Cache Location | TTL | Invalidation |
|------|---------------|-----|-------------|
| Room post feed | Convex real-time subscription | N/A (live) | On new post |
| Unread count | Convex real-time subscription | N/A (live) | On markSeen |
| AI summaries | `aiResponses` Convex table | 1 hour | Manual or on new post |
| User profile | Convex real-time subscription | N/A (live) | On profile update |
| Search results | Client state (SWR-like) | 30 seconds | On user search |

---

## Error Handling Strategy

Every mutation follows this pattern:

```typescript
// In mutation:
try {
  // ... business logic
} catch (err) {
  // Convex automatically rolls back DB writes on thrown errors
  throw new ConvexError({
    code: "PERMISSION_DENIED",
    message: "You don't have permission to do that",
  });
}

// On client:
const createPost = useMutation(api.posts.create);

const handleSubmit = async () => {
  try {
    await createPost({ ... });
  } catch (err) {
    if (err instanceof ConvexError) {
      toast.error(err.data.message);
    } else {
      toast.error("Something went wrong. Please try again.");
    }
  }
};
```

---

*Continue to `02-schema.md` →*
