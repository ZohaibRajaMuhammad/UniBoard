import { auth } from "@clerk/nextjs/server";
import nextDynamic from "next/dynamic";
import { redirect } from "next/navigation";
import { DeploymentSetupNotice } from "@/components/system/DeploymentSetupNotice";
import { AiAssistant } from "@/components/ai/AiAssistant";
import { MobileSidebar } from "@/components/layout/MobileSidebar";
import { isClerkServerConfigured } from "@/lib/deployment";

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

  const { userId } = await auth();
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
        {children}
      </main>
      <MobileNav />
      <AiAssistant />
    </div>
  );
}
