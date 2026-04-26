# 10 — Auth Setup (Clerk + Convex Bridge)

## File: `convex/auth.config.ts`

```typescript
export default {
  providers: [
    {
      domain: process.env.CLERK_JWT_ISSUER_DOMAIN,
      applicationID: "convex",
    },
  ],
};
```

---

## File: `middleware.ts`

```typescript
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/webhooks(.*)",
]);

const isOnboardingRoute = createRouteMatcher(["/onboarding(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  const { userId, sessionClaims } = await auth();

  // Redirect authenticated users away from public routes
  if (userId && isPublicRoute(req) && !req.nextUrl.pathname.startsWith("/api")) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  // Protect all non-public routes
  if (!isPublicRoute(req)) {
    await auth().protect();
  }
});

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};
```

---

## File: `src/components/providers/ConvexClientProvider.tsx`

```tsx
"use client";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { ConvexReactClient } from "convex";
import { useAuth } from "@clerk/nextjs";

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export function ConvexClientProvider({ children }: { children: React.ReactNode }) {
  return (
    <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
      {children}
    </ConvexProviderWithClerk>
  );
}
```

---

## File: `src/app/(auth)/onboarding/page.tsx`

```tsx
"use client";
import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { BATCHES, DEPARTMENTS } from "@/lib/constants";
import toast from "react-hot-toast";

type Role = "student" | "teacher";

export default function OnboardingPage() {
  const [step, setStep] = useState<1 | 2>(1);
  const [role, setRole] = useState<Role | null>(null);
  const [batch, setBatch] = useState("");
  const [department, setDepartment] = useState("");
  const [bio, setBio] = useState("");
  const [studentId, setStudentId] = useState("");
  const [loading, setLoading] = useState(false);

  const completeOnboarding = useMutation(api.users.completeOnboarding);
  const router = useRouter();

  const handleComplete = async () => {
    if (!role || !batch) return;
    setLoading(true);
    try {
      await completeOnboarding({ role, batch, department, bio, studentId });
      toast.success("Welcome to UniBoard!");
      router.push("/dashboard");
    } catch (err) {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-indigo-600 rounded-2xl mb-4 text-xl">📋</div>
          <h1 className="text-2xl font-bold text-white">Welcome to UniBoard</h1>
          <p className="text-gray-500 text-sm mt-1">Let's set up your profile</p>

          {/* Progress */}
          <div className="flex gap-2 justify-center mt-4">
            {[1, 2].map(s => (
              <div key={s} className={cn(
                "h-1 rounded-full transition-all",
                step >= s ? "w-8 bg-indigo-500" : "w-4 bg-gray-800"
              )} />
            ))}
          </div>
        </div>

        {step === 1 ? (
          <div className="space-y-4 animate-fade-up">
            <h2 className="text-sm font-medium text-gray-300 text-center">I am a...</h2>

            <div className="grid grid-cols-2 gap-3">
              {(["student", "teacher"] as Role[]).map(r => (
                <button
                  key={r}
                  onClick={() => setRole(r)}
                  className={cn(
                    "p-5 rounded-2xl border transition-all text-left",
                    role === r
                      ? "border-indigo-500 bg-indigo-900/30 ring-1 ring-indigo-500/50"
                      : "border-gray-700 bg-gray-900 hover:border-gray-600"
                  )}
                >
                  <div className="text-2xl mb-2">{r === "student" ? "🎒" : "🎓"}</div>
                  <div className="font-semibold text-white capitalize">{r}</div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    {r === "student" ? "Join classes, post notes, ask questions" : "Manage classes, post announcements, moderate"}
                  </div>
                </button>
              ))}
            </div>

            <button
              onClick={() => role && setStep(2)}
              disabled={!role}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-semibold rounded-xl transition-colors"
            >
              Continue →
            </button>
          </div>
        ) : (
          <div className="space-y-4 animate-fade-up">
            {/* Batch */}
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Your Batch</label>
              <select
                value={batch}
                onChange={e => setBatch(e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-gray-200 focus:outline-none focus:border-indigo-600"
              >
                <option value="">Select your batch</option>
                {BATCHES.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>

            {/* Department */}
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Department</label>
              <select
                value={department}
                onChange={e => setDepartment(e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-gray-200 focus:outline-none focus:border-indigo-600"
              >
                <option value="">Select department</option>
                {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>

            {/* Student ID (student only) */}
            {role === "student" && (
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">
                  Student ID <span className="text-gray-600">(optional)</span>
                </label>
                <input
                  value={studentId}
                  onChange={e => setStudentId(e.target.value)}
                  placeholder="e.g. 21-SE-16"
                  className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-indigo-600"
                />
              </div>
            )}

            {/* Bio */}
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">
                Short Bio <span className="text-gray-600">(optional)</span>
              </label>
              <textarea
                value={bio}
                onChange={e => setBio(e.target.value)}
                placeholder="3rd year SE student | loves algorithms"
                maxLength={150}
                rows={2}
                className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-indigo-600 resize-none"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setStep(1)}
                className="px-4 py-3 bg-gray-800 hover:bg-gray-700 text-gray-300 font-medium rounded-xl transition-colors"
              >
                ←
              </button>
              <button
                onClick={handleComplete}
                disabled={!batch || loading}
                className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-semibold rounded-xl transition-colors"
              >
                {loading ? "Setting up..." : "Enter UniBoard →"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
```

