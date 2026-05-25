"use client";

import { Monitor, Moon, SunMedium } from "lucide-react";
import { useTheme } from "@/components/providers/ThemeProvider";
import { cn } from "@/lib/utils";

export function ThemeToggle({
  className,
  elevated = false
}: {
  className?: string;
  elevated?: boolean;
}) {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={cn(
        "inline-flex min-h-[3rem] items-center gap-3 rounded-full border border-[var(--app-line)] px-3 py-2 text-sm font-semibold text-[var(--app-text-soft)] transition hover:-translate-y-0.5 hover:bg-white/10 hover:text-[var(--app-text)]",
        elevated ? "bg-[var(--app-floating-nav)] shadow-[0_18px_48px_rgba(8,16,28,0.28)] backdrop-blur-xl" : "bg-white/5",
        className
      )}
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
      title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
    >
      <span className="relative flex h-9 w-9 items-center justify-center rounded-full border border-[var(--app-line)] bg-white/5">
        {theme === "dark" ? <Moon size={16} /> : <SunMedium size={16} />}
      </span>
      {/* <span className="hidden sm:block">
        <span className="block text-[10px] uppercase tracking-[0.18em] text-[var(--app-text-muted)]">Appearance</span>
        <span className="block text-sm font-semibold text-[var(--app-text)]">{theme === "dark" ? "Dark mode" : "Light mode"}</span>
      </span> */}
      <Monitor size={15} className="hidden text-[var(--app-text-muted)] sm:block" />
    </button>
  );
}
