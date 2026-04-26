# 12 — Deployment & Production Setup

## Architecture

```
                    ┌─────────────────────────────────┐
                    │          Vercel Edge              │
                    │   (Next.js 14 App Router)         │
                    │   - SSR / Server Components       │
                    │   - API Routes (AI endpoints)     │
                    │   - Static assets                 │
                    └─────────────┬───────────────────┘
                                  │
                    ┌─────────────▼───────────────────┐
                    │        Convex Cloud               │
                    │   - Real-time DB                  │
                    │   - Serverless functions          │
                    │   - WebSocket subscriptions       │
                    └─────────────────────────────────┘
                                  │
                    ┌─────────────▼───────────────────┐
                    │         Clerk Auth                │
                    │   - Identity + JWT                │
                    │   - Webhooks to Convex            │
                    └─────────────────────────────────┘
```

---

## Environment Variables

### `.env.local` (local development)

```bash
# Convex
NEXT_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
CLERK_WEBHOOK_SECRET=whsec_...
CLERK_JWT_ISSUER_DOMAIN=https://clerk.your-instance.com

# AI
GEMINI_API_KEY=AIza...
NEXT_PUBLIC_GEMINI_API_KEY=AIza...
```

### Vercel Dashboard (production)

Add all variables above under **Settings → Environment Variables**.
Set them for: Production, Preview, Development.

---

## Step-by-Step Bootstrap

### Step 1 — Create Next.js Project

```bash
npx create-next-app@latest uniboard-pro \
  --typescript \
  --tailwind \
  --app \
  --src-dir \
  --import-alias "@/*"

cd uniboard-pro
```

### Step 2 — Install All Dependencies

```bash
# Core stack
npm install convex @clerk/nextjs @clerk/clerk-react

# UI and utilities
npm install lucide-react date-fns clsx tailwind-merge
npm install react-hot-toast framer-motion cmdk
npm install @google/generative-ai svix nanoid zod

# shadcn/ui
npx shadcn-ui@latest init

# Radix primitives (if not already via shadcn)
npm install @radix-ui/react-dialog @radix-ui/react-dropdown-menu
npm install @radix-ui/react-avatar @radix-ui/react-tooltip
npm install @radix-ui/react-tabs @radix-ui/react-select
npm install @radix-ui/react-switch @radix-ui/react-popover

# Charts (for analytics)
npm install recharts

# Markdown rendering (for AI responses)
npm install react-markdown
```

### Step 3 — Initialize Convex

```bash
npx convex dev --once
```

This creates `convex/_generated/` with TypeScript types.
Copy the `NEXT_PUBLIC_CONVEX_URL` printed to terminal into `.env.local`.

### Step 4 — Setup Clerk

