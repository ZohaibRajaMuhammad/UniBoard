# 06 — Next.js Pages & Components (Complete)

## File: `src/app/layout.tsx`

```tsx
import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { ConvexClientProvider } from "@/components/providers/ConvexClientProvider";
import { Toaster } from "react-hot-toast";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: { default: "UniBoard", template: "%s — UniBoard" },
  description: "AI-powered real-time class platform for universities",
  manifest: "/manifest.json",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "UniBoard" },
};

export const viewport: Viewport = {
  themeColor: "#6366f1",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className={`${inter.variable} font-sans h-full bg-gray-950 text-gray-100 antialiased`}>
        <ClerkProvider>
          <ConvexClientProvider>
            {children}
            <Toaster position="bottom-right" toastOptions={{
              style: {
                background: "#16162a",
                color: "#d0d0e8",
                border: "1px solid #232340",
                borderRadius: "12px",
                fontSize: "14px",
              },
            }} />
          </ConvexClientProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
```

---

## File: `src/app/page.tsx` — Landing Page

```tsx
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function LandingPage() {
  const { userId } = await auth();
  if (userId) redirect("/dashboard");

  const features = [
    { icon: "⚡", title: "Real-time",     desc: "Posts appear for everyone instantly. No refresh." },
    { icon: "🎭", title: "Anonymous",     desc: "Post anonymously. Share more, fear less." },
    { icon: "🤖", title: "AI Tutor",      desc: "Unanswered questions? Gemini answers them." },
    { icon: "📌", title: "Deadlines",     desc: "Never miss a submission. Live countdown timers." },
    { icon: "🗳️", title: "Polls",         desc: "Teachers poll the class instantly." },
    { icon: "🚀", title: "Projects",      desc: "Group project boards built right in." },
  ];

  return (
    <main className="min-h-screen bg-gray-950 overflow-hidden">
      {/* Ambient background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-indigo-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-purple-600/8 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10">
        {/* Nav */}
        <nav className="flex items-center justify-between px-6 py-5 max-w-6xl mx-auto">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-indigo-600 rounded-xl flex items-center justify-center text-sm">📋</div>
            <span className="font-bold text-lg tracking-tight">UniBoard</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/sign-in" className="text-sm text-gray-400 hover:text-gray-200 transition-colors">Sign in</Link>
            <Link href="/sign-up" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-xl transition-colors">
              Get started
            </Link>
          </div>
        </nav>

        {/* Hero */}
        <section className="text-center px-4 pt-16 pb-20 max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-900/40 border border-indigo-800/40 rounded-full text-xs text-indigo-300 mb-8">
            <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-pulse-soft" />
            Powered by Gemini AI · Real-time with Convex
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-white mb-6 text-balance">
            Your class,{" "}
            <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              organized.
            </span>
          </h1>

          <p className="text-xl text-gray-400 mb-4 max-w-2xl mx-auto text-balance">
            Real-time noticeboard for students and teachers. No more WhatsApp chaos.
          </p>
          <p className="text-sm text-gray-600 mb-10">
            Anonymous posts · Deadline tracking · AI answers · Live polls · Group projects
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/sign-up" className="px-8 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-2xl transition-all hover:shadow-glow-indigo text-base">
              Start for free →
            </Link>
            <Link href="/sign-in" className="px-8 py-3.5 bg-gray-800 hover:bg-gray-750 text-gray-300 font-semibold rounded-2xl transition-colors border border-gray-700 text-base">
              Sign in
            </Link>
          </div>
          <p className="mt-5 text-xs text-gray-700">No credit card. No setup. Sign in with your university email.</p>
        </section>

        {/* Features grid */}
        <section className="max-w-5xl mx-auto px-4 pb-24">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map(f => (
              <div key={f.title} className="p-5 bg-gray-900 border border-gray-800 rounded-2xl hover:border-gray-700 transition-colors group">
                <div className="text-2xl mb-3">{f.icon}</div>
                <h3 className="font-semibold text-white mb-1.5 group-hover:text-indigo-300 transition-colors">{f.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
```

---

## File: `src/app/(dashboard)/layout.tsx`

