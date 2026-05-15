import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { UniBoardLogo } from "@/components/brand/UniBoardLogo";
import { DeploymentSetupNotice } from "@/components/system/DeploymentSetupNotice";
import { isClerkServerConfigured } from "@/lib/deployment";

export const dynamic = "force-dynamic";

export default async function LandingPage() {
  if (!isClerkServerConfigured) {
    return (
      <DeploymentSetupNotice
        title="Configure Clerk before publishing UniBoard"
        detail="The landing page uses Clerk session checks to redirect authenticated users. Add the missing Clerk environment variables in Vercel to enable the full app shell."
      />
    );
  }

  const { userId } = await auth();
  if (userId) {
    redirect("/dashboard");
  }

  return (
    <main className="relative min-h-screen overflow-hidden px-4 py-4 sm:px-5">
      <div className="hero-grid absolute inset-0 opacity-20" />
      <div className="absolute inset-x-0 top-0 h-48 bg-gradient-to-b from-[rgba(77,117,255,0.12)] to-transparent" />
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
                { title: "Realtime", copy: "Live room activity with no refresh loop." },
                { title: "Anonymous", copy: "Contribution without social drag where policy allows." },
                { title: "Structured", copy: "Deadlines, resources, and decisions stay searchable." }
              ].map((item) => (
                <div key={item.title} className="stat-card">
                  <p className="text-sm font-semibold text-white">{item.title}</p>
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
                  <h2 className="text-2xl font-bold text-white">Parallel Computing • SP26</h2>
                  <p className="mt-2 text-sm leading-6 text-[var(--app-text-muted)]">
                    Pinned deadlines, fast notes, and anonymous questions in one disciplined room.
                  </p>
                </div>
                <div className="rounded-2xl bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-200">
                  12 online now
                </div>
              </div>
            </div>
            <div className="glass-panel rounded-[28px] p-6">
              <p className="text-xs uppercase tracking-[0.3em] text-[var(--app-text-muted)]">Unread pull</p>
              <p className="mt-5 text-4xl font-black tracking-tight text-white">27</p>
              <p className="mt-2 text-sm text-[var(--app-text-muted)]">Unread updates across rooms</p>
            </div>
            <div className="glass-panel rounded-[28px] p-6">
              <p className="text-xs uppercase tracking-[0.3em] text-[var(--app-text-muted)]">Deadline pressure</p>
              <p className="mt-5 text-lg font-semibold text-white">Assignment 3 due in 9h</p>
              <p className="mt-2 text-sm text-[var(--app-text-muted)]">Pinned countdowns keep important work visible.</p>
            </div>
            <div className="glass-panel rounded-[28px] p-6 sm:col-span-2">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-[var(--app-text-muted)]">Posting modes</p>
                  <h3 className="mt-3 text-xl font-semibold text-white">Visible or anonymous, same live stream.</h3>
                </div>
                <div className="flex gap-2">
                  <span className="panel-chip text-gray-200">Question</span>
                  <span className="panel-chip text-gray-200">Deadline</span>
                </div>
              </div>
              <p className="mt-4 text-sm leading-6 text-[var(--app-text-muted)]">
                The interface stays restrained, but the activity layer stays fast and academically legible.
              </p>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
