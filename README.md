# UniBoard Codebase Guide

UniBoard is an AI-assisted academic collaboration workspace for students, teachers, and super admins. It organizes class rooms, posts, comments, deadlines, saved resources, planner tasks, notifications, analytics, moderation, and grounded AI tools in one Next.js + Convex application.

This README is written as a beginner-friendly map of the codebase. If you are new to the project, read it from top to bottom once, then use the folder guide and feature flow sections when changing code.

---

## 1. Demo Accounts

The demo seed recreates these Clerk users and fills Convex with matching data.

| Role | Email | Password | What to test |
| --- | --- | --- | --- |
| Super admin | `davidshead0@gmail.com` | `DavidAdmin123!` | Admin page, room governance, all rooms, moderation, analytics |
| Teacher | `robinseo82@gmail.com` | `RobinTeacher123!` | Teacher tools, room ownership, announcements, moderation |
| Student | `zohaib99080@gmail.com` | `ZohaibStudent123!` | Dashboard, rooms, posts, comments, planner, saved posts |

Supporting seeded accounts:

| Role | Email | Password |
| --- | --- | --- |
| Student | `student.sara.uniboard@example.com` | `StudentSara123!` |
| Student | `student.hamza.uniboard@example.com` | `StudentHamza123!` |
| Student | `student.mina.uniboard@example.com` | `StudentMina123!` |
| Student | `student.aleena.uniboard@example.com` | `StudentAleena123!` |
| System account | `uniboard.ai@example.com` | `UniBoardAI123!` |

Latest seed contents:

- `8` users
- `4` rooms
- `18` posts
- `18` comments
- `11` planner deadlines
- `11` notifications
- `9` saved posts
- `6` moderation logs
- votes, reactions, shares, room memberships, public/private rooms, deadlines, and role-specific data

Run the seed:

```bash
npm run seed:demo
```

Important: the seed deletes and recreates demo data in the configured Convex deployment. It also recreates the Clerk demo users. After running it, log out and log back in.

---

## 2. Technology Stack

UniBoard uses:

- **Next.js App Router** for pages, layouts, routing, API routes, and server rendering.
- **React** for UI components.
- **TypeScript** for safer code and editor help.
- **Tailwind CSS** plus custom CSS variables for styling.
- **Convex** for the backend database, queries, mutations, auth integration, and live data.
- **Clerk** for authentication and user sessions.
- **OpenAI API** for optional AI features.
- **Playwright** for browser-level E2E tests.
- **Vitest** for unit tests.
- **Framer Motion** for smooth custom UI transitions.
- **Radix UI** for accessible dialogs and controls.

Think of the app as three connected layers:

1. **Frontend UI** in `src/`
2. **Backend/database logic** in `convex/`
3. **Integration scripts/tests/config** in `scripts/`, `tests/`, and root config files

---

## 3. Project Structure

```text
.
├── convex/
├── public/
├── scripts/
├── src/
│   ├── app/
│   ├── components/
│   ├── hooks/
│   ├── lib/
│   └── types/
├── tests/
├── package.json
├── next.config.mjs
├── tailwind.config.ts
├── tsconfig.json
└── README.md
```

### `src/app`

This is the Next.js App Router directory. Each folder maps to a route.

Important route groups:

- `src/app/page.tsx`: public landing page.
- `src/app/layout.tsx`: root layout; wraps the whole app with providers.
- `src/app/(auth)/sign-in/page.tsx`: sign-in page.
- `src/app/(auth)/sign-up/page.tsx`: sign-up page.
- `src/app/(dashboard)/layout.tsx`: authenticated dashboard shell with sidebar, mobile nav, AI assistant, and theme controls.
- `src/app/(dashboard)/dashboard/page.tsx`: main dashboard.
- `src/app/(dashboard)/rooms/page.tsx`: room discovery and join/create room screen.
- `src/app/(dashboard)/rooms/[roomId]/page.tsx`: single room feed and teacher tools.
- `src/app/(dashboard)/planner/page.tsx`: study planner and exports.
- `src/app/(dashboard)/admin/page.tsx`: super admin governance page.
- `src/app/api/...`: server API routes for AI and webhooks.

The `(auth)` and `(dashboard)` folders are route groups. They organize code without adding those folder names to URLs.

Example:

```text
src/app/(dashboard)/rooms/page.tsx
```

becomes:

```text
/rooms
```

not:

```text
/(dashboard)/rooms
```

---

## 4. Root Layout and Providers

The root file is:

```text
src/app/layout.tsx
```