```tsx
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { MobileNav } from "@/components/layout/MobileNav";
import { CommandPalette } from "@/components/layout/CommandPalette";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  return (
    <div className="h-screen flex overflow-hidden bg-gray-950">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-72 flex-shrink-0 flex-col">
        <Sidebar />
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col overflow-hidden min-w-0">
        {children}
      </main>

      {/* Mobile nav */}
      <MobileNav />

      {/* Global CMD+K palette */}
      <CommandPalette />
    </div>
  );
}
```

---

## File: `src/app/(dashboard)/rooms/[roomId]/page.tsx`

```tsx
"use client";
import { useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { Id } from "../../../../../convex/_generated/dataModel";
import { PostFeed } from "@/components/feed/PostFeed";
import { PostComposer } from "@/components/feed/PostComposer";
import { RoomHeader } from "@/components/rooms/RoomHeader";
import { PinnedBanner } from "@/components/feed/PinnedBanner";
import { PresenceBar } from "@/components/rooms/PresenceBar";
import { AISummarizer } from "@/components/ai/AISummarizer";
import { TeacherPanel } from "@/components/teacher/TeacherPanel";
import { useCurrentUser } from "@/hooks/useCurrentUser";

export default function RoomPage({ params }: { params: { roomId: string } }) {
  const roomId = params.roomId as Id<"rooms">;
  const currentUser = useCurrentUser();
  const room = useQuery(api.rooms.getById, { roomId });
  const posts = useQuery(api.posts.getByRoom, { roomId });
  const pinnedPosts = useQuery(api.posts.getPinnedPosts, { roomId });
  const markSeen = useMutation(api.rooms.markSeen);

  useEffect(() => {
    if (roomId) markSeen({ roomId });
  }, [roomId]);

  if (room === undefined) return <RoomPageSkeleton />;
  if (!room) return (
    <div className="flex-1 flex items-center justify-center text-gray-500">
      <div className="text-center">
        <div className="text-5xl mb-3">🔍</div>
        <p className="text-gray-400">Room not found</p>
      </div>
    </div>
  );

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Main feed column */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <RoomHeader room={room} />
        <PresenceBar roomId={roomId} />

        {pinnedPosts && pinnedPosts.length > 0 && (
          <PinnedBanner posts={pinnedPosts} />
        )}

        {/* AI Summarizer — only if room has AI enabled */}
        {room.aiEnabled && posts && posts.length > 3 && (
          <AISummarizer
            roomId={roomId}
            roomName={room.name}
            subject={room.subject}
          />
        )}

        <div className="flex-1 overflow-y-auto overscroll-contain">
          <PostFeed posts={posts} roomId={roomId} room={room} />
        </div>

        <div className="border-t border-gray-800 bg-gray-950 flex-shrink-0">
          <PostComposer roomId={roomId} room={room} currentUser={currentUser} />
        </div>
      </div>

      {/* Teacher side panel — desktop only, teacher only */}
      {currentUser?.role === "teacher" && (
        <aside className="hidden xl:flex w-72 flex-shrink-0 border-l border-gray-800">
          <TeacherPanel roomId={roomId} />
        </aside>
      )}
    </div>
  );
}

function RoomPageSkeleton() {
  return (
    <div className="flex-1 flex flex-col">
      <div className="h-14 bg-gray-800/50 animate-pulse border-b border-gray-800" />
      <div className="flex-1 p-4 space-y-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-20 bg-gray-800/40 rounded-xl animate-pulse" style={{ opacity: 1 - i * 0.14 }} />
        ))}
      </div>
    </div>
  );
}
```

---

## File: `src/components/feed/PostCard.tsx` (Full Implementation)

