"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Sidebar } from "./Sidebar";

export function MobileSidebar() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed left-4 top-[calc(var(--safe-top)+1rem)] z-50 inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-[var(--app-line)] bg-[color-mix(in_srgb,var(--app-panel-strong)_92%,white_8%)] text-[var(--app-text)] shadow-[0_18px_40px_rgba(24,38,66,0.18)] backdrop-blur lg:hidden"
        aria-label="Open workspace sidebar"
        aria-expanded={open}
        aria-controls="mobile-sidebar"
      >
        <Menu size={18} />
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-[rgba(7,17,26,0.32)] backdrop-blur-[2px]"
            onClick={() => setOpen(false)}
            aria-label="Close workspace sidebar backdrop"
          />

          <aside
            id="mobile-sidebar"
            className="relative flex h-full w-[min(21rem,calc(100vw-2rem))] max-w-full flex-col overflow-hidden border-r border-[var(--app-line)] bg-[color:var(--app-panel-strong)] shadow-[0_28px_80px_rgba(18,34,64,0.22)]"
          >
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="absolute right-4 top-[calc(var(--safe-top)+1rem)] z-10 inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-[var(--app-line)] bg-white/10 text-[var(--app-text)] backdrop-blur"
              aria-label="Close workspace sidebar"
            >
              <X size={16} />
            </button>
            <Sidebar />
          </aside>
        </div>
      ) : null}
    </>
  );
}
