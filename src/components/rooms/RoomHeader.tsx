import Link from "next/link";
import type { Doc } from "../../../convex/_generated/dataModel";

export function RoomHeader({ room }: { room: Doc<"rooms"> }) {
  return (
    <header className="border-b border-white/10 bg-gray-950/85 backdrop-blur">
      <div className="page-wrap py-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[24px] border border-white/10 bg-white/5 text-3xl shadow-[0_18px_36px_rgba(3,8,20,0.28)]">
              {room.emoji}
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold text-white sm:text-3xl">{room.name}</h1>
                <span className="panel-chip text-gray-200">{room.subject}</span>
                <span className="panel-chip text-gray-300">{room.batch}</span>
                <span className="panel-chip text-gray-300">{room.isPublic ? "Public room" : "Private room"}</span>
              </div>

              <p className="mt-3 max-w-3xl text-sm leading-7 text-gray-300">
                {room.description || "A focused academic space for updates, deadlines, questions, and resources that matter to this class."}
              </p>
            </div>
          </div>

          <Link
            href={`/rooms/${room._id}/settings`}
            className="app-button app-button-secondary w-full sm:w-auto"
          >
            Room settings
          </Link>
        </div>
      </div>
    </header>
  );
}