```tsx
"use client";
import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { UpvoteButton } from "./UpvoteButton";
import { ReactionBar } from "./ReactionBar";
import { CommentThread } from "./CommentThread";
import { AIAnswerCard } from "@/components/ai/AIAnswerCard";
import { DeadlineCountdown } from "./DeadlineCountdown";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { POST_TYPE_CONFIG } from "@/lib/constants";
import { cn, formatRelativeTime, formatFullTime } from "@/lib/utils";
import {
  Pin, CheckCircle2, Link2, Trash2, MoreHorizontal,
  MessageSquare, Share2, Bookmark, Flag, EyeOff,
  Edit2, AlertTriangle, RotateCcw,
} from "lucide-react";
import toast from "react-hot-toast";

interface PostCardProps {
  post: any;
  roomId: Id<"rooms">;
  room: any;
}

export function PostCard({ post, roomId, room }: PostCardProps) {
  const currentUser = useQuery(api.users.getCurrentUser);
  const removePost = useMutation(api.posts.remove);
  const togglePin = useMutation(api.posts.togglePin);
  const markResolved = useMutation(api.posts.markResolved);
  const hidePost = useMutation(api.posts.hidePost);
  const savePost = useMutation(api.posts.savePost);
  const reportPost = useMutation(api.posts.reportPost);
  const repost = useMutation(api.posts.repost);

  const [showMenu, setShowMenu] = useState(false);
  const [showComments, setShowComments] = useState(false);

  const typeConfig = POST_TYPE_CONFIG[post.type as keyof typeof POST_TYPE_CONFIG] ?? POST_TYPE_CONFIG.note;

  const isOwnPost = !post.isAnonymous && currentUser && post.authorId === currentUser._id;
  const isTeacher = currentUser?.role === "teacher";
  const canDelete = isOwnPost || isTeacher;
  const canPin = isTeacher;
  const canEdit = isOwnPost && !post.isAnonymous;
  const canResolve = (isOwnPost || isTeacher) && post.type === "question" && !post.isResolved;

  const handleDelete = async () => {
    try {
      await removePost({ postId: post._id });
      toast.success("Post deleted");
    } catch { toast.error("Could not delete post"); }
    setShowMenu(false);
  };

  const handlePin = async () => {
    try {
      await togglePin({ postId: post._id });
      toast.success(post.isPinned ? "Post unpinned" : "Post pinned");
    } catch { toast.error("Could not pin post"); }
    setShowMenu(false);
  };

  const handleSave = async () => {
    try {
      const result = await savePost({ postId: post._id });
      toast.success(result?.saved ? "Post saved" : "Removed from saved");
    } catch { toast.error("Could not save post"); }
    setShowMenu(false);
  };

  const handleReport = async () => {
    try {
      await reportPost({ postId: post._id });
      toast.success("Post reported to teacher");
    } catch { toast.error("Could not report post"); }
    setShowMenu(false);
  };

  const handleRepost = async () => {
    try {
      await repost({ originalPostId: post._id });
      toast.success("Post reposted");
    } catch (e: any) { toast.error(e.message ?? "Could not repost"); }
    setShowMenu(false);
  };

  const handleHide = async () => {
    try {
      await hidePost({ postId: post._id });
      toast.success(post.isHidden ? "Post unhidden" : "Post hidden");
    } catch { toast.error("Could not hide post"); }
    setShowMenu(false);
  };

  const handleResolve = async () => {
    try {
      await markResolved({ postId: post._id });
      toast.success("Question marked as resolved");
    } catch { toast.error("Could not mark as resolved"); }
    setShowMenu(false);
  };

  return (
    <article className={cn(
      "px-4 py-4 transition-colors group relative border-b border-gray-800/50",
      "hover:bg-gray-900/30",
      post.isPinned && "bg-amber-950/10 border-l-2 border-l-amber-500/40",
      post.type === "announcement" && "bg-purple-950/10 border-l-2 border-l-purple-500/40",
    )}>
      <div className="flex gap-3">
        {/* Avatar */}
        <div className="flex-shrink-0 mt-0.5">
          <Avatar
            name={post.author.name}
            imageUrl={post.author.imageUrl}
            size="sm"
          />
        </div>

        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center flex-wrap gap-x-2 gap-y-1 mb-1.5">
            <span className="text-sm font-semibold text-gray-100">{post.author.name}</span>

            {post.author.role === "teacher" && (
              <Badge variant="purple" size="xs">Teacher</Badge>
            )}

            <Badge
              variant={typeConfig.color as any}
              size="xs"
            >
              {typeConfig.emoji} {typeConfig.label}
            </Badge>

            {post.isAnonymous && (
              <Badge variant="default" size="xs">🎭 Anonymous</Badge>
            )}
            {post.isPinned && (
              <span className="flex items-center gap-0.5 text-[10px] text-amber-500 font-medium">
                <Pin size={9} /> Pinned
              </span>
            )}
            {post.isResolved && (
              <span className="flex items-center gap-0.5 text-[10px] text-emerald-500 font-medium">
                <CheckCircle2 size={9} /> Resolved
              </span>
            )}
            {post.isEdited && (
              <span className="text-[10px] text-gray-600">(edited)</span>
            )}
            {post.type === "question" && !post.isResolved && (
              <Badge variant="amber" size="xs">⏳ Unanswered</Badge>
            )}

            {/* Time */}
            <time
              className="text-[11px] text-gray-600 ml-auto flex-shrink-0"
              title={formatFullTime(post.createdAt)}
            >
              {formatRelativeTime(post.createdAt)}
            </time>

            {/* Actions menu */}
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-1 rounded text-gray-700 hover:text-gray-400 opacity-0 group-hover:opacity-100 transition-all"
              >
                <MoreHorizontal size={14} />
              </button>

              {showMenu && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowMenu(false)}
                  />
                  <div className="absolute right-0 top-6 z-20 bg-gray-800 border border-gray-700 rounded-xl shadow-modal py-1.5 min-w-[160px] animate-scale-in">
                    {canEdit && (
                      <MenuButton icon={<Edit2 size={12} />} label="Edit post" onClick={() => setShowMenu(false)} />
                    )}
                    {canPin && (
                      <MenuButton icon={<Pin size={12} />} label={post.isPinned ? "Unpin" : "Pin post"} onClick={handlePin} />
                    )}
                    {canResolve && (
                      <MenuButton icon={<CheckCircle2 size={12} />} label="Mark resolved" onClick={handleResolve} />
                    )}
                    <MenuButton icon={<Bookmark size={12} />} label="Save post" onClick={handleSave} />
                    <MenuButton icon={<RotateCcw size={12} />} label="Repost" onClick={handleRepost} />
                    {isOwnPost && (
                      <MenuButton icon={<EyeOff size={12} />} label={post.isHidden ? "Unhide" : "Hide post"} onClick={handleHide} />
                    )}
                    {!isOwnPost && !isTeacher && (
                      <MenuButton icon={<Flag size={12} />} label="Report" onClick={handleReport} className="text-red-400" />
                    )}
                    {canDelete && (
                      <MenuButton icon={<Trash2 size={12} />} label="Delete" onClick={handleDelete} className="text-red-400" />
                    )}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
              {post.tags.map((tag: string) => (
                <span key={tag} className="text-[10px] px-1.5 py-0.5 bg-gray-800 text-gray-500 rounded-full">
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Content */}
          <p className="text-sm text-gray-200 leading-relaxed whitespace-pre-wrap break-words">
            {post.content}
          </p>

          {/* Deadline countdown */}
          {post.type === "deadline" && post.deadlineDate && (
            <DeadlineCountdown deadlineDate={post.deadlineDate} title={post.deadlineTitle} />
          )}

          {/* Resource link */}
          {post.type === "resource" && post.resourceUrl && (
            <a
              href={post.resourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 mt-2 px-3 py-2 bg-gray-800 hover:bg-gray-750 border border-gray-700 rounded-lg text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              <Link2 size={13} />
              <span className="truncate max-w-[300px]">
                {post.resourceTitle || post.resourceUrl}
              </span>
            </a>
          )}

          {/* AI answer for questions */}
          {post.type === "question" && !post.isResolved && room.aiEnabled && (
            <AIAnswerCard
              question={post.content}
              roomName={room.name}
              subject={room.subject}
              recentContext={[]}
            />
          )}

          {/* Action row */}
          <div className="flex items-center gap-1 mt-3">
            <UpvoteButton postId={post._id} upvoteCount={post.upvoteCount} />

            <button
              onClick={() => setShowComments(!showComments)}
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs transition-colors",
                showComments
                  ? "bg-indigo-900/40 text-indigo-300"
                  : "text-gray-600 hover:text-gray-400 hover:bg-gray-800"
              )}
            >
              <MessageSquare size={13} />
              {post.commentCount > 0 && <span>{post.commentCount}</span>}
            </button>

            <button
              onClick={handleRepost}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs text-gray-600 hover:text-gray-400 hover:bg-gray-800 transition-colors"
            >
              <Share2 size={13} />
              {post.shareCount > 0 && <span>{post.shareCount}</span>}
            </button>

            <ReactionBar postId={post._id} />
          </div>

          {/* Reactions display */}
        </div>
      </div>

      {/* Comment thread */}
      {showComments && (
        <div className="mt-3 ml-11 animate-fade-up">
          <CommentThread postId={post._id} roomId={roomId} />
        </div>
      )}
    </article>
  );
}

function MenuButton({
  icon, label, onClick, className,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-gray-700 flex items-center gap-2.5 transition-colors",
        className
      )}
    >
      <span className="flex-shrink-0">{icon}</span>
      {label}
    </button>
  );
}
```

