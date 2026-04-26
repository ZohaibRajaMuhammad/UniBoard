# 09 — UI System & Design Language

## Design Philosophy

UniBoard Pro's UI is built on one principle: **Twitter-class polish meets academic utility.**

Every screen must pass the "30-second test" — a new user landing on any page should immediately understand what it does and feel compelled to interact. The UI should feel like a premium product, not a university project. Think: Linear, Vercel Dashboard, Figma — dark, sharp, purposeful.

**Four design pillars:**
1. **Dark-first** — Deep backgrounds, high contrast text, no eye strain for late-night study sessions
2. **Density without clutter** — Information-dense layouts with micro-whitespace breathing room
3. **Motion as feedback** — Every interaction has a micro-animation that confirms the action
4. **Color as meaning** — Post type colors, urgency gradients, and role badges communicate meaning without reading text

---

## File: `tailwind.config.ts`

```typescript
import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        // Base palette — ultra-deep darks
        gray: {
          950: "#07070d",   // Page background — deepest
          900: "#0e0e17",   // Sidebar background
          850: "#111120",   // Card hover state
          800: "#16162a",   // Card backgrounds
          750: "#1c1c35",   // Input backgrounds
          700: "#232340",   // Borders (default)
          600: "#2e2e52",   // Borders (hover)
          500: "#4a4a7a",   // Placeholder text, disabled
          400: "#7878a8",   // Secondary text
          300: "#a8a8c8",   // Body text
          200: "#d0d0e8",   // Headings
          100: "#e8e8f4",   // Primary text
        },
        // Brand
        indigo: {
          950: "#0f0f2e",
          900: "#1a1a4a",
          800: "#2d2d7a",
          700: "#4040a0",
          600: "#5555c8",
          500: "#6b6bdc",
          400: "#8888e8",
          300: "#aaaaef",
        },
        // Post type colors
        "post-note":         "#3b82f6",  // Blue
        "post-deadline":     "#ef4444",  // Red
        "post-question":     "#f59e0b",  // Amber
        "post-resource":     "#10b981",  // Emerald
        "post-announcement": "#8b5cf6",  // Purple
        "post-poll":         "#06b6d4",  // Cyan
        "post-project":      "#f97316",  // Orange
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        mono: ["var(--font-jetbrains-mono)", "monospace"],
      },
      fontSize: {
        "2xs": ["0.625rem", { lineHeight: "0.875rem" }],
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.25rem",
        "4xl": "1.5rem",
      },
      spacing: {
        "safe-bottom": "env(safe-area-inset-bottom)",
      },
      backdropBlur: {
        xs: "2px",
      },
      animation: {
        "fade-in":      "fadeIn 0.15s ease-out",
        "fade-up":      "fadeUp 0.2s ease-out",
        "scale-in":     "scaleIn 0.15s ease-out",
        "slide-right":  "slideRight 0.25s ease-out",
        "pulse-soft":   "pulseSoft 2s ease-in-out infinite",
        "shimmer":      "shimmer 1.5s ease-in-out infinite",
        "bounce-sm":    "bounceSm 0.4s ease-out",
      },
      keyframes: {
        fadeIn: {
          from: { opacity: "0" },
          to:   { opacity: "1" },
        },
        fadeUp: {
          from: { opacity: "0", transform: "translateY(6px)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
        scaleIn: {
          from: { opacity: "0", transform: "scale(0.95)" },
          to:   { opacity: "1", transform: "scale(1)" },
        },
        slideRight: {
          from: { transform: "translateX(-100%)", opacity: "0" },
          to:   { transform: "translateX(0)",    opacity: "1" },
        },
        pulseSoft: {
          "0%, 100%": { opacity: "1" },
          "50%":      { opacity: "0.6" },
        },
        shimmer: {
          "0%":   { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        bounceSm: {
          "0%, 100%": { transform: "translateY(0)" },
          "40%":      { transform: "translateY(-4px)" },
        },
      },
      boxShadow: {
        "glow-indigo": "0 0 20px rgba(99, 102, 241, 0.3)",
        "glow-purple": "0 0 20px rgba(139, 92, 246, 0.3)",
        "card":        "0 2px 12px rgba(0, 0, 0, 0.4)",
        "card-hover":  "0 4px 24px rgba(0, 0, 0, 0.6)",
        "modal":       "0 20px 60px rgba(0, 0, 0, 0.8)",
      },
      backgroundImage: {
        "shimmer-gradient": "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.04) 50%, transparent 100%)",
        "gradient-radial-indigo": "radial-gradient(ellipse at top, rgba(99, 102, 241, 0.15), transparent 60%)",
      },
    },
  },
  plugins: [],
};

export default config;
```

