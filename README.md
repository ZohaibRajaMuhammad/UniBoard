# UniBoard

Real-time class noticeboard built with Next.js 14, Convex, Clerk, and Tailwind CSS.

## Stack

- Next.js 14 App Router
- Convex for real-time data, queries, and mutations
- Clerk for authentication
- TypeScript across frontend and backend
- Tailwind CSS for the design system

## Features

- Live room feeds backed by Convex subscriptions
- Anonymous and identified posting
- Deadlines, resources, questions, notes, and announcements
- Room membership, unread counts, and notifications
- Teacher moderation flows: pin, resolve, delete
- Responsive dashboard, search, notifications, and profile views

## Local Setup

1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env.local` and populate the Clerk and Convex keys.
3. Run `npx convex dev` once to attach a real deployment and regenerate `convex/_generated`.
4. Run `npm run dev`.

## Vercel Deployment

Required for the app shell and authentication:

- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `NEXT_PUBLIC_CONVEX_URL`

Required if you want Clerk webhooks and Convex JWT auth fully wired in production:

- `CLERK_WEBHOOK_SECRET`
- `CLERK_JWT_ISSUER_DOMAIN`

If any required public key is missing, the app now renders a deployment setup screen instead of crashing during prerender.

## Convex Notes

- `convex/schema.ts` defines the full data model.
- Query and mutation files are split by domain: `users`, `rooms`, `posts`, `votes`, `notifications`.
- The frontend imports typed endpoints from `convex/_generated/api`.
- This repository includes placeholder generated files only so local typechecking works before a real Convex deployment is attached.

## Auth Notes

- Next.js route protection is enforced by `middleware.ts`.
- Clerk identity is synchronized into Convex via `users.upsertFromClerk`.
- Anonymous posts do not expose `authorId` to the client payload.

## Documentation

- Product and implementation specifications remain in [`docs`](./docs).
- Deployment details are in [`docs/10-deployment.md`](./docs/10-deployment.md).
- Handoff and implementation notes are in [`docs/11-implementation-handoff.md`](./docs/11-implementation-handoff.md).
