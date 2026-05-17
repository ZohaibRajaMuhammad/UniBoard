import { SignIn, SignOutButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { Aperture, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { UniBoardLogo } from "@/components/brand/UniBoardLogo";
import { DeploymentSetupNotice } from "@/components/system/DeploymentSetupNotice";
import { isClerkServerConfigured } from "@/lib/deployment";

export const dynamic = "force-dynamic";

const clerkAppearance = {
  elements: {
    footer: "hidden",
    footerAction: "hidden",
    logoBox: "hidden",
    cardBox: "shadow-none",
    formFieldInput:
      "border !border-[var(--app-line)] !bg-white !text-[var(--app-text)] placeholder:!text-[var(--app-text-muted)] focus:!shadow-none",
    formFieldLabel: "!text-[var(--app-text-soft)]",
    formButtonPrimary: "!bg-[var(--app-primary)] hover:!bg-[var(--app-primary-strong)] !shadow-none",
    socialButtonsBlockButton:
      "!border !border-[var(--app-line)] !bg-[var(--app-panel-strong)] !text-[var(--app-text)] hover:!bg-white",
    footerActionLink: "!text-[var(--app-primary-strong)]"
  }
} as const;

export default async function SignInPage() {
  if (!isClerkServerConfigured) {
    return (
      <DeploymentSetupNotice
        title="Sign-in is not available yet"
        detail="Clerk is not fully configured in this deployment. Add the missing Clerk environment variables in Vercel, redeploy, and the authentication screen will render normally."
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
              Sign out first if you want to log in with another account.
            </p>
          </div>
          <div className="flex flex-col gap-3">
            <Link href="/dashboard" className="app-button app-button-secondary w-full">
              Go to dashboard
            </Link>
            <SignOutButton redirectUrl="/sign-in">
              <button type="button" className="app-button app-button-primary w-full">
                Sign out and use another account
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
          <p className="mt-8 section-eyebrow text-[var(--app-primary-strong)]">Focused access</p>
          <h1 className="mt-3 text-4xl font-bold tracking-[-0.04em] text-white">Enter a calm, structured academic workspace.</h1>
          <p className="mt-4 max-w-xl text-sm leading-8 text-[var(--app-text-soft)]">
            UniBoard is designed for crisp scanning, grounded collaboration, and low-friction study flow across rooms, deadlines, and AI support.
          </p>
          <div className="mt-8 grid gap-4">
            <div className="rounded-[24px] border border-[var(--app-line)] bg-white/5 p-4">
              <div className="flex items-center gap-3 text-[var(--app-primary-strong)]">
                <ShieldCheck size={18} />
                <span className="text-sm font-semibold text-white">Protected workspace entry</span>
              </div>
              <p className="mt-2 text-sm leading-7 text-[var(--app-text-muted)]">Access course operations, saved material, and room-scoped AI from one controlled shell.</p>
            </div>
            <div className="rounded-[24px] border border-[var(--app-line)] bg-white/5 p-4">
              <div className="flex items-center gap-3 text-[var(--app-primary-strong)]">
                <Aperture size={18} />
                <span className="text-sm font-semibold text-white">Clarity before noise</span>
              </div>
              <p className="mt-2 text-sm leading-7 text-[var(--app-text-muted)]">The interface is optimized for large laptop screens and remains readable under dense academic content.</p>
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
            <h1 className="text-3xl font-bold text-white">Sign in to UniBoard</h1>
            <p className="mt-2 text-sm leading-6 text-[var(--app-text-muted)]">
              Secure, low-friction access to your academic workspace.
            </p>
          </div>
          <div className="[&_.cl-card]:!border-0 [&_.cl-card]:!bg-transparent [&_.cl-card]:!shadow-none [&_.cl-headerSubtitle]:!hidden [&_.cl-headerTitle]:!hidden [&_.cl-footer]:!hidden [&_.cl-logoBox]:!hidden">
            <SignIn
              routing="hash"
              redirectUrl="/dashboard"
              appearance={clerkAppearance}
            />
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}
