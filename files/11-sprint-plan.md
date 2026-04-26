# 11 — 5-Week Sprint Plan

## Week 1 — Foundation (Days 1–7)
**Goal:** Working auth + real-time posts in one room + basic UI shell

| Day | Task | Files |
|-----|------|-------|
| 1 | Init Next.js project, install all deps | `package.json`, `.env.local` |
| 1 | Write complete Convex schema | `convex/schema.ts` |
| 2 | Clerk auth bridge + middleware | `convex/auth.config.ts`, `middleware.ts` |
| 2 | User upsert mutation + getCurrentUser query | `convex/users.ts` |
| 2 | Webhook handler for Clerk | `src/app/api/webhooks/clerk/route.ts` |
| 3 | Root layout + providers + Toaster | `src/app/layout.tsx`, `ConvexClientProvider.tsx` |
| 3 | Sign-in / sign-up pages (Clerk themed dark) | `src/app/(auth)/sign-in|sign-up/` |
| 4 | Onboarding page — role + batch selection | `src/app/(auth)/onboarding/page.tsx` |
| 4 | completeOnboarding mutation | `convex/users.ts` |
| 5 | Room create mutation + join mutation | `convex/rooms.ts` |
| 5 | getMyRooms query + unread count queries | `convex/rooms.ts` |
| 6 | Post create mutation + getByRoom query | `convex/posts.ts` |
| 6 | Dashboard layout shell (sidebar placeholder) | `src/app/(dashboard)/layout.tsx` |
| 7 | **Milestone test:** Two tabs, post in A, see in B, <200ms |

**Week 1 definition of done:** Open two browser tabs. Post in Tab A. Post appears in Tab B without refresh. Auth works. Onboarding sets role.

---

## Week 2 — Core UX (Days 8–14)
**Goal:** All post types + anonymous + upvotes + comments + styled UI

| Day | Task |
|-----|------|
| 8 | Full Sidebar with room list + unread badges |
| 8 | MobileNav bottom tabs |
| 9 | PostCard full design (type badges, avatars, timestamps, type colors) |
| 9 | PostFeed with loading skeletons + empty state |
| 10 | PostComposer with type selector + anonymous toggle + deadline/resource fields |
| 10 | DeadlineCountdown live timer component |
| 11 | UpvoteButton with optimistic update |
| 11 | ReactionBar (6 emoji reactions) |
| 12 | Comment thread — create, view, reply, delete |
| 12 | CommentThread component |
| 13 | PinnedBanner (pinned posts above feed) |
| 13 | PresenceBar (online avatars in room header) |
| 14 | RoomHeader with search icon, member count, settings link |
| 14 | CreateRoomModal — full form with emoji, color, options |

---

## Week 3 — Teacher & Student Power Features (Days 15–21)
**Goal:** Full teacher panel, 20 teacher features, 20 student features

| Day | Task |
|-----|------|
| 15 | TeacherPanel side drawer — Flagged / Members / Stats / Logs tabs |
| 15 | Teacher: delete any post, pin post, flag post mutations |
| 16 | Teacher: mute/ban member mutations + UI in TeacherPanel |
| 16 | Teacher: promote/demote moderator mutation |
| 17 | Teacher: room settings page (archive, rename, toggle anonymous, toggle AI) |
| 17 | Teacher: analytics page with post-by-type chart + top contributors |
| 18 | Student: save/bookmark posts + Saved tab in profile |
| 18 | Student: repost + cross-room share mutations |
| 18 | Student: report post mutation |
| 19 | Student: hide post mutation |
| 19 | Student: edit own post (within 24h) |
| 20 | Notification engine — full notification list page |
| 20 | Notification bell in header + unread count |
| 21 | markAllRead + markRead mutations + real-time badge update |

---

## Week 4 — AI Layer (Days 22–28)
**Goal:** All AI features working with Gemini free API

| Day | Task |
|-----|------|
| 22 | Gemini API client setup (`src/lib/gemini.ts`) |
| 22 | AI Summarizer API route + AISummarizer component |
| 23 | AI Tutor API route + AIAnswerCard on question posts |
| 23 | Smart tag suggester API route + tag input in PostComposer |
| 24 | Content moderation check in PostComposer (pre-submit) |
| 24 | Rate limiting + caching strategy (check aiResponses table before calling API) |
| 25 | Poll feature — PollCreator (teacher), PollCard, poll voting |
| 25 | polls + pollVotes mutations and queries |
| 26 | Group project board — ProjectBoard kanban component |
| 26 | project + projectTasks mutations (create, update status, assign) |
| 27 | Tag-based filtering in feed (click tag → filter feed) |
| 27 | Search page — full search with type + room filters |
| 28 | CMD+K CommandPalette — search + quick actions |

---

## Week 5 — Polish + Deploy (Days 29–35)
**Goal:** Production-ready, demoable, beautiful on every screen

| Day | Task |
|-----|------|
| 29 | UI audit — every component dark mode consistent, correct hover states |
| 29 | Loading skeleton audit — every async state has skeleton |
| 30 | Error state audit — every mutation has try/catch + toast |
| 30 | Empty state audit — every list has emoji + helpful copy |
| 30 | Mobile audit — 375px width, tap targets, safe area insets |
| 31 | Animation audit — fade-in on new posts, scale-in on modals |
| 31 | Profile page — avatar, bio, badges, saved posts, post history |
| 32 | Teacher analytics dashboard improvements — charts with recharts |
| 32 | Super admin panel — basic user/room management |
| 33 | PWA — manifest.json + service worker |
| 33 | Seed demo data — 3 rooms, 30 posts (all types), 5 users |
| 34 | Deploy: `npx convex deploy` + Vercel prod deploy |
| 34 | Environment variables configured in Vercel |
| 35 | Record demo video + write README with screenshots |

---

## Daily Development Checklist

Before ending each day, verify:
- [ ] TypeScript: `npm run typecheck` passes (zero errors)
- [ ] No `any` types added
- [ ] Every new mutation has permission check + error handling
- [ ] Every new component has loading state
- [ ] Tested at mobile width (375px) in browser devtools

---

## Critical Path (cannot be parallelized)

```
Schema → Auth → User mutations → Room mutations → Post mutations
    → Sidebar → PostFeed → PostCard → PostComposer → Upvotes
    → Teacher panel → Student features → AI features → Polish
```

---

*Continue to `12-deployment.md` →*
