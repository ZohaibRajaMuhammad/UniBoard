import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-950 px-4 py-10">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-brand-500/20 text-3xl">
            📚
          </div>
          <h1 className="text-3xl font-bold text-white">Create your UniBoard account</h1>
          <p className="mt-2 text-sm text-gray-400">Join your rooms, sync your profile, and start posting live.</p>
        </div>
        <SignUp
          path="/sign-up"
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