It decides whether the app is configured correctly. If environment variables are missing, it shows `DeploymentSetupNotice`.

When configured, it wraps the app with:

- `ClerkProvider`
- `ConvexClientProvider`
- `ThemeProvider`
- `NotificationProvider`

These providers are important because many components assume auth, Convex, theme, and notifications are available.

Provider files:

```text
src/components/providers/ConvexClientProvider.tsx
src/components/providers/ThemeProvider.tsx
src/components/providers/NotificationProvider.tsx
```

---

## 5. Authentication Flow

Authentication is handled by Clerk.

Middleware:

```text
src/middleware.ts
```

The middleware uses Clerk only when Clerk server config is valid. This prevents Vercel middleware crashes when env vars are missing.

Dashboard protection:

```text
src/app/(dashboard)/layout.tsx
```

This layout:

1. Checks whether Clerk is configured.
2. Reads the current Clerk session.
3. Redirects unauthenticated users to `/sign-in`.
4. Renders dashboard navigation for authenticated users.

Current Convex user hook:

```text
src/hooks/useCurrentUser.ts
```

This hook:

1. Reads the Clerk user from `useUser`.
2. Reads the Convex user from `api.users.getCurrentUser`.
3. Creates/syncs the Convex user if needed.

Beginner note: Clerk knows who logged in. Convex stores the app-specific user profile, role, batch, badges, preferences, and activity.

---

## 6. Convex Backend

Convex files live in:

```text
convex/
```

Important files:

| File | Purpose |
| --- | --- |
| `schema.ts` | Database table definitions and indexes |
| `users.ts` | User profile, roles, onboarding, admin user actions |
| `rooms.ts` | Rooms, memberships, room settings, teacher/admin room actions |
| `posts.ts` | Posts, search, deadlines, saves, reposts, moderation actions |
| `comments.ts` | Comment threads |
| `notifications.ts` | User notifications |
| `planner.ts` | Study planner snapshot, manual deadlines, calendar export |
| `analytics.ts` | Workspace and public analytics |
| `reputation.ts` | XP, leaderboard, activity |
| `ai.ts` | AI knowledge data functions |
| `devSeed.ts` | Full demo seed mutation |
| `lib.ts` | Shared auth and permission helpers |
| `auth.config.ts` | Clerk JWT provider config for Convex |

Convex query vs mutation:

- A **query** reads data.
- A **mutation** changes data.

Example query:

```ts
export const getMyRooms = query({
  args: {},
  handler: async (ctx) => {
    // read room memberships and rooms
  }
});
```

Example mutation:

```ts
export const create = mutation({
  args: { name: v.string() },
  handler: async (ctx, args) => {
    // insert a new room
  }
});
```

Frontend calls Convex with:

```ts
const rooms = useQuery(api.rooms.getMyRooms);
const createRoom = useMutation(api.rooms.create);
```

---

## 7. Database Tables

The schema is in:

```text
convex/schema.ts
```

Main tables:

| Table | Meaning |
| --- | --- |
| `users` | App users synced from Clerk |
| `rooms` | Academic workspaces |
| `roomMembers` | Which users belong to which rooms |
| `posts` | Notes, questions, deadlines, resources, announcements |
| `comments` | Threaded discussion under posts |
| `votes` | Upvotes |
| `reactions` | Emoji reactions |
| `notifications` | User notification inbox |
| `moderationLogs` | Teacher/admin moderation history |
| `postShares` | Reposts and cross-room shares |
| `savedPosts` | User saved posts |
| `plannerDeadlines` | Manual planner deadlines |

Indexes are defined in the schema so Convex can query efficiently.

Example:

```ts
.index("by_userId", ["userId"])
```

This means Convex can quickly find rows for a specific `userId`.

---

## 8. Roles and Permissions

Supported roles:

- `student`
- `teacher`
- `super_admin`
- `pending`
- `admin` exists in schema but the main seeded flows use `super_admin`

Permission helpers live in:

```text
convex/lib.ts
```

Typical rules:

- Students can join rooms, post, comment, save posts, and use planner tools.
- Teachers can create public rooms, post announcements, moderate room content, and manage members.
- Super admins can access the admin page, manage governed accounts, archive/restore rooms, and inspect platform governance data.
- Pending users have limited access until onboarding/approval is complete.

---

## 9. UI Component System

Shared components live in:

```text
src/components/
```

Key folders:

