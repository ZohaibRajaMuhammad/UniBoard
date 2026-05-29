import Link from "next/link";
import { getMissingClientEnvVars } from "@/lib/deployment";

const missingEnvVars = getMissingClientEnvVars();

export function DeploymentSetupNotice({
  title = "Deployment setup required",
  detail = "This deployment is missing the public environment variables required to render Clerk and Convex safely."
}: {
  title?: string;
  detail?: string;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-950 px-4 py-10">
      <section className="w-full max-w-2xl rounded-[2rem] border border-white/10 bg-gray-900/95 p-8 shadow-2xl shadow-black/30">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-brand-200">Deployment guard</p>
        <h1 className="mt-4 text-3xl font-bold text-white">{title}</h1>
        <p className="mt-3 text-sm leading-6 text-[var(--app-text-muted)]">{detail}</p>

        <div className="mt-6 rounded-3xl border border-amber-400/20 bg-amber-500/10 p-5">
          <p className="text-sm font-semibold text-[var(--app-text)]">Missing environment variables</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {missingEnvVars.map((variable) => (
              <span
                key={variable}
                className="rounded-full border border-amber-300/20 bg-black/20 px-3 py-1 text-xs font-semibold text-[var(--app-text)]"
              >
                {variable}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-6 space-y-3 rounded-3xl border border-white/10 bg-black/20 p-5 text-sm leading-6 text-[var(--app-text-soft)]">
          <p>Set the same values from your local `.env.local` in the Vercel project settings, then redeploy.</p>
          <p>
            Vercel path:{" "}
            <span className="font-semibold text-white">Project Settings {"->"} Environment Variables</span>
          </p>
          <p>
            Local reference:{" "}
            <code className="rounded bg-white/5 px-2 py-1 text-xs text-[var(--app-text)]">.env.example</code>
          </p>
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link href="/" className="app-button app-button-primary w-full sm:w-auto">
            Go to homepage
          </Link>
          <a
            href="https://dashboard.clerk.com/last-active?path=api-keys"
            target="_blank"
            rel="noreferrer"
            className="app-button app-button-secondary w-full sm:w-auto"
          >
            Open Clerk keys
          </a>
        </div>
      </section>
    </main>
  );
}
