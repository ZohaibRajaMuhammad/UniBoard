import { cn } from "@/lib/utils";

export function Skeleton({
  className,
  rounded = "rounded-[var(--radius-card)]"
}: {
  className?: string;
  rounded?: string;
}) {
  return <div aria-hidden="true" className={cn("app-skeleton", rounded, className)} />;
}

export function SkeletonStack({
  count = 4,
  className,
  itemClassName
}: {
  count?: number;
  className?: string;
  itemClassName?: string;
}) {
  return (
    <div className={cn("grid gap-3", className)} aria-hidden="true">
      {Array.from({ length: count }).map((_, index) => (
        <Skeleton key={index} className={itemClassName} />
      ))}
    </div>
  );
}
