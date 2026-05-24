"use client";

import { useEffect, useState } from "react";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";

export function DeadlineCountdown({ deadlineDate, title }: { deadlineDate: number; title?: string }) {
  const [label, setLabel] = useState("");
  const [status, setStatus] = useState<"safe" | "soon" | "urgent" | "overdue">("safe");

  useEffect(() => {
    function update() {
      const diff = deadlineDate - Date.now();
      if (diff <= 0) {
        setLabel("Overdue");
        setStatus("overdue");
        return;
      }

      const days = Math.floor(diff / 86_400_000);
      const hours = Math.floor((diff % 86_400_000) / 3_600_000);
      const minutes = Math.floor((diff % 3_600_000) / 60_000);

      if (diff < 3_600_000) {
        setLabel(`${minutes}m left`);
        setStatus("urgent");
      } else if (diff < 86_400_000) {
        setLabel(`${hours}h ${minutes}m left`);
        setStatus("urgent");
      } else if (diff < 3 * 86_400_000) {
        setLabel(`${days}d ${hours}h left`);
        setStatus("soon");
      } else {
        setLabel(`${days} days left`);
        setStatus("safe");
      }
    }

    update();
    const interval = window.setInterval(update, 60_000);
    return () => window.clearInterval(interval);
  }, [deadlineDate]);

  return (
    <div
      className={cn(
        "mt-4 inline-flex flex-wrap items-center gap-2 rounded-2xl border px-4 py-2 text-xs",
        status === "safe" && "border-emerald-500/20 bg-emerald-500/10 text-[var(--app-text)]",
        status === "soon" && "border-amber-500/20 bg-amber-500/10 text-[var(--app-text)]",
        status === "urgent" && "border-orange-500/20 bg-orange-500/10 text-[var(--app-text)]",
        status === "overdue" && "border-red-500/20 bg-red-500/10 text-[var(--app-text)]"
      )}
    >
      <Clock size={13} />
      {title ? <span className="font-semibold">{title}</span> : null}
      <span>{label}</span>
    </div>
  );
}
