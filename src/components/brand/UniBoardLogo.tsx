import { cn } from "@/lib/utils";

type UniBoardLogoProps = {
  className?: string;
  markClassName?: string;
  labelClassName?: string;
  size?: number;
  showWordmark?: boolean;
  subtitle?: string;
};

export function UniBoardLogo({
  className,
  markClassName,
  labelClassName,
  size = 48,
  showWordmark = true,
  subtitle
}: UniBoardLogoProps) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div
        className={cn(
          "relative shrink-0 overflow-hidden rounded-[20px] border border-[color:var(--app-line-strong)] bg-[var(--app-panel-strong)] shadow-[0_10px_24px_rgba(36,56,90,0.08)]",
          markClassName
        )}
        style={{ width: size, height: size }}
      >
        <svg viewBox="0 0 64 64" className="h-full w-full" aria-hidden="true" focusable="false">
          <rect x="6" y="6" width="52" height="52" rx="18" fill="rgba(255,255,255,0.92)" opacity="0.96" />
          <path
            d="M20 18.5C20 16.567 21.567 15 23.5 15H27.5C29.433 15 31 16.567 31 18.5V38.5C31 44.299 35.701 49 41.5 49C47.299 49 52 44.299 52 38.5V23.5C52 21.567 50.433 20 48.5 20H44.5C42.567 20 41 21.567 41 23.5V38.5C41 40.433 39.433 42 37.5 42C35.567 42 34 40.433 34 38.5V18.5C34 16.567 35.567 15 37.5 15H48.5C54.299 15 59 19.701 59 25.5V38.5C59 48.165 51.165 56 41.5 56C31.835 56 24 48.165 24 38.5V18.5H20Z"
            fill="#315CF3"
          />
          <circle cx="19" cy="19" r="3" fill="#315CF3" />
          <circle cx="49" cy="45" r="3" fill="#315CF3" opacity="0.55" />
          <path d="M15.5 32H24" stroke="#315CF3" strokeWidth="2.5" strokeLinecap="round" opacity="0.55" />
          <path d="M40 15.5H48.5" stroke="#315CF3" strokeWidth="2.5" strokeLinecap="round" opacity="0.38" />
        </svg>
      </div>

      {showWordmark ? (
        <div className={cn("min-w-0", labelClassName)}>
          <p className="truncate text-lg font-black tracking-[-0.03em] text-[var(--app-text)]">UniBoard</p>
          <p className="truncate text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--app-text-muted)]">
            {subtitle ?? "Academic intelligence workspace"}
          </p>
        </div>
      ) : null}
    </div>
  );
}
