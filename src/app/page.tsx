import Link from "next/link";
import { fetchQuery } from "convex/nextjs";
import { api } from "../../convex/_generated/api";
import { UniBoardLogo } from "@/components/brand/UniBoardLogo";
import { DeploymentSetupNotice } from "@/components/system/DeploymentSetupNotice";
import { isClerkServerConfigured } from "@/lib/deployment";

export const dynamic = "force-dynamic";

const fallbackPublicSnapshot = {
  publicRoomCount: 0,
  visiblePostCount: 0,
  upcomingDeadlineCount: 0,
  activeMemberCount: 0,
  busiestRoom: null
};

async function getPublicSnapshot() {
  const timeout = new Promise<typeof fallbackPublicSnapshot>((resolve) => {
    setTimeout(() => resolve(fallbackPublicSnapshot), 1800);
  });

  return Promise.race([
    fetchQuery(api.analytics.getPublicSnapshot, {}).catch(() => fallbackPublicSnapshot),
    timeout
  ]);
}

export default async function LandingPage() {
  if (!isClerkServerConfigured) {
    return (
      <DeploymentSetupNotice
        title="Configure Clerk before publishing UniBoard"
        detail="The landing page uses Clerk session checks to redirect authenticated users. Add the missing Clerk environment variables in Vercel to enable the full app shell."
      />
    );
  }

  const snapshot = await getPublicSnapshot();

  return (
    <main className="relative min-h-screen overflow-hidden px-4 py-4 sm:px-5">
      <div className="hero-grid absolute inset-0 opacity-20" />
      <div className="relative mx-auto flex min-h-screen w-full max-w-[82.5rem] flex-col">
        <header className="flex items-center justify-between gap-4 px-2 py-5 sm:px-4">
          <UniBoardLogo subtitle="Academic intelligence workspace" />
          <div className="flex gap-3">
            <Link href="/sign-in" className="app-button app-button-secondary min-h-[44px] px-5 py-3">
              Sign in
            </Link>
            <Link href="/sign-up" className="app-button app-button-primary min-h-[44px] px-5 py-3">
              Get started
            </Link>
          </div>
        </header>

        <div className="grid flex-1 items-center gap-6 py-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-8">
          <section className="spotlight-ring glass-panel page-hero ambient-orb">
            <div className="panel-chip mb-8 text-[var(--app-text-soft)]">
              Real-time academic communication without class-stream chaos
            </div>
            <h1 className="max-w-[31rem] text-[clamp(2.8rem,2.1rem+2vw,5rem)] font-extrabold tracking-[-0.045em] text-white">
              Your class network, rebuilt for signal.
            </h1>
            <p className="mt-6 max-w-[31rem] text-[1rem] leading-8 text-[var(--app-text-soft)] sm:text-[1.05rem]">
              UniBoard turns scattered class chatter into a disciplined academic operating layer with deadlines, rooms,
              grounded AI help, and moderation that feels native rather than bolted on.
            </p>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <Link href="/sign-up" className="app-button app-button-primary px-6">
                Start with your class
              </Link>
              <Link href="/sign-in" className="app-button app-button-secondary px-6">
                Access existing workspace
              </Link>
            </div>
            <div className="mt-10 grid gap-4 md:grid-cols-3">
              {[
                { title: `${snapshot.publicRoomCount}`, copy: "Public rooms currently available." },
                { title: `${snapshot.visiblePostCount}`, copy: "Visible posts across public academic spaces." },
                { title: `${snapshot.upcomingDeadlineCount}`, copy: "Upcoming public deadlines already tracked." }
              ].map((item) => (
                <div key={item.copy} className="stat-card">
                  <p className="text-2xl font-bold text-white">{item.title}</p>
                  <p className="mt-2 text-sm leading-6 text-[var(--app-text-muted)]">{item.copy}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="grid gap-4 sm:grid-cols-2">
            <div className="glass-panel rounded-[28px] p-6 sm:col-span-2">
              <p className="text-xs uppercase tracking-[0.3em] text-[var(--app-primary-strong)]">Live room pulse</p>
              <div className="mt-5 flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-white">{snapshot.busiestRoom?.name ?? "Academic workspace"}</h2>
                  <p className="mt-2 text-sm leading-6 text-[var(--app-text-muted)]">
                    {snapshot.busiestRoom
                      ? `${snapshot.busiestRoom.subject} currently leads public activity with ${snapshot.busiestRoom.postCount} visible posts.`
                      : "Public room metrics will appear here as soon as rooms and posts are available."}
                  </p>
                </div>
                <div className="rounded-2xl border border-[var(--app-line)] bg-[var(--app-panel)] px-3 py-2 text-xs font-semibold text-[var(--app-text-soft)]">
                  {snapshot.busiestRoom ? `${snapshot.busiestRoom.memberCount} members` : "No room data"}
                </div>
              </div>
            </div>
            <div className="glass-panel rounded-[28px] p-6">
              <p className="text-xs uppercase tracking-[0.3em] text-[var(--app-text-muted)]">Visible posts</p>
              <p className="mt-5 text-4xl font-black tracking-tight text-white">{snapshot.visiblePostCount}</p>
              <p className="mt-2 text-sm text-[var(--app-text-muted)]">Accessible public posts currently indexed.</p>
            </div>
            <div className="glass-panel rounded-[28px] p-6">
              <p className="text-xs uppercase tracking-[0.3em] text-[var(--app-text-muted)]">Upcoming deadlines</p>
              <p className="mt-5 text-lg font-semibold text-white">{snapshot.upcomingDeadlineCount} tracked items</p>
              <p className="mt-2 text-sm text-[var(--app-text-muted)]">Public deadline signal updates continuously from live room data.</p>
            </div>
            <div className="glass-panel rounded-[28px] p-6 sm:col-span-2">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-[var(--app-text-muted)]">Workspace scale</p>
                  <h3 className="mt-3 text-xl font-semibold text-white">Live public activity, minimal presentation.</h3>
                </div>
                <div className="flex gap-2">
                  <span className="panel-chip text-[var(--app-text-soft)]">{snapshot.publicRoomCount} rooms</span>
                  <span className="panel-chip text-[var(--app-text-soft)]">{snapshot.activeMemberCount} members</span>
                </div>
              </div>
              <p className="mt-4 text-sm leading-6 text-[var(--app-text-muted)]">
                The interface stays restrained, while room counts, posts, and deadlines are pulled from live Convex data instead of placeholder marketing numbers.
              </p>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