---

## File: `src/lib/utils.ts`

```typescript
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { formatDistanceToNow, format, isToday, isYesterday } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Smart relative time: "just now" → "5m" → "2h" → "Yesterday" → "Apr 12"
export function formatRelativeTime(timestamp: number): string {
  const diff = Date.now() - timestamp;
  if (diff < 60_000)        return "just now";
  if (diff < 3_600_000)     return `${Math.floor(diff / 60_000)}m`;
  if (diff < 86_400_000)    return `${Math.floor(diff / 3_600_000)}h`;
  const date = new Date(timestamp);
  if (isYesterday(date))    return "Yesterday";
  return format(date, "MMM d");
}

// Full timestamp for tooltip
export function formatFullTime(timestamp: number): string {
  return format(new Date(timestamp), "MMM d, yyyy 'at' h:mm a");
}

// Countdown: "3d 4h" / "2h 15m" / "45m" / "Overdue"
export function formatCountdown(targetMs: number): {
  label: string;
  urgency: "safe" | "soon" | "urgent" | "overdue";
} {
  const diff = targetMs - Date.now();
  if (diff <= 0) return { label: "Overdue", urgency: "overdue" };

  const days =  Math.floor(diff / 86_400_000);
  const hours = Math.floor((diff % 86_400_000) / 3_600_000);
  const mins =  Math.floor((diff % 3_600_000) / 60_000);

  if (diff < 3_600_000)    return { label: `${mins}m left`,           urgency: "urgent" };
  if (diff < 86_400_000)   return { label: `${hours}h ${mins}m left`, urgency: "urgent" };
  if (diff < 3 * 86_400_000) return { label: `${days}d ${hours}h left`, urgency: "soon" };
  return { label: `${days} days left`, urgency: "safe" };
}

export function truncate(str: string, n: number): string {
  return str.length > n ? str.slice(0, n - 3) + "..." : str;
}

export function pluralize(count: number, word: string): string {
  return `${count} ${word}${count === 1 ? "" : "s"}`;
}

// Generate a consistent color from a string (for avatars, room colors)
export function stringToColor(str: string): string {
  const colors = [
    "#6366f1", "#8b5cf6", "#ec4899", "#f43f5e",
    "#f97316", "#eab308", "#22c55e", "#14b8a6",
    "#06b6d4", "#3b82f6",
  ];
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

// Get initials from a name
export function getInitials(name: string): string {
  return name
    .split(" ")
    .map(n => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}
```

---

## File: `src/lib/constants.ts`

