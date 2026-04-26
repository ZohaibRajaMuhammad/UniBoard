"use client";

import { useDeferredValue, useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { Plus, Search, Sparkles, Users } from "lucide-react";
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
    <div className="flex-1 overflow-y-auto">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <div className="spotlight-ring glass-panel mb-6 rounded-[34px] p-6 sm:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-sm uppercase tracking-[0.22em] text-brand-200">Rooms</p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">Find the right academic stream fast.</h1>
              <p className="mt-3 text-sm leading-6 text-gray-300">
                Discover public spaces for your batch, join high-signal rooms, and create focused channels when the class needs a clean home.
              </p>
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-brand-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-400"
            >
              <Plus size={16} />
              Create room
            </button>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_auto_auto]">
            <div className="flex items-center gap-3 rounded-3xl border border-white/10 bg-white/[0.04] px-4 py-3">
              <Search size={18} className="text-gray-500" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search rooms by title, subject, batch, or description"
                className="w-full bg-transparent text-sm text-white outline-none placeholder:text-gray-500"
              />
            </div>
            <div className="rounded-3xl border border-white/10 bg-black/20 px-4 py-3">
              <p className="text-xs uppercase tracking-[0.22em] text-gray-500">Visible rooms</p>
              <p className="mt-2 text-2xl font-black text-white">{filteredRooms.length}</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-black/20 px-4 py-3">
              <p className="text-xs uppercase tracking-[0.22em] text-gray-500">Batch</p>
              <p className="mt-2 text-sm font-semibold text-white">{user?.batch ?? "Unassigned"}</p>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-3 text-sm text-gray-300">
            <div className="panel-chip rounded-2xl px-4 py-2"><Users size={14} /> Public collaboration</div>
            <div className="panel-chip rounded-2xl px-4 py-2"><Sparkles size={14} /> Optimized for fast subject discovery</div>
          </div>
        </div>

        {publicRooms === undefined ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="h-40 animate-pulse rounded-3xl bg-white/5" />
            ))}
          </div>
        ) : publicRooms.length === 0 ? (
          <div className="glass-panel rounded-[28px] p-8 text-sm text-gray-400">No public rooms available for your current batch.</div>
        ) : filteredRooms.length === 0 ? (
          <div className="glass-panel rounded-[28px] p-10 text-center">
            <div className="text-4xl">🔎</div>
            <h2 className="mt-4 text-xl font-semibold text-white">No rooms match your search</h2>
            <p className="mt-2 text-sm text-gray-400">Try a subject code, room name, or batch keyword.</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredRooms.map((room) => (
              <div key={room._id} className="space-y-3">
                <RoomCard room={room} />
                <button
                  onClick={() => void joinRoom({ roomId: room._id })}
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-white transition hover:bg-white/10"
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
