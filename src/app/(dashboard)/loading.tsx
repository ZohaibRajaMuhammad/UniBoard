import { Skeleton, SkeletonStack } from "@/components/ui/Skeleton";

export default function DashboardLoading() {
  return (
    <div className="app-scroll">
      <div className="page-wrap page-stack shell-content-column">
        <section className="glass-panel page-hero app-view-enter">
          <Skeleton className="h-4 w-36 rounded-full" />
          <Skeleton className="mt-5 h-10 w-full max-w-xl" />
          <Skeleton className="mt-4 h-4 w-full max-w-2xl rounded-full" />
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <Skeleton className="h-28" />
            <Skeleton className="h-28" />
            <Skeleton className="h-28" />
          </div>
        </section>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <SkeletonStack count={6} itemClassName="h-40 rounded-[var(--radius-panel)]" />
        </div>
      </div>
    </div>
  );
}
