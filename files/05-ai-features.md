# 05 — AI Features (Gemini Integration)

## Overview

UniBoard Pro uses **Google Gemini 1.5 Flash** (free tier) for all AI features.
Free tier: 15 RPM, 1M TPM, 1.5B TPD — more than enough for a university class tool.

**AI Features:**
1. **AI Tutor** — Auto-answers unanswered questions (questions with 0 comments after 30min)
2. **Room Summarizer** — Summarizes the last N posts in a room into a digest
3. **Smart Tag Suggester** — Suggests tags for posts as you type
4. **Duplicate Detector** — Warns when a question similar to one already asked is being posted
5. **Content Moderator** — Flags inappropriate content before it's posted

---

## File: `src/lib/gemini.ts` — Gemini Client

```typescript
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export const geminiFlash = genAI.getGenerativeModel({
  model: "gemini-1.5-flash",
  generationConfig: {
    temperature: 0.7,
    topP: 0.95,
    maxOutputTokens: 1024,
  },
});

// Rate limit helper — simple in-memory token bucket
let lastCallTime = 0;
const MIN_INTERVAL_MS = 4000; // 15 RPM = 1 per 4 seconds

export async function callGemini(prompt: string): Promise<string> {
  // Throttle to respect free tier rate limits
  const now = Date.now();
  const elapsed = now - lastCallTime;
  if (elapsed < MIN_INTERVAL_MS) {
    await new Promise(resolve => setTimeout(resolve, MIN_INTERVAL_MS - elapsed));
  }
  lastCallTime = Date.now();

  const result = await geminiFlash.generateContent(prompt);
  return result.response.text();
}

export async function callGeminiSafe(prompt: string): Promise<string | null> {
  try {
    return await callGemini(prompt);
  } catch (err) {
    console.error("Gemini API error:", err);
    return null;
  }
}
```

---

## File: `src/app/api/ai/answer/route.ts` — AI Tutor Endpoint

```typescript
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { callGeminiSafe } from "@/lib/gemini";

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { question, roomName, subject, recentContext } = await req.json();

  if (!question || question.length < 5) {
    return NextResponse.json({ error: "Question too short" }, { status: 400 });
  }

  const prompt = `You are a helpful AI teaching assistant for a university class.

Class: ${roomName}
Subject: ${subject}

Recent class discussion context:
${recentContext?.slice(0, 5).map((p: string) => `- ${p}`).join("\n") ?? "No recent context."}

A student asked this question:
"${question}"

Please provide a clear, concise, and academically appropriate answer. 
- Keep it under 200 words
- Use bullet points if listing multiple things
- If it's a very specific exam/assignment question you cannot answer with certainty, say so and suggest where to find the answer
- Be encouraging and helpful in tone`;

  const answer = await callGeminiSafe(prompt);
  if (!answer) {
    return NextResponse.json({ error: "AI unavailable" }, { status: 503 });
  }

  return NextResponse.json({ answer });
}
```

---

## File: `src/app/api/ai/summarize/route.ts` — Room Summarizer

```typescript
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { callGeminiSafe } from "@/lib/gemini";

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { posts, roomName, subject } = await req.json();

  if (!posts || posts.length === 0) {
    return NextResponse.json({ error: "No posts to summarize" }, { status: 400 });
  }

  const postsText = posts
    .slice(0, 30)
    .map((p: { type: string; content: string; upvoteCount: number }) =>
      `[${p.type.toUpperCase()}] ${p.content} (${p.upvoteCount} upvotes)`
    )
    .join("\n\n");

  const prompt = `You are summarizing a university class discussion board.

Class: ${roomName} — ${subject}

Here are the recent posts (newest first):
${postsText}

