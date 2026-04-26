import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function LandingPage() {
  const { userId } = await auth();
  if (userId) {
    redirect("/dashboard");
  }

  return (
    <main className="relative min-h-screen overflow-hidden">
      <div className="hero-grid absolute inset-0 opacity-30" />
      <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-brand-500/10 to-transparent" />
      <div className="relative mx-auto flex min-h-screen max-w-7xl flex-col justify-center px-6 py-16">
        <div className="grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="spotlight-ring glass-panel rounded-[40px] p-8 sm:p-12">
            <div className="panel-chip mb-8 text-brand-100">
              <span className="text-lg">📋</span>
              Real-time academic communication without WhatsApp noise
            </div>
            <h1 className="max-w-3xl text-5xl font-extrabold tracking-[-0.04em] text-white sm:text-6xl xl:text-7xl">
              Your class network, redesigned for signal instead of chaos.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-gray-300">
              UniBoard turns batch chatter into a disciplined live workspace with anonymous posting, deadline urgency,
              searchable knowledge, and moderation that feels native instead of bolted on.
            </p>
            <div className="mt-10 flex flex-col gap-4 sm:flex-row">
              <Link href="/sign-up" className="inline-flex items-center justify-center rounded-2xl bg-brand-500 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-brand-400">
                Start with your class
              </Link>
              <Link href="/sign-in" className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-white/10">
                Sign in
              </Link>
            </div>
            <div className="mt-10 grid gap-3 sm:grid-cols-3">
              {[
                { title: "Realtime", copy: "Convex subscriptions keep every room live without refresh." },
                { title: "Anonymous", copy: "Students can contribute without social drag." },
                { title: "Structured", copy: "Rooms, deadlines, and resources stay searchable." }
              ].map((item) => (
                <div key={item.title} className="rounded-3xl border border-white/10 bg-black/20 p-4">
                  <p className="text-sm font-semibold text-white">{item.title}</p>
                  <p className="mt-2 text-sm leading-6 text-gray-400">{item.copy}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="grid gap-4 sm:grid-cols-2">
            <div className="glass-panel rounded-[32px] p-6 sm:col-span-2">
              <p className="text-xs uppercase tracking-[0.3em] text-brand-200">Live room pulse</p>
              <div className="mt-5 flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-white">Parallel Computing • SP26</h2>
                  <p className="mt-2 text-sm leading-6 text-gray-400">Pinned deadlines, fast notes, and anonymous questions all in one subject room.</p>
                </div>
                <div className="rounded-2xl bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-200">12 online now</div>
              </div>
            </div>
            <div className="glass-panel rounded-[32px] p-6">
              <p className="text-xs uppercase tracking-[0.3em] text-gray-500">Unread pull</p>
              <p className="mt-5 text-4xl font-black tracking-tight text-white">27</p>
              <p className="mt-2 text-sm text-gray-400">Unread updates across rooms</p>
            </div>
            <div className="glass-panel rounded-[32px] p-6">
              <p className="text-xs uppercase tracking-[0.3em] text-gray-500">Deadline pressure</p>
              <p className="mt-5 text-lg font-semibold text-white">Assignment 3 due in 9h</p>
              <p className="mt-2 text-sm text-gray-400">Pinned countdowns keep important work visible.</p>
            </div>
            <div className="glass-panel rounded-[32px] p-6 sm:col-span-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-gray-500">Posting modes</p>
                  <h3 className="mt-3 text-xl font-semibold text-white">Visible or anonymous, same live stream.</h3>
                </div>
                <div className="flex gap-2">
                  <span className="panel-chip text-gray-200">Question</span>
                  <span className="panel-chip text-gray-200">Deadline</span>
                </div>
              </div>
              <p className="mt-4 text-sm leading-6 text-gray-400">The interface stays classical and restrained, but the activity layer stays fast and emotionally legible.</p>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