---

## File: `src/hooks/useCurrentUser.ts`

```typescript
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { useEffect } from "react";

export function useCurrentUser() {
  const { user: clerkUser } = useUser();
  const convexUser = useQuery(api.users.getCurrentUser);
  const upsert = useMutation(api.users.upsertFromClerk);

  useEffect(() => {
    if (clerkUser && convexUser === null) {
      upsert({
        clerkId: clerkUser.id,
        email: clerkUser.emailAddresses[0]?.emailAddress ?? "",
        name: clerkUser.fullName ?? clerkUser.username ?? "User",
        imageUrl: clerkUser.imageUrl,
      });
    }
  }, [clerkUser, convexUser]);

  return convexUser ?? null;
}
```

---

## File: `src/hooks/usePresence.ts`

```typescript
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useEffect } from "react";

export function usePresence() {
  const updatePresence = useMutation(api.users.updatePresence);

  useEffect(() => {
    // Mark online when tab is active
    updatePresence({ isOnline: true });

    // Mark offline when tab loses focus
    const handleBlur = () => updatePresence({ isOnline: false });
    const handleFocus = () => updatePresence({ isOnline: true });
    const handleUnload = () => updatePresence({ isOnline: false });

    window.addEventListener("blur", handleBlur);
    window.addEventListener("focus", handleFocus);
    window.addEventListener("beforeunload", handleUnload);

    // Heartbeat every 3 minutes
    const interval = setInterval(() => updatePresence({ isOnline: true }), 3 * 60 * 1000);

    return () => {
      window.removeEventListener("blur", handleBlur);
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("beforeunload", handleUnload);
      clearInterval(interval);
    };
  }, []);
}
```

---

## File: `src/app/api/webhooks/clerk/route.ts`

```typescript
import { WebhookEvent } from "@clerk/nextjs/server";
import { headers } from "next/headers";
import { Webhook } from "svix";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../../convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;
  if (!WEBHOOK_SECRET) return new Response("Missing webhook secret", { status: 500 });

  const headerPayload = headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response("Missing svix headers", { status: 400 });
  }

  const payload = await req.json();
  const body = JSON.stringify(payload);
  const wh = new Webhook(WEBHOOK_SECRET);

  let evt: WebhookEvent;
  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent;
  } catch {
    return new Response("Invalid webhook", { status: 400 });
  }

  if (evt.type === "user.created" || evt.type === "user.updated") {
    const { id, email_addresses, first_name, last_name, username, image_url } = evt.data;
    await convex.mutation(api.users.upsertFromClerk, {
      clerkId: id,
      email: email_addresses[0]?.email_address ?? "",
      name: [first_name, last_name].filter(Boolean).join(" ") || username || "User",
      imageUrl: image_url,
    });
  }

  return new Response("OK", { status: 200 });
}
```

---

*Continue to `11-sprint-plan.md` →*
