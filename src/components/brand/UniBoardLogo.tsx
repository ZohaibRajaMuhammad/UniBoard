import Image from "next/image";
import { cn } from "@/lib/utils";

type UniBoardLogoProps = {
  className?: string;
  markClassName?: string;
  labelClassName?: string;
  size?: number;
  showWordmark?: boolean;
  subtitle?: string;
  tone?: "default" | "light" | "dark" | "accent";
};

export function UniBoardLogo({
  className,
  markClassName,
  labelClassName,
  size = 48,
  showWordmark = true,
  subtitle,
  tone = "default"
}: UniBoardLogoProps) {
  return (
    <div className={cn("flex min-w-0 items-center gap-3", className)} data-logo-tone={tone}>
      <div
        className={cn(
          "uniboard-logo-mark relative shrink-0 overflow-hidden rounded-[20px] border border-[color:var(--app-line-strong)] bg-[var(--app-panel-strong)] shadow-[0_10px_24px_rgba(36,56,90,0.08)]",
          markClassName
        )}
        style={{ width: size, height: size }}
      >
        <Image
          src="/uniboard-logo.webp"
          alt=""
          fill
          sizes={`${size}px`}
          aria-hidden="true"
          className="uniboard-logo-image object-cover"
          draggable={false}
        />
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