```typescript
export const POST_TYPE_CONFIG = {
  note: {
    label: "Note",
    emoji: "📝",
    color: "blue",
    bg: "bg-blue-950/50",
    border: "border-blue-800/40",
    text: "text-blue-300",
    badge: "bg-blue-900/60 text-blue-300 border border-blue-800/50",
    placeholder: "Share lecture notes, summaries, key concepts...",
  },
  deadline: {
    label: "Deadline",
    emoji: "⏰",
    color: "red",
    bg: "bg-red-950/50",
    border: "border-red-800/40",
    text: "text-red-300",
    badge: "bg-red-900/60 text-red-300 border border-red-800/50",
    placeholder: "Describe the deadline, requirements, submission method...",
  },
  question: {
    label: "Question",
    emoji: "❓",
    color: "amber",
    bg: "bg-amber-950/50",
    border: "border-amber-800/40",
    text: "text-amber-300",
    badge: "bg-amber-900/60 text-amber-300 border border-amber-800/50",
    placeholder: "What do you want to ask the class? Be specific...",
  },
  resource: {
    label: "Resource",
    emoji: "🔗",
    color: "emerald",
    bg: "bg-emerald-950/50",
    border: "border-emerald-800/40",
    text: "text-emerald-300",
    badge: "bg-emerald-900/60 text-emerald-300 border border-emerald-800/50",
    placeholder: "Describe this resource and why it's useful...",
  },
  announcement: {
    label: "Announcement",
    emoji: "📢",
    color: "purple",
    bg: "bg-purple-950/50",
    border: "border-purple-800/40",
    text: "text-purple-300",
    badge: "bg-purple-900/60 text-purple-300 border border-purple-800/50",
    placeholder: "Write your class announcement...",
  },
  poll: {
    label: "Poll",
    emoji: "📊",
    color: "cyan",
    bg: "bg-cyan-950/50",
    border: "border-cyan-800/40",
    text: "text-cyan-300",
    badge: "bg-cyan-900/60 text-cyan-300 border border-cyan-800/50",
    placeholder: "What do you want to poll the class about?",
  },
  project: {
    label: "Project",
    emoji: "🚀",
    color: "orange",
    bg: "bg-orange-950/50",
    border: "border-orange-800/40",
    text: "text-orange-300",
    badge: "bg-orange-900/60 text-orange-300 border border-orange-800/50",
    placeholder: "Describe the project and what you're looking for...",
  },
} as const;

export const REACTION_EMOJIS = ["👍", "❤️", "😂", "🔥", "😮", "😢"] as const;

export const ROOM_COLORS = [
  "blue", "indigo", "purple", "pink", "rose",
  "orange", "amber", "emerald", "teal", "cyan",
] as const;

export const ROOM_EMOJIS = [
  "📚", "💻", "🧮", "🔬", "📐", "🎓", "⚡", "🌐",
  "🧠", "🔧", "🎯", "🧪", "📊", "🏗️", "🔮", "🧬",
] as const;

export const BATCHES = [
  "SP26-BS(SE)-AM", "SP26-BS(SE)-BM", "SP26-BS(SE)-CM",
  "SP26-BS(CS)-AM", "SP26-BS(CS)-BM",
  "FA25-BS(SE)-AM", "FA25-BS(SE)-BM",
  "FA25-BS(CS)-AM",
] as const;

export const DEPARTMENTS = [
  "Software Engineering",
  "Computer Science",
  "Information Technology",
  "Electrical Engineering",
  "Mechanical Engineering",
  "Artificial Intelligence",
  "Data Science",
] as const;

export const BADGE_CONFIG: Record<string, { label: string; emoji: string; color: string }> = {
  early_adopter:    { label: "Early Adopter",    emoji: "🌟", color: "text-yellow-400" },
  top_contributor:  { label: "Top Contributor",  emoji: "🏆", color: "text-amber-400"  },
  helpful:          { label: "Helpful",           emoji: "🤝", color: "text-emerald-400" },
  question_master:  { label: "Question Master",   emoji: "❓", color: "text-blue-400"   },
  resource_sharer:  { label: "Resource Sharer",   emoji: "🔗", color: "text-cyan-400"   },
  deadline_warrior: { label: "Deadline Warrior",  emoji: "⏰", color: "text-red-400"    },
};
```

---

## Shared UI Components

### `src/components/ui/Avatar.tsx`