Please provide:
1. **TL;DR** (1-2 sentences: what's the most important thing happening in this class right now?)
2. **Key Topics** (bullet list of 3-5 main discussion themes)
3. **Action Items** (any upcoming deadlines, tasks, or things students should do)
4. **Unanswered Questions** (any open questions that need attention)

Keep each section brief and scannable. Use markdown formatting.`;

  const summary = await callGeminiSafe(prompt);
  if (!summary) {
    return NextResponse.json({ error: "AI unavailable" }, { status: 503 });
  }

  return NextResponse.json({ summary });
}
```

---

## File: `src/app/api/ai/tags/route.ts` — Smart Tag Suggester

```typescript
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { callGeminiSafe } from "@/lib/gemini";

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { content, subject } = await req.json();
  if (!content || content.length < 10) return NextResponse.json({ tags: [] });

  const prompt = `Suggest 2-4 concise tags for this university class post.
Subject: ${subject}
Post: "${content}"

Return ONLY a JSON array of lowercase strings, no explanation. Example: ["midterm", "chapter5", "sorting-algorithms"]`;

  const response = await callGeminiSafe(prompt);
  if (!response) return NextResponse.json({ tags: [] });

  try {
    const clean = response.replace(/```json|```/g, "").trim();
    const tags = JSON.parse(clean);
    return NextResponse.json({ tags: Array.isArray(tags) ? tags.slice(0, 4) : [] });
  } catch {
    return NextResponse.json({ tags: [] });
  }
}
```

---

## File: `src/app/api/ai/moderate/route.ts` — Content Moderation

```typescript
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { callGeminiSafe } from "@/lib/gemini";

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { content } = await req.json();
  if (!content) return NextResponse.json({ safe: true });

  const prompt = `You are a content moderation system for a university class platform.
Analyze this post for: hate speech, harassment, spam, explicit content, or severe academic dishonesty (posting full exam answers).

Post: "${content}"

Respond ONLY with JSON: {"safe": boolean, "reason": string|null}
If safe, reason is null. If unsafe, give a brief reason.
Be lenient — this is a student platform. Only flag clearly problematic content.`;

  const response = await callGeminiSafe(prompt);
  if (!response) return NextResponse.json({ safe: true }); // Fail open

  try {
    const clean = response.replace(/```json|```/g, "").trim();
    return NextResponse.json(JSON.parse(clean));
  } catch {
    return NextResponse.json({ safe: true });
  }
}
```

---

## File: `src/components/ai/AISummarizer.tsx`

```tsx
"use client";
import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { Sparkles, ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface AISummarizerProps {
  roomId: Id<"rooms">;
  roomName: string;
  subject: string;
}

export function AISummarizer({ roomId, roomName, subject }: AISummarizerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const posts = useQuery(api.posts.getByRoom, { roomId, limit: 30 });

  const handleSummarize = async () => {
    if (!posts || loading) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/ai/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          posts: posts.map(p => ({
            type: p.type,
            content: p.content,
            upvoteCount: p.upvoteCount,
          })),
          roomName,
          subject,
        }),
      });

      const data = await res.json();
      if (data.summary) setSummary(data.summary);
      else setError("Could not generate summary. Try again.");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="border border-indigo-800/40 bg-indigo-950/20 rounded-xl mx-4 my-2">
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen && !summary) handleSummarize();
        }}
        className="w-full flex items-center gap-2 px-4 py-3 text-sm text-indigo-300 hover:text-indigo-200 transition-colors"
      >
        <Sparkles size={14} className="text-indigo-400" />
        <span className="font-medium">AI Class Summary</span>
        <span className="text-xs text-indigo-500 ml-1">— powered by Gemini</span>
        <div className="ml-auto">
          {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </div>
      </button>

      {isOpen && (
        <div className="px-4 pb-4">
          {loading && (
            <div className="flex items-center gap-2 text-sm text-indigo-400">
              <Loader2 size={14} className="animate-spin" />
              Generating summary...
            </div>
          )}
          {error && (
            <div className="text-sm text-red-400">
              {error}
              <button
                onClick={handleSummarize}
                className="ml-2 underline text-indigo-400 hover:text-indigo-300"
              >
                Retry
              </button>
            </div>
          )}
          {summary && (
            <div className="prose prose-invert prose-sm max-w-none text-gray-300">
              <ReactMarkdown>{summary}</ReactMarkdown>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
```

---

## File: `src/components/ai/AIAnswerCard.tsx`

```tsx
"use client";
import { useState } from "react";
import { Sparkles, ThumbsUp, ThumbsDown, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface AIAnswerCardProps {
  question: string;
  roomName: string;
  subject: string;
  recentContext: string[];
}

export function AIAnswerCard({ question, roomName, subject, recentContext }: AIAnswerCardProps) {
  const [answer, setAnswer] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<"up" | "down" | null>(null);
  const [triggered, setTriggered] = useState(false);

  const fetchAnswer = async () => {
    if (loading || triggered) return;
    setTriggered(true);
    setLoading(true);
    try {
      const res = await fetch("/api/ai/answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, roomName, subject, recentContext }),
      });
      const data = await res.json();
      setAnswer(data.answer ?? null);
    } catch {
      setAnswer("Unable to generate answer. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-3 border border-purple-800/40 bg-purple-950/20 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles size={14} className="text-purple-400" />
        <span className="text-xs font-semibold text-purple-300 uppercase tracking-wide">
          AI Tutor
        </span>
        <span className="text-xs text-purple-600">Gemini 1.5 Flash</span>
      </div>

      {!triggered ? (
        <button
          onClick={fetchAnswer}
          className="text-sm text-purple-400 hover:text-purple-300 underline transition-colors"
        >
          Get AI answer →
        </button>
      ) : loading ? (
        <div className="flex items-center gap-2 text-sm text-purple-400">
          <Loader2 size={13} className="animate-spin" />
          Thinking...
        </div>
      ) : answer ? (
        <div>
          <div className="prose prose-invert prose-sm max-w-none text-gray-300 text-sm">
            <ReactMarkdown>{answer}</ReactMarkdown>
          </div>
          <div className="flex items-center gap-2 mt-3">
            <span className="text-xs text-gray-600">Helpful?</span>
            <button
              onClick={() => setFeedback("up")}
              className={`p-1 rounded transition-colors ${
                feedback === "up" ? "text-green-400" : "text-gray-600 hover:text-gray-400"
              }`}
            >
              <ThumbsUp size={13} />
            </button>
            <button
              onClick={() => setFeedback("down")}
              className={`p-1 rounded transition-colors ${
                feedback === "down" ? "text-red-400" : "text-gray-600 hover:text-gray-400"
              }`}
            >
              <ThumbsDown size={13} />
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
```

---

## AI Feature Usage Guide

### Enabling AI per room

Each room has `aiEnabled: boolean` in the schema. Teachers toggle this in room settings.
When `aiEnabled = false`, all AI UI is hidden for that room.

### Rate limit strategy

Free Gemini tier: 15 RPM. Mitigation strategy:
1. **Cache responses** in Convex `aiResponses` table with 1-hour TTL
2. **Hash inputs** — same question in same room returns cached answer
3. **Debounce** tag suggestions — only call after 1s of no typing
4. **Queue** AI answers — if rate limited, mark question as "AI pending" and answer async via Convex scheduled function

### Graceful degradation

Every AI feature degrades gracefully:
- API down → show "AI unavailable" message, rest of app works fine
- Rate limited → show cached answer or "Try again in a minute"
- No API key → entire AI section hidden via `process.env.GEMINI_API_KEY` check

---

*Continue to `06-pages.md` →*
