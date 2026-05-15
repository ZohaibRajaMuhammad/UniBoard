"use client";

import { useDeferredValue, useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { Plus, Search, SearchX, Sparkles, Users } from "lucide-react";
import { api } from "../../../../convex/_generated/api";
import { CreateRoomModal } from "@/components/rooms/CreateRoomModal";
import { RoomCard } from "@/components/rooms/RoomCard";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import type { Room } from "@/types";

export default function RoomsPage() {
  const user = useCurrentUser();
  const publicRooms = useQuery(api.rooms.getPublicRooms, { batch: user?.batch });
  const joinRoom = useMutation(api.rooms.join);
  const [showModal, setShowModal] = useState(false);
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);

  const filteredRooms = useMemo(() => {
    const rooms = (publicRooms as Room[] | undefined) ?? [];
    if (!deferredQuery.trim()) {
      return rooms;
    }

    const normalized = deferredQuery.toLowerCase();
    return rooms.filter((room) =>
      [room.name, room.subject, room.description, room.batch]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(normalized))
    );
  }, [publicRooms, deferredQuery]);

  return (
    <div className="app-scroll">
      <div className="page-wrap page-stack">
        <div className="spotlight-ring glass-panel page-hero">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="section-eyebrow text-[var(--app-primary-strong)]">Rooms</p>
              <h1 className="fluid-title mt-2 font-bold text-white">Find the right academic stream fast.</h1>
              <p className="mt-3 text-sm leading-7 text-[var(--app-text-soft)]">
                Discover public spaces for your batch, join high-signal rooms, and create focused channels when the class needs a clean home.
              </p>
            </div>
            <button onClick={() => setShowModal(true)} className="app-button app-button-primary w-full sm:w-auto">
              <Plus size={16} />
              Create room
            </button>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto_auto]">
            <div className="app-input flex min-h-[3.25rem] items-center gap-3">
              <Search size={18} className="shrink-0 text-[var(--app-text-muted)]" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search rooms by title, subject, batch, or description"
                className="w-full bg-transparent text-sm text-white outline-none placeholder:text-[var(--app-text-muted)]"
              />
            </div>
            <div className="stat-card">
              <p className="text-xs uppercase tracking-[0.22em] text-[var(--app-text-muted)]">Visible rooms</p>
              <p className="mt-2 text-2xl font-black text-white">{filteredRooms.length}</p>
            </div>
            <div className="stat-card">
              <p className="text-xs uppercase tracking-[0.22em] text-[var(--app-text-muted)]">Batch</p>
              <p className="mt-2 text-sm font-semibold text-white">{user?.batch ?? "Unassigned"}</p>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-3 text-sm text-[var(--app-text-soft)]">
            <div className="panel-chip rounded-2xl px-4 py-2">
              <Users size={14} />
              Public collaboration
            </div>
            <div className="panel-chip rounded-2xl px-4 py-2">
              <Sparkles size={14} />
              Optimized for fast subject discovery
            </div>
          </div>
        </div>

        {publicRooms === undefined ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="h-40 animate-pulse rounded-3xl bg-white/5" />
            ))}
          </div>
        ) : publicRooms.length === 0 ? (
          <div className="glass-panel rounded-[var(--radius-panel)] p-8 text-sm text-[var(--app-text-muted)]">
            No public rooms available for your current batch.
          </div>
        ) : filteredRooms.length === 0 ? (
          <div className="glass-panel rounded-[var(--radius-panel)] p-8 text-center sm:p-10">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl border border-[var(--app-line)] bg-white/5 text-[var(--app-primary-strong)]">
              <SearchX size={24} />
            </div>
            <h2 className="mt-4 text-xl font-semibold text-white">No rooms match your search</h2>
            <p className="mt-2 text-sm text-[var(--app-text-muted)]">Try a subject code, room name, or batch keyword.</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredRooms.map((room) => (
              <div key={room._id} className="space-y-3">
                <RoomCard room={room} />
                <button
                  onClick={() => void joinRoom({ roomId: room._id })}
                  className="app-button app-button-secondary w-full"
                >
                  Join room
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
      {showModal ? <CreateRoomModal onClose={() => setShowModal(false)} /> : null}
    </div>
  );
}