```tsx
import { cn, getInitials, stringToColor } from "@/lib/utils";

interface AvatarProps {
  name: string;
  imageUrl?: string | null;
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
}

const SIZE_MAP = {
  xs: "w-5 h-5 text-[9px]",
  sm: "w-7 h-7 text-[11px]",
  md: "w-9 h-9 text-sm",
  lg: "w-12 h-12 text-base",
};

export function Avatar({ name, imageUrl, size = "md", className }: AvatarProps) {
  const sizeClass = SIZE_MAP[size];
  const bgColor = stringToColor(name);

  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt={name}
        className={cn("rounded-full object-cover flex-shrink-0", sizeClass, className)}
      />
    );
  }

  return (
    <div
      className={cn(
        "rounded-full flex items-center justify-center font-semibold text-white flex-shrink-0",
        sizeClass,
        className
      )}
      style={{ backgroundColor: bgColor }}
    >
      {getInitials(name)}
    </div>
  );
}
```

### `src/components/ui/Badge.tsx`

```tsx
import { cn } from "@/lib/utils";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "blue" | "red" | "amber" | "green" | "purple" | "cyan" | "orange";
  size?: "sm" | "xs";
  className?: string;
}

const VARIANT_MAP = {
  default: "bg-gray-800 text-gray-300 border-gray-700",
  blue:    "bg-blue-900/60 text-blue-300 border-blue-800/50",
  red:     "bg-red-900/60 text-red-300 border-red-800/50",
  amber:   "bg-amber-900/60 text-amber-300 border-amber-800/50",
  green:   "bg-emerald-900/60 text-emerald-300 border-emerald-800/50",
  purple:  "bg-purple-900/60 text-purple-300 border-purple-800/50",
  cyan:    "bg-cyan-900/60 text-cyan-300 border-cyan-800/50",
  orange:  "bg-orange-900/60 text-orange-300 border-orange-800/50",
};

export function Badge({ children, variant = "default", size = "sm", className }: BadgeProps) {
  return (
    <span className={cn(
      "inline-flex items-center gap-1 rounded-md border font-medium",
      size === "xs" ? "px-1.5 py-0.5 text-[10px]" : "px-2 py-0.5 text-xs",
      VARIANT_MAP[variant],
      className
    )}>
      {children}
    </span>
  );
}
```

### `src/components/ui/Skeleton.tsx`

```tsx
import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return (
    <div className={cn(
      "animate-shimmer bg-shimmer-gradient bg-[length:200%_100%] bg-gray-800/60 rounded-lg",
      className
    )} />
  );
}

// Pre-built skeleton patterns
export function PostCardSkeleton() {
  return (
    <div className="px-4 py-4 border-b border-gray-800/60 animate-fade-in">
      <div className="flex gap-3">
        <Skeleton className="w-8 h-8 rounded-full flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="flex gap-2">
            <Skeleton className="h-3.5 w-24" />
            <Skeleton className="h-3.5 w-16 rounded-full" />
          </div>
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-3/4" />
          <Skeleton className="h-7 w-16 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

export function RoomCardSkeleton() {
  return (
    <div className="h-28 bg-gray-800/40 rounded-2xl animate-pulse border border-gray-700/30" />
  );
}
```

### `src/components/ui/Toast.tsx` — via react-hot-toast

```tsx
// In root layout, add:
import { Toaster } from "react-hot-toast";

// Inside body:
<Toaster
  position="bottom-right"
  toastOptions={{
    style: {
      background: "#16162a",
      color: "#d0d0e8",
      border: "1px solid #232340",
      borderRadius: "12px",
      fontSize: "14px",
      boxShadow: "0 4px 24px rgba(0,0,0,0.6)",
    },
    success: {
      iconTheme: { primary: "#22c55e", secondary: "#16162a" },
    },
    error: {
      iconTheme: { primary: "#ef4444", secondary: "#16162a" },
    },
    duration: 3000,
  }}
/>
```

---

## Typography Scale