---

## File: `src/components/teacher/TeacherPanel.tsx`

```tsx
"use client";
import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { Flag, Users, BarChart2, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

type Tab = "flagged" | "members" | "analytics" | "logs";

export function TeacherPanel({ roomId }: { roomId: Id<"rooms"> }) {
  const [activeTab, setActiveTab] = useState<Tab>("flagged");
  const reportedPosts = useQuery(api.posts.getReportedPosts, { roomId });
  const members = useQuery(api.rooms.getMembers, { roomId });
  const analytics = useQuery(api.analytics.getRoomAnalytics, { roomId, days: 7 });
  const removePost = useMutation(api.posts.remove);
  const muteOrBan = useMutation(api.rooms.muteOrBanMember);

  const tabs: { id: Tab; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: "flagged", label: "Flagged", icon: <Flag size={14} />, badge: reportedPosts?.length },
    { id: "members", label: "Members", icon: <Users size={14} /> },
    { id: "analytics", label: "Stats", icon: <BarChart2 size={14} /> },
    { id: "logs", label: "Logs", icon: <Shield size={14} /> },
  ];

  return (
    <div className="flex flex-col h-full bg-gray-900">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-800">
        <h2 className="text-sm font-semibold text-gray-200 flex items-center gap-2">
          <Shield size={14} className="text-indigo-400" />
          Teacher Panel
        </h2>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-800">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex-1 flex flex-col items-center py-2.5 text-[10px] font-medium transition-colors relative gap-1",
              activeTab === tab.id
                ? "text-indigo-400 border-b-2 border-indigo-500"
                : "text-gray-600 hover:text-gray-400"
            )}
          >
            {tab.icon}
            {tab.label}
            {tab.badge ? (
              <span className="absolute top-1 right-1/4 w-3.5 h-3.5 bg-red-500 text-white text-[8px] rounded-full flex items-center justify-center font-bold">
                {tab.badge}
              </span>
            ) : null}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto p-3">

        {activeTab === "flagged" && (
          <div className="space-y-2">
            {!reportedPosts || reportedPosts.length === 0 ? (
              <div className="text-center py-8 text-gray-600 text-sm">
                <Flag size={24} className="mx-auto mb-2 opacity-40" />
                No flagged posts
              </div>
            ) : reportedPosts.map(post => (
              <div key={post._id} className="p-3 bg-gray-800 rounded-xl border border-red-900/30">
                <p className="text-xs text-gray-300 mb-2 line-clamp-2">{post.content}</p>
                <div className="flex gap-1.5">
                  <button
                    onClick={async () => {
                      await removePost({ postId: post._id, reason: "Flagged content" });
                      toast.success("Post deleted");
                    }}
                    className="flex-1 py-1.5 bg-red-900/40 text-red-400 text-xs rounded-lg hover:bg-red-900/60 transition-colors"
                  >
                    Delete
                  </button>
                  <button className="flex-1 py-1.5 bg-gray-700 text-gray-400 text-xs rounded-lg hover:bg-gray-600 transition-colors">
                    Dismiss
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === "members" && (
          <div className="space-y-1.5">
            {members?.map(m => m && (
              <div key={m.userId} className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-800 transition-colors group">
                <div className="w-7 h-7 rounded-full bg-indigo-900 flex items-center justify-center text-xs font-bold text-indigo-300">
                  {m.user.name[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-200 truncate">{m.user.name}</p>
                  <p className="text-[10px] text-gray-600">{m.role}</p>
                </div>
                <div className="opacity-0 group-hover:opacity-100 flex gap-1">
                  {m.role !== "owner" && !m.isMuted && (
                    <button
                      onClick={async () => {
                        await muteOrBan({ roomId, targetUserId: m.userId, action: "mute", muteDurationHours: 24 });
                        toast.success("Member muted for 24h");
                      }}
                      className="text-[10px] px-1.5 py-0.5 bg-gray-700 text-gray-400 rounded hover:bg-amber-900/40 hover:text-amber-400 transition-colors"
                    >
                      Mute
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === "analytics" && analytics && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <StatCard label="Posts (7d)" value={analytics.totalPosts} />
              <StatCard label="Members" value={analytics.totalMembers} />
              <StatCard label="Resolved" value={analytics.resolvedQuestions} />
              <StatCard label="Anonymous" value={analytics.anonymousPosts} />
            </div>
            <div>
              <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-2">By Type</p>
              {Object.entries(analytics.byType).map(([type, count]) => (
                <div key={type} className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] text-gray-500 w-20 capitalize">{type}</span>
                  <div className="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-600 rounded-full"
                      style={{ width: `${Math.min(100, (count / analytics.totalPosts) * 100)}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-gray-500 w-4 text-right">{count}</span>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="p-2.5 bg-gray-800 rounded-xl">
      <p className="text-[10px] text-gray-500 mb-0.5">{label}</p>
      <p className="text-lg font-bold text-white">{value}</p>
    </div>
  );
}
```

---

## File: `src/components/feed/ReactionBar.tsx`

```tsx
"use client";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { REACTION_EMOJIS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Smile } from "lucide-react";