| Folder | Purpose |
| --- | --- |
| `ai/` | Floating AI assistant |
| `brand/` | Logo and brand components |
| `feed/` | Post cards, composer, comments, reactions, voting |
| `layout/` | Sidebar, mobile nav, mobile sidebar |
| `providers/` | App-level context providers |
| `rooms/` | Room cards, room header, presence, create room modal |
| `system/` | Theme toggle, deployment guard, auth background |
| `teacher/` | Teacher moderation/control panel |
| `ui/` | Small shared UI utilities like skeleton loaders |

The most important shared UI helper is:

```text
src/lib/utils.ts
```

It exports `cn`, which combines CSS class names safely:

```ts
cn("base-class", isActive ? "active-class" : "inactive-class")
```

---

## 10. Styling System

Global styles live in:

```text
src/app/globals.css
```

The app uses CSS variables for theme colors:

```css
--app-bg
--app-panel
--app-text
--app-primary
--app-line
```

Dark and light theme values are defined at the top of `globals.css`.

Common UI classes:

| Class | Meaning |
| --- | --- |
| `glass-panel` | Main glass-style panel surface |
| `app-button` | Base button style |
| `app-button-primary` | Primary button style |
| `app-button-secondary` | Secondary button style |
| `app-input` | Input style |
| `app-textarea` | Textarea style |
| `app-chip` | Small label/badge |
| `stat-card` | Metric card |
| `app-scroll` | Scrollable app content region |
| `page-wrap` | Page width and padding wrapper |
| `page-stack` | Consistent vertical spacing |
| `app-skeleton` | Smooth skeleton loader |
| `app-dialog-content` | Modal zoom-in/out animation |
| `app-tab-panel` | Tab/page panel transition |

Beginner note: most visual consistency comes from reusing these classes instead of inventing new styles on every page.

---

## 11a. Presentation Docs

If you need to present UniBoard, use the docs in `docs/`:

- [Master presentation doc](docs/uniboard-presentation-master.md)
- [Presentation script part 1](docs/presentation-script-part-1.md)
- [Presentation script part 2](docs/presentation-script-part-2.md)

These files split the demo into a clean first-half and second-half script and keep the master content in one place.

---

## 12. Loading and Transition System

Shared skeleton component:

```text
src/components/ui/Skeleton.tsx
```

It provides:

```tsx
<Skeleton className="h-40 rounded-3xl" />
<SkeletonStack count={4} itemClassName="h-24" />
```

Global loading route:

```text
src/app/(dashboard)/loading.tsx
```

Next.js automatically shows this while dashboard route content is loading.

Global animation classes:

- `app-view-enter`
- `app-tab-panel`
- `app-popover-enter`
- `app-dialog-overlay`
- `app-dialog-content`
- `app-skeleton`

AI assistant uses Framer Motion for smooth enter/exit transitions:

```text
src/components/ai/AiAssistant.tsx
```

Radix dialogs use CSS animation classes because Radix already handles focus, portals, and accessibility.

---

## 13. Main Feature Flows

### Dashboard

File:

```text
src/app/(dashboard)/dashboard/page.tsx
```

What it does:

1. Loads current user.
2. Loads joined rooms.
3. Loads upcoming deadlines.
4. Loads AI briefing.
5. Shows workspace stats and room cards.

Important Convex functions:

- `api.rooms.getMyRooms`
- `api.posts.getUpcomingDeadlines`

Important API route:

- `/api/v1/ai/briefing`

### Rooms Page

File:

```text
src/app/(dashboard)/rooms/page.tsx
```

What it does:

1. Loads public rooms.
2. Filters rooms by search text.
3. Lets users join public rooms.
4. Lets users join private rooms by code.
5. Opens the create room modal.

Important Convex functions:

- `api.rooms.getPublicRooms`
- `api.rooms.join`
- `api.rooms.create`

### Single Room Page

File:

```text
src/app/(dashboard)/rooms/[roomId]/page.tsx
```

What it does:

1. Loads room data.
2. Loads posts for the room.
3. Loads pinned posts.
4. Marks the room as seen.
5. Shows overview, split feed, or full feed mode.
6. Opens post composer modal.
7. Shows teacher panel for teachers/super admins.
8. Generates room summary when AI is enabled.

Important components:

- `RoomHeader`
- `PresenceBar`
- `PostFeed`
- `PostComposer`
- `PinnedPostsBanner`
- `TeacherPanel`

### Post Composer

File:

```text
src/components/feed/PostComposer.tsx
```

Users can create:

- announcements
- questions
- deadlines
- resources
- notes

Important Convex mutation:

- `api.posts.create`

### Teacher Panel

File:

