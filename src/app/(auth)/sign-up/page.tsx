import { SignOutButton, SignUp } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
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
      <div className="relative w-full max-w-[27.5rem] space-y-5">
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
          <div className="[&_.cl-card]:!border-0 [&_.cl-card]:!bg-transparent [&_.cl-card]:!shadow-none [&_.cl-footerActionLink]:!text-[var(--app-primary-strong)] [&_.cl-formButtonPrimary]:!bg-[var(--app-primary)] [&_.cl-formButtonPrimary]:hover:!bg-[var(--app-primary-strong)] [&_.cl-formFieldInput]:!border-white/10 [&_.cl-formFieldInput]:!bg-white/5 [&_.cl-formFieldLabel]:!text-[var(--app-text-soft)] [&_.cl-headerSubtitle]:!hidden [&_.cl-headerTitle]:!hidden">
            <SignUp routing="hash" redirectUrl="/dashboard" />
          </div>
        </div>
      </div>
    </div>
  );
}
