import Link from "next/link";
import type { Doc } from "../../../convex/_generated/dataModel";
import { getRoomIcon } from "@/lib/ui-icons";

export function RoomHeader({ room }: { room: Doc<"rooms"> }) {
  const RoomIcon = getRoomIcon(room.emoji);

  return (
    <header className="border-b border-[var(--app-line)] bg-[color:var(--app-panel-strong)] backdrop-blur">
      <div className="page-wrap shell-content-column py-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="app-surface-muted flex h-16 w-16 shrink-0 items-center justify-center rounded-[24px] text-[var(--app-primary-strong)] shadow-[0_18px_36px_rgba(3,8,20,0.16)]">
              <RoomIcon size={28} />
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold text-[var(--app-text)] sm:text-3xl">{room.name}</h1>
                <span className="app-chip">{room.subject}</span>
                <span className="app-chip">{room.batch}</span>
                <span className="app-chip">{room.isPublic ? "Public room" : "Private room"}</span>
              </div>

              <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--app-text-soft)]">
                {room.description ||
                  "A focused academic space for updates, deadlines, questions, and resources that matter to this class."}
              </p>
            </div>
          </div>

          <Link href={`/rooms/${room._id}/settings`} className="app-button app-button-secondary w-full sm:w-auto">
            Room settings
          </Link>
        </div>
      </div>
    </header>
  );
}