```text
src/components/teacher/TeacherPanel.tsx
```

Tabs:

- Flagged posts
- Members
- Analytics

Important Convex functions:

- `api.posts.getReportedPosts`
- `api.rooms.getMembers`
- `api.analytics.getRoomAnalytics`
- `api.posts.remove`
- `api.rooms.muteOrBanMember`
- `api.rooms.setMemberRole`

### Admin Page

File:

```text
src/app/(dashboard)/admin/page.tsx
```

Only super admins should use it.

It shows:

- teacher access requests
- governed rooms
- user directory

Important Convex functions:

- `api.users.listTeacherAccessRequests`
- `api.users.listGovernanceUsers`
- `api.rooms.getAdminRoomOverview`
- `api.users.setUserRoleBySuperAdmin`
- `api.rooms.setArchiveStateBySuperAdmin`

### Planner

File:

```text
src/app/(dashboard)/planner/page.tsx
```

What it does:

1. Loads planner snapshot.
2. Shows calendar view.
3. Shows AI recommended study sessions.
4. Lets users add manual deadlines.
5. Exports planner data to Word/Excel/calendar formats.

Important Convex functions:

- `api.planner.getSnapshot`
- `api.planner.createManualDeadline`
- `api.planner.replan`
- `api.planner.exportCalendar`

Important libraries:

- `src/lib/planner-export.ts`

### AI Features

AI server routes live in:

```text
src/app/api/v1/ai/
```

Important routes:

- `/api/v1/ai/assistant`
- `/api/v1/ai/briefing`
- `/api/v1/ai/study-plan`
- `/api/v1/ai/room-summary`
- `/api/v1/ai/deadline-risk`
- `/api/v1/ai/knowledge/query`
- `/api/v1/ai/learning-profile`
- `/api/v1/ai/composer/suggest`

AI service code:

```text
src/lib/ai/service.ts
```

Supporting AI files:

| File | Purpose |
| --- | --- |
| `client.ts` | Frontend fetch helpers |
| `config.ts` | AI env/config |
| `contracts.ts` | TypeScript response types |
| `intents.ts` | Intent detection |
| `mentions.ts` | Mention handling |
| `retrieval.ts` | Context retrieval |
| `safety.ts` | Safety and guard logic |
| `service.ts` | Main AI orchestration |

The AI system is designed to degrade gracefully. If OpenAI is unavailable, many routes return deterministic/fallback responses from live Convex data.

---

## 14. Environment Variables

Local env files:

```text
.env
.env.local
.env.example
```

Required variables:

```env
NEXT_PUBLIC_CONVEX_URL=
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
CLERK_JWT_ISSUER_DOMAIN=
```

Optional but used by specific integrations:

```env
CLERK_WEBHOOK_SECRET=
OPENAI_API_KEY=
```

Convex auth also needs:

```env
CLERK_JWT_ISSUER_DOMAIN=https://your-clerk-domain.clerk.accounts.dev
```

Do not commit real secrets to GitHub.

---

## 15. Common Commands

Install dependencies:

```bash
npm install
```

Start development server:

```bash
npm run dev
```

Typecheck:

```bash
npm run typecheck
```

If TypeScript runs out of memory on Windows:

```bash
node --max-old-space-size=4096 .\node_modules\typescript\bin\tsc --noEmit
```

Run unit tests:

```bash
npm run test
```

Build production app:

```bash
npm run build
```

Start built app:

```bash
npm run start
```

Run Playwright E2E:

```bash
npm run test:e2e
```

Push Convex functions to dev deployment once:

```bash
npx convex dev --once
```

Seed demo data:

```bash
npm run seed:demo
```

---

## 16. How to Add a New Page

Example: add a `/courses` page.

1. Create:

```text
src/app/(dashboard)/courses/page.tsx
```

2. Export a React component:

```tsx
export default function CoursesPage() {
  return (
    <div className="app-scroll">
      <div className="page-wrap page-stack">
        <section className="glass-panel page-hero">
          <p className="section-eyebrow">Courses</p>
          <h1 className="mt-2 text-3xl font-bold text-white">Courses</h1>
        </section>
      </div>
    </div>
  );
}
```

3. Add a sidebar nav item in:

```text
src/components/layout/Sidebar.tsx
```

4. Add mobile nav if needed in:

```text
src/components/layout/MobileNav.tsx
```

---

## 17. How to Add a New Convex Query

Example: list public rooms by subject.

1. Open:

```text
convex/rooms.ts
```

2. Add a query:

