import { auth } from "@clerk/nextjs/server";
import nextDynamic from "next/dynamic";
import { redirect } from "next/navigation";
import { DeploymentSetupNotice } from "@/components/system/DeploymentSetupNotice";
import { ThemeToggle } from "@/components/system/ThemeToggle";
import { AiAssistant } from "@/components/ai/AiAssistant";
import { MobileSidebar } from "@/components/layout/MobileSidebar";
import { getSafeAuthState, isClerkServerConfigured } from "@/lib/deployment";

export const dynamic = "force-dynamic";

const Sidebar = nextDynamic(() => import("@/components/layout/Sidebar").then((mod) => mod.Sidebar), {
  ssr: false
});

const MobileNav = nextDynamic(() => import("@/components/layout/MobileNav").then((mod) => mod.MobileNav), {
  ssr: false
});

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  if (!isClerkServerConfigured) {
    return (
      <DeploymentSetupNotice
        title="Dashboard auth is not configured"
        detail="UniBoard dashboard routes are protected by Clerk. Add the missing Vercel environment variables before deploying protected routes."
      />
    );
  }

  const { userId, authAvailable } = await getSafeAuthState(() => auth());
  if (!authAvailable) {
    return (
      <DeploymentSetupNotice
        title="Dashboard authentication is temporarily unavailable"
        detail="UniBoard could not validate the current Clerk session for protected routes. Public pages remain available, but dashboard access will resume only after the authentication service responds normally."
      />
    );
  }
  if (!userId) {
    redirect("/sign-in");
  }

  return (
    <div className="app-shell flex h-[100dvh] max-h-[100dvh] overflow-hidden">
      <aside className="hidden h-full w-[18rem] shrink-0 lg:flex xl:w-[19.5rem]">
        <Sidebar />
      </aside>
      <MobileSidebar />
      <main id="main-content" className="relative flex h-full min-w-0 flex-1 flex-col overflow-hidden pb-28 md:pb-0">
        <div className="pointer-events-none absolute right-4 top-4 z-40 md:right-5 md:top-5">
          <ThemeToggle className="pointer-events-auto" elevated />
        </div>
        {children}
      </main>
      <MobileNav />
      <AiAssistant />
    </div>
  );
}
