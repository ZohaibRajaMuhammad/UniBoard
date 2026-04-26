import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { MobileNav } from "@/components/layout/MobileNav";
import { Sidebar } from "@/components/layout/Sidebar";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth();
  if (!userId) {
    redirect("/sign-in");
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-950">
      <aside className="hidden w-80 shrink-0 md:flex">
        <Sidebar />
      </aside>
      <main className="flex min-w-0 flex-1 flex-col overflow-hidden">{children}</main>
      <MobileNav />
    </div>
  );
}
