import { SignOutButton, SignUp } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { Aperture, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { UniBoardLogo } from "@/components/brand/UniBoardLogo";
import { DeploymentSetupNotice } from "@/components/system/DeploymentSetupNotice";
import { isClerkServerConfigured } from "@/lib/deployment";

export const dynamic = "force-dynamic";

export default async function SignUpPage() {
  if (!isClerkServerConfigured) {
    return (
      <DeploymentSetupNotice
        title="Sign-up is not available yet"
        detail="Clerk is not fully configured in this deployment. Add the missing Clerk environment variables in Vercel, redeploy, and the account creation screen will render normally."
      />
    );
  }

  const { userId } = await auth();

  if (userId) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4 py-10">
        <div className="glass-panel w-full max-w-[27.5rem] space-y-6 rounded-[28px] p-7">
          <div className="space-y-3 text-center">
            <h1 className="text-3xl font-bold text-white">You are already signed in</h1>
            <p className="text-sm leading-6 text-[var(--app-text-muted)]">
              Sign out first if you want to create or access another account from this browser.
            </p>
          </div>
          <div className="flex flex-col gap-3">
            <Link href="/dashboard" className="app-button app-button-secondary w-full">
              Go to dashboard
            </Link>
            <SignOutButton redirectUrl="/sign-up">
              <button type="button" className="app-button app-button-primary w-full">
                Sign out and continue
              </button>
            </SignOutButton>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10">
      <div className="hero-grid absolute inset-0 opacity-20" />
      <div className="relative grid w-full max-w-[66rem] gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <section className="glass-panel hidden rounded-[32px] p-8 lg:block">
          <UniBoardLogo size={60} />
          <p className="mt-8 section-eyebrow text-[var(--app-primary-strong)]">Account setup</p>
          <h1 className="mt-3 text-4xl font-bold tracking-[-0.04em] text-white">Create a refined academic identity without clutter.</h1>
          <p className="mt-4 max-w-xl text-sm leading-8 text-[var(--app-text-soft)]">
            Join the workspace with clear access, readable controls, and a UI that keeps course operations disciplined from the first screen.
          </p>
          <div className="mt-8 grid gap-4">
            <div className="rounded-[24px] border border-[var(--app-line)] bg-white/5 p-4">
              <div className="flex items-center gap-3 text-[var(--app-primary-strong)]">
                <ShieldCheck size={18} />
                <span className="text-sm font-semibold text-white">Structured onboarding</span>
              </div>
              <p className="mt-2 text-sm leading-7 text-[var(--app-text-muted)]">Account creation is kept minimal so the user can move into rooms, deadlines, and study flows quickly.</p>
            </div>
            <div className="rounded-[24px] border border-[var(--app-line)] bg-white/5 p-4">
              <div className="flex items-center gap-3 text-[var(--app-primary-strong)]">
                <Aperture size={18} />
                <span className="text-sm font-semibold text-white">Readable by design</span>
              </div>
              <p className="mt-2 text-sm leading-7 text-[var(--app-text-muted)]">Inputs, labels, and hierarchy are tuned for clarity on 1920 by 1080 laptops and smaller screens alike.</p>
            </div>
          </div>
        </section>

        <div className="w-full max-w-[30rem] space-y-5 lg:justify-self-end">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-[var(--app-text-muted)] transition hover:text-white">
          <ArrowLeft size={15} />
          Back to home
        </Link>
        <div className="glass-panel rounded-[28px] p-7">
          <div className="mb-6">
            <UniBoardLogo size={54} className="mb-5" showWordmark={false} />
            <h1 className="text-3xl font-bold text-white">Create your UniBoard account</h1>
            <p className="mt-2 text-sm leading-6 text-[var(--app-text-muted)]">
              Institutional onboarding with enough guidance to feel credible, not noisy.
            </p>
          </div>
          <div className="[&_.cl-card]:!border-0 [&_.cl-card]:!bg-transparent [&_.cl-card]:!shadow-none [&_.cl-footerActionLink]:!text-[var(--app-primary-strong)] [&_.cl-formButtonPrimary]:!bg-[var(--app-primary)] [&_.cl-formButtonPrimary]:hover:!bg-[var(--app-primary-strong)] [&_.cl-formFieldInput]:!border-white/10 [&_.cl-formFieldInput]:!bg-white/5 [&_.cl-formFieldInput]:!text-[var(--app-text)] [&_.cl-formFieldLabel]:!text-[var(--app-text-soft)] [&_.cl-headerSubtitle]:!hidden [&_.cl-headerTitle]:!hidden [&_.cl-footer]:!hidden [&_.cl-logoBox]:!hidden">
            <SignUp
              routing="hash"
              redirectUrl="/dashboard"
              appearance={{
                elements: {
                  footer: "hidden",
                  footerAction: "hidden",
                  logoBox: "hidden",
                  cardBox: "shadow-none"
                }
              }}
            />
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}
