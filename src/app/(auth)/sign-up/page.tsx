import { SignOutButton, SignUp } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { DeploymentSetupNotice } from "@/components/system/DeploymentSetupNotice";
import { isClerkConfigured } from "@/lib/deployment";

export const dynamic = "force-dynamic";

export default async function SignUpPage() {
  if (!isClerkConfigured) {
    return (
      <DeploymentSetupNotice
        title="Sign-up is not available yet"
        detail="Clerk is not configured in this deployment. Add the missing public key in Vercel, redeploy, and the account creation screen will render normally."
      />
    );
  }

  const { userId } = await auth();

  if (userId) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-950 px-4 py-10">
        <div className="w-full max-w-md space-y-6 rounded-[1.75rem] border border-white/10 bg-gray-900 p-8 shadow-2xl">
          <div className="space-y-3 text-center">
            <h1 className="text-3xl font-bold text-white">You are already signed in</h1>
            <p className="text-sm leading-6 text-gray-400">
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
    <div className="flex min-h-screen items-center justify-center bg-gray-950 px-4 py-10">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white">Create your UniBoard account</h1>
          <p className="mt-2 text-sm text-gray-400">Join your rooms, sync your profile, and start posting live.</p>
        </div>
        <SignUp
          routing="hash"
          redirectUrl="/dashboard"
          appearance={{
            elements: {
              card: "bg-gray-900 border border-gray-800 shadow-2xl",
              headerTitle: "text-white",
              headerSubtitle: "text-gray-400",
              formFieldLabel: "text-gray-300",
              formFieldInput: "bg-gray-800 border-gray-700 text-white",
              formButtonPrimary: "bg-[#3657f7] hover:bg-[#5b7cff]",
              footerActionLink: "text-[#90b3ff]"
            }
          }}
        />
      </div>
    </div>
  );
}