```
Title 1:  text-3xl font-bold tracking-tight   — Page titles
Title 2:  text-xl font-semibold               — Section headers
Title 3:  text-base font-semibold             — Card titles
Body:     text-sm text-gray-300 leading-relaxed — Main content
Caption:  text-xs text-gray-500               — Metadata, timestamps
Label:    text-[11px] font-medium uppercase tracking-wider text-gray-500 — Section labels
Micro:    text-2xs text-gray-600              — Badges, counts
```

---

## Spacing System

```
Layout gaps:     gap-4 (cards), gap-3 (list items), gap-2 (inline)
Card padding:    p-4 (desktop), p-3 (mobile)
Section margin:  mb-6 (between sections), mb-3 (within section)
Inline padding:  px-3 py-2 (buttons), px-2 py-1 (badges)
Border radius:   rounded-xl (cards), rounded-lg (inputs/buttons), rounded-full (avatars/badges)
```

---

## Interactive States

Every interactive element follows this pattern:

```
Default:   bg-gray-800    text-gray-300   border-gray-700
Hover:     bg-gray-750    text-gray-100   border-gray-600   (transition-all duration-150)
Active:    scale-95                                          (active:scale-95)
Focus:     ring-2 ring-indigo-500/50 ring-offset-0
Disabled:  opacity-40     cursor-not-allowed
Loading:   animate-pulse  cursor-wait
```

---

## Mobile-Specific Rules

```
1. pb-safe  → Bottom padding = env(safe-area-inset-bottom)
   Use on: mobile nav, any element at bottom of screen

2. Bottom nav height: h-16 fixed bottom-0
   Content padding: pb-24 on scrollable areas (nav height + buffer)

3. Inputs: Never add padding-bottom < 12px on mobile
   iOS Safari zooms on inputs with font-size < 16px
   Always use: text-base md:text-sm (or add touch-action: none for zoom prevention)

4. Tap targets: min-h-[44px] min-w-[44px] for all interactive elements
   Apple HIG: 44pt minimum tap target

5. Scroll: overflow-y-auto with -webkit-overflow-scrolling: touch
   Use: overscroll-behavior-y-contain on scroll containers

6. FAB (Floating Action Button): bottom-[calc(4rem+1rem)] right-4
   Sits above bottom nav, not hidden behind it
```

---

## Animation Usage Guide

```
Page transitions:   animate-fade-in (new route loads)
New post appears:   animate-fade-up (post card enters feed)
Modal opens:        animate-scale-in
Sidebar opens:      animate-slide-right
Loading states:     animate-shimmer (skeleton) / animate-pulse-soft (icon)
Success action:     animate-bounce-sm (upvote, save)
Notification badge: animate-pulse-soft (live indicator dot)
```

---

## CSS Global Resets — `src/app/globals.css`

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --font-inter: 'Inter', system-ui, sans-serif;
  }

  * {
    box-sizing: border-box;
  }

  html {
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    text-rendering: optimizeLegibility;
  }

  /* Custom scrollbar — matches dark theme */
  ::-webkit-scrollbar {
    width: 4px;
    height: 4px;
  }
  ::-webkit-scrollbar-track {
    background: transparent;
  }
  ::-webkit-scrollbar-thumb {
    background: #232340;
    border-radius: 2px;
  }
  ::-webkit-scrollbar-thumb:hover {
    background: #2e2e52;
  }

  /* Selection color */
  ::selection {
    background: rgba(99, 102, 241, 0.3);
    color: #e8e8f4;
  }

  /* Mobile: prevent tap highlight */
  * {
    -webkit-tap-highlight-color: transparent;
  }

  /* Prevent layout shift on scrollbar appear */
  html {
    scrollbar-gutter: stable;
  }
}

@layer utilities {
  .pb-safe {
    padding-bottom: env(safe-area-inset-bottom);
  }
  .pt-safe {
    padding-top: env(safe-area-inset-top);
  }
  .text-balance {
    text-wrap: balance;
  }
  .no-scrollbar::-webkit-scrollbar {
    display: none;
  }
  .no-scrollbar {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
}
```

---

*Continue to `10-auth.md` →*