export function ReactionBar({ postId }: { postId: Id<"posts"> }) {
  const reactions = useQuery(api.posts.getPostReactions, { postId });
  const toggleReaction = useMutation(api.votes.toggleReaction);
  const currentUser = useQuery(api.users.getCurrentUser);
  const [showPicker, setShowPicker] = useState(false);

  const handleReact = async (emoji: string) => {
    try {
      await toggleReaction({ postId, emoji });
    } catch {}
    setShowPicker(false);
  };

  return (
    <div className="flex items-center gap-1">
      {/* Existing reactions */}
      {reactions?.map(r => (
        <button
          key={r.emoji}
          onClick={() => handleReact(r.emoji)}
          className={cn(
            "flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs border transition-colors",
            r.userIds.includes(currentUser?._id ?? "")
              ? "bg-indigo-900/40 border-indigo-700/40 text-indigo-300"
              : "bg-gray-800/80 border-gray-700/60 text-gray-400 hover:border-gray-600"
          )}
          title={`${r.count} ${r.emoji}`}
        >
          <span>{r.emoji}</span>
          <span>{r.count}</span>
        </button>
      ))}

      {/* Add reaction button */}
      <div className="relative">
        <button
          onClick={() => setShowPicker(!showPicker)}
          className="p-1 rounded-lg text-gray-700 hover:text-gray-500 hover:bg-gray-800 transition-colors"
        >
          <Smile size={13} />
        </button>
        {showPicker && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setShowPicker(false)} />
            <div className="absolute bottom-7 left-0 z-20 flex gap-1 p-2 bg-gray-800 border border-gray-700 rounded-xl shadow-modal animate-scale-in">
              {REACTION_EMOJIS.map(emoji => (
                <button
                  key={emoji}
                  onClick={() => handleReact(emoji)}
                  className="text-lg hover:scale-125 transition-transform"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
```

---

*Continue to `10-auth.md` →*
