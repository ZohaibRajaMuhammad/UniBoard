"use client";

import Image from "next/image";
import { Sparkles } from "lucide-react";
import { cn, initials } from "@/lib/utils";

const PALETTES = [
  {
    shell: "from-sky-500/20 to-blue-500/10",
    ring: "border-sky-400/30",
    core: "bg-sky-500/18 text-sky-100",
    dot: "bg-sky-300/80"
  },
  {
    shell: "from-violet-500/18 to-indigo-500/10",
    ring: "border-violet-400/30",
    core: "bg-violet-500/16 text-violet-100",
    dot: "bg-violet-300/80"
  },
  {
    shell: "from-emerald-500/18 to-teal-500/10",
    ring: "border-emerald-400/28",
    core: "bg-emerald-500/16 text-emerald-100",
    dot: "bg-emerald-300/80"
  },
  {
    shell: "from-amber-500/18 to-orange-500/10",
    ring: "border-amber-400/30",
    core: "bg-amber-500/16 text-amber-100",
    dot: "bg-amber-300/85"
  }
];

function pickPalette(seed: string) {
  const total = Array.from(seed).reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return PALETTES[total % PALETTES.length];
}

export function ProfileAvatar({
  name,
  imageUrl,
  size = "md",
  className
}: {
  name: string;
  imageUrl?: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const palette = pickPalette(name);
  const sizing =
    size === "sm"
      ? {
          shell: "h-9 w-9",
          ring: "h-7 w-7 text-[10px]",
          badge: "h-3.5 w-3.5"
        }
      : size === "lg"
        ? {
            shell: "h-20 w-20",
            ring: "h-14 w-14 text-lg",
            badge: "h-5 w-5"
          }
        : {
            shell: "h-11 w-11",
            ring: "h-8 w-8 text-sm",
            badge: "h-4 w-4"
          };

  if (imageUrl) {
    return (
      <div
        className={cn(
          "relative flex shrink-0 items-center justify-center rounded-full border border-[var(--app-line-strong)] bg-white/5",
          sizing.shell,
          className
        )}
      >
        <Image
          src={imageUrl}
          alt={`${name} avatar`}
          fill
          sizes={size === "lg" ? "80px" : size === "sm" ? "36px" : "44px"}
          className="rounded-full object-cover"
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-[var(--app-line-strong)] bg-[linear-gradient(145deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02))]",
        sizing.shell,
        className
      )}
    >
      <div className={cn("absolute inset-[10%] rounded-full bg-gradient-to-br opacity-90", palette.shell)} />
      <div className="absolute inset-[18%] rounded-full border border-white/10" />
      <div className={cn("relative z-[1] flex items-center justify-center rounded-full border backdrop-blur-sm", sizing.ring, palette.ring, palette.core)}>
        <span className="font-semibold tracking-[0.08em]">{initials(name)}</span>
      </div>
      <div className={cn("absolute bottom-[10%] right-[10%] z-[2] flex items-center justify-center rounded-full border border-white/15 bg-[var(--app-panel-strong)] text-[var(--app-primary-strong)] shadow-[0_6px_16px_rgba(11,20,37,0.28)]", sizing.badge)}>
        <Sparkles size={size === "lg" ? 10 : 8} />
      </div>
      <div className={cn("absolute left-[18%] top-[20%] rounded-full blur-[1px]", palette.dot, size === "lg" ? "h-2.5 w-2.5" : "h-2 w-2")} />
    </div>
  );
}