```ts
export const getPublicRoomsBySubject = query({
  args: { subject: v.string() },
  handler: async (ctx, args) => {
    const rooms = await ctx.db.query("rooms").collect();
    return rooms.filter(
      (room) => room.isPublic && room.subject === args.subject && !room.isArchived
    );
  }
});
```

3. Use it in React:

```tsx
const rooms = useQuery(api.rooms.getPublicRoomsBySubject, { subject: "CS-445" });
```

4. Run Convex codegen/deploy if needed:

```bash
npx convex dev --once
```

---

## 18. How to Add a New Mutation

Example: mark a room as favorite.

1. Add a field in `convex/schema.ts` if the data model needs it.
2. Add a mutation in the relevant Convex file.
3. Call the mutation from a component with `useMutation`.
4. Add UI states for loading, success, and error.
5. Add seed data if the feature should appear in demos.

Mutation pattern:

```ts
export const updateSomething = mutation({
  args: {
    id: v.id("rooms"),
    value: v.string()
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);
    // permission checks here
    await ctx.db.patch(args.id, { value: args.value });
  }
});
```

---

## 19. How to Debug Data Loading

If a page shows no data:

1. Confirm the user is logged in.
2. Confirm the Convex URL is correct:

```env
NEXT_PUBLIC_CONVEX_URL=https://acoustic-chickadee-547.convex.cloud
```

3. Confirm Convex functions are deployed:

```bash
npx convex dev --once
```

4. Rerun seed:

```bash
npm run seed:demo
```

5. Check public snapshot:

```bash
npx convex run analytics:getPublicSnapshot
```

6. Log out and log back in, because the seed recreates Clerk users.

---

## 20. Testing Strategy

Unit tests live near source files:

```text
src/lib/*.test.ts
src/lib/ai/*.test.ts
```

E2E tests live in:

```text
tests/e2e/
```

Current E2E files:

- `public.spec.ts`
- `authenticated.spec.ts`

Authenticated tests need:

```env
E2E_CLERK_EMAIL=
E2E_CLERK_PASSWORD=
```

Run the authenticated suite for each seeded account by changing those env vars.

---

## 21. Deployment Notes

Vercel needs these environment variables:

```env
NEXT_PUBLIC_CONVEX_URL=https://acoustic-chickadee-547.convex.cloud
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
CLERK_JWT_ISSUER_DOMAIN=https://your-clerk-domain.clerk.accounts.dev
```

After changing Vercel env vars, redeploy. Old deployments keep old env snapshots.

Convex must also have the Clerk issuer env var:

```bash
npx convex env list
```

If Convex functions are stale, run:

```bash
npx convex dev --once
```

---

## 22. Beginner Mental Model

When you open a page:

1. Next.js renders a route from `src/app`.
2. The dashboard layout checks auth.
3. React components mount in the browser.
4. Components call Convex with `useQuery`.
5. Convex returns live data.
6. Loading skeletons show while data is undefined.
7. Mutations change Convex data.
8. Convex updates subscribed components automatically.
9. Notifications and AI helpers react to the result.

If you understand that flow, the whole project becomes easier to follow.

---

## 23. Safe Editing Rules for This Codebase

When changing code:

- Reuse existing UI classes before creating new CSS.
- Reuse Convex permission helpers before writing new role checks.
- Add loading states for every `useQuery`.
- Add disabled states for every mutation button.
- Keep modals accessible through Radix Dialog.
- Keep dashboard pages inside `app-scroll`, `page-wrap`, and `page-stack`.
- Update seed data when adding a new feature that should appear in demos.
- Run typecheck, tests, and build before pushing.

Recommended verification before a deploy:

```bash
node --max-old-space-size=4096 .\node_modules\typescript\bin\tsc --noEmit
npm run test
npm run build
```

For UI confidence:

```bash
npm run test:e2e
```

---

## 24. Where to Start Learning

Read these files in this order:

1. `src/app/layout.tsx`
2. `src/app/(dashboard)/layout.tsx`
3. `src/components/layout/Sidebar.tsx`
4. `src/app/(dashboard)/dashboard/page.tsx`
5. `src/app/(dashboard)/rooms/page.tsx`
6. `src/app/(dashboard)/rooms/[roomId]/page.tsx`
7. `convex/schema.ts`
8. `convex/lib.ts`
9. `convex/users.ts`
10. `convex/rooms.ts`
11. `convex/posts.ts`
12. `convex/devSeed.ts`

That path teaches you the app shell, navigation, main UI screens, database shape, permissions, and demo data.