1. Go to [clerk.com](https://clerk.com) → Create application
2. Copy `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY` to `.env.local`
3. In Clerk Dashboard → Configure:
   - Sign-in URL: `/sign-in`
   - Sign-up URL: `/sign-up`
   - After sign-in URL: `/dashboard`
   - After sign-up URL: `/onboarding`
4. JWT Templates → New → Select **Convex**
   - Copy the issuer domain to `CLERK_JWT_ISSUER_DOMAIN` in `convex/auth.config.ts`
5. Webhooks → Add endpoint:
   - URL: `https://your-domain.vercel.app/api/webhooks/clerk`
   - Events: `user.created`, `user.updated`
   - Copy signing secret to `CLERK_WEBHOOK_SECRET`

### Step 5 — Setup Gemini API Key

1. Go to [aistudio.google.com](https://aistudio.google.com) → Get API Key
2. Create key (free, no credit card)
3. Add to `.env.local` as `GEMINI_API_KEY`

### Step 6 — Run Locally

```bash
# Terminal 1: Convex dev server (keep running)
npx convex dev

# Terminal 2: Next.js dev server
npm run dev
```

Open `http://localhost:3000`.

---

## Production Deployment

### Deploy Convex Functions

```bash
npx convex deploy
```

This deploys all `convex/*.ts` functions to Convex Cloud.
The `NEXT_PUBLIC_CONVEX_URL` remains the same as dev.

### Deploy to Vercel

```bash
# Install Vercel CLI if needed
npm install -g vercel

# Deploy
vercel --prod
```

Or connect your GitHub repo to Vercel for auto-deploy on push to `main`.

---

## manifest.json (PWA)

```json
{
  "name": "UniBoard",
  "short_name": "UniBoard",
  "description": "AI-powered real-time class platform",
  "start_url": "/dashboard",
  "display": "standalone",
  "background_color": "#07070d",
  "theme_color": "#6366f1",
  "orientation": "portrait",
  "icons": [
    { "src": "/icons/icon-72.png",  "sizes": "72x72",   "type": "image/png" },
    { "src": "/icons/icon-96.png",  "sizes": "96x96",   "type": "image/png" },
    { "src": "/icons/icon-128.png", "sizes": "128x128", "type": "image/png" },
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png", "purpose": "maskable" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any maskable" }
  ],
  "shortcuts": [
    {
      "name": "Dashboard",
      "url": "/dashboard",
      "icons": [{ "src": "/icons/icon-96.png", "sizes": "96x96" }]
    }
  ]
}
```

---

## Production Readiness Checklist

### Security
- [ ] Clerk app keys are production keys (not test keys)
- [ ] `CLERK_WEBHOOK_SECRET` is set and webhook verified
- [ ] Every Convex mutation has auth check at layer 1 (identity)
- [ ] Every Convex mutation has user existence check at layer 2
- [ ] Every Convex mutation has role/permission check at layer 3
- [ ] Anonymous post authorId is NEVER sent to client
- [ ] Teacher-only routes have `user.role === "teacher"` guard
- [ ] AI API key is server-side only (`GEMINI_API_KEY`, not `NEXT_PUBLIC_`)
- [ ] Gemini content moderation enabled for post creation

### Performance
- [ ] Convex queries use `.index()` (never `.collect()` without index)
- [ ] Post feed uses `.take(50)` limit — not collecting all posts
- [ ] AI responses cached in `aiResponses` table (check before API call)
- [ ] Avatar images use Clerk CDN URLs (not re-uploaded)
- [ ] Next.js `Image` component used for all images

### UX Quality
- [ ] Every async state has loading skeleton
- [ ] Every list has empty state with emoji + helpful copy
- [ ] Every mutation failure shows toast with human-readable message
- [ ] Mobile layout tested at 375px (iPhone SE)
- [ ] Tap targets are min 44×44px
- [ ] Bottom nav has `pb-safe` for iPhone notch
- [ ] Input fields use `text-base` (prevents iOS zoom on focus)

### Convex-Specific
- [ ] `npx convex deploy` run before Vercel deploy
- [ ] `convex/_generated/` is up to date (committed or generated in CI)
- [ ] All indexes defined in schema are used in queries
- [ ] No N+1 queries in hot paths (room feed, sidebar)

---

## Monitoring & Observability

### Convex Dashboard

At [dashboard.convex.dev](https://dashboard.convex.dev):
- Function logs (errors, slow queries)
- Database browser (inspect tables directly)
- Function metrics (call count, latency)

### Vercel Dashboard

- Deployment logs
- Edge function errors
- Build logs

### Quick Health Checks

```bash
# Check Convex functions deployed correctly
npx convex dashboard

# Check Next.js build
npm run build

# TypeScript check
npm run typecheck
```

---

## Seed Data Script

Run this once after deploying to populate demo data:

```typescript
// scripts/seed.ts — run with: npx ts-node scripts/seed.ts
// Creates demo rooms + posts for testing
import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// NOTE: Seeding requires a valid Convex auth token
// Best to do this manually through the app UI after signing in
// OR use the Convex dashboard → Data → Insert directly
```

For demo purposes, seed data is better added manually through the app after signing in — this also tests the actual user flow.

---

*This completes the UniBoard Pro implementation guide. Start with `README.md` and follow the build order in Step 1 → Step 25.*
