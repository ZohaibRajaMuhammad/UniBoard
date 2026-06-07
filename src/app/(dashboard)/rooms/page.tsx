"use client";

import { useDeferredValue, useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { Plus, Search, SearchX, Sparkles, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import { CreateRoomModal } from "@/components/rooms/CreateRoomModal";
import { RoomCard } from "@/components/rooms/RoomCard";
import { Skeleton } from "@/components/ui/Skeleton";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useTimedLoadState } from "@/hooks/useTimedLoadState";
import type { Room } from "@/types";

export default function RoomsPage() {
  const router = useRouter();
  const user = useCurrentUser();
  const publicRooms = useQuery(api.rooms.getPublicRooms, { batch: user?.batch });
  const publicRoomsLoadState = useTimedLoadState(publicRooms);
  const publicRoomList = useMemo(() => (publicRooms as Room[] | undefined) ?? [], [publicRooms]);
  const joinRoom = useMutation(api.rooms.join);
  const [showModal, setShowModal] = useState(false);
  const [query, setQuery] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [joinStatus, setJoinStatus] = useState("");
  const [isJoiningByCode, setIsJoiningByCode] = useState(false);
  const [joiningRoomId, setJoiningRoomId] = useState<string | null>(null);
  const deferredQuery = useDeferredValue(query);

  const filteredRooms = useMemo(() => {
    const rooms = publicRoomList;
    if (!deferredQuery.trim()) {
      return rooms;
    }

    const normalized = deferredQuery.toLowerCase();
    return rooms.filter((room) =>
      [room.name, room.subject, room.description, room.batch]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(normalized))
    );
  }, [publicRoomList, deferredQuery]);

  async function handleJoinPublicRoom(roomId: Id<"rooms">) {
    setJoiningRoomId(roomId);
    setJoinStatus("");
    try {
      const joinedRoomId = await joinRoom({ roomId });
      router.push(`/rooms/${joinedRoomId}`);
    } catch (error) {
      setJoinStatus(error instanceof Error ? error.message : "Unable to join this room.");
    } finally {
      setJoiningRoomId(null);
    }
  }

  async function handleJoinByCode() {
    if (!joinCode.trim() || isJoiningByCode) {
      return;
    }

    setIsJoiningByCode(true);
    setJoinStatus("");
    try {
      const joinedRoomId = await joinRoom({ joinCode });
      setJoinCode("");
      setJoinStatus("Private room joined successfully.");
      router.push(`/rooms/${joinedRoomId}`);
    } catch (error) {
      setJoinStatus(error instanceof Error ? error.message : "Unable to join private room.");
    } finally {
      setIsJoiningByCode(false);
    }
  }

  return (
    <div className="app-scroll">
      <div className="page-wrap page-stack shell-content-column">
        <div className="spotlight-ring glass-panel page-hero">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="section-eyebrow text-[var(--app-primary-strong)]">Rooms</p>
              <h1 className="fluid-title mt-2 font-bold text-white">Find the right academic stream fast.</h1>
              <p className="mt-3 text-sm leading-7 text-[var(--app-text-soft)]">
                Discover public spaces for your batch, join high-signal rooms, and create focused channels when the class needs a clean home.
              </p>
            </div>
            <button
              onClick={() => setShowModal(true)}
              disabled={user?.role === "pending"}
              className="app-button app-button-primary w-full disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            >
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

          <div className="mt-5 grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(18rem,24rem)]">
            <div className="panel-chip rounded-2xl px-4 py-3 text-sm">
              <Users size={14} />
              Public rooms can be joined from the grid. Private rooms require a join code shared by the room owner or teacher.
            </div>

            <div className="app-surface-muted rounded-[24px] p-4">
              <p className="text-xs uppercase tracking-[0.22em] text-[var(--app-text-muted)]">Join private room</p>
              <div className="mt-3 flex flex-col gap-3 sm:flex-row xl:flex-col">
                <input
                  value={joinCode}
                  onChange={(event) => setJoinCode(event.target.value.toUpperCase())}
                  placeholder="Enter private room code"
                  className="app-input"
                  maxLength={12}
                />
                <button
                  type="button"
                  onClick={() => void handleJoinByCode()}
                  disabled={!joinCode.trim() || isJoiningByCode || user?.role === "pending"}
                  className="app-button app-button-primary w-full disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isJoiningByCode ? "Joining..." : "Join by code"}
                </button>
              </div>
              <div className="mt-3 rounded-2xl border border-[var(--app-line)] bg-white/5 p-3 text-xs leading-6 text-[var(--app-text-muted)]">
                Private rooms work like this:
                <div className="mt-2 grid gap-1">
                  <p>1. Get the join code from the room creator or teacher.</p>
                  <p>2. Paste the code here and submit it.</p>
                  <p>3. The room opens once Convex confirms your membership.</p>
                </div>
              </div>
              {joinStatus ? <p className="mt-3 text-sm text-[var(--app-text-soft)]">{joinStatus}</p> : null}
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
          {user?.role === "pending" ? (
            <div className="mt-5 rounded-[24px] border border-amber-400/20 bg-amber-500/10 p-4 text-sm leading-7 text-[var(--app-text)]">
              Pending accounts can browse room discovery, but joining rooms or creating governed spaces requires completed student setup or approved teacher access.
            </div>
          ) : null}
        </div>

        {publicRoomsLoadState.isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} className="h-40 rounded-3xl" />
            ))}
          </div>
        ) : publicRoomsLoadState.timedOut ? (
          <div className="glass-panel rounded-[var(--radius-panel)] p-8 text-sm text-[var(--app-text-soft)]">
            Room discovery is taking longer than expected. Refresh the page or check the Convex deployment URL.
          </div>
        ) : publicRoomList.length === 0 ? (
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
                  onClick={() => void handleJoinPublicRoom(room._id)}
                  disabled={joiningRoomId === room._id || user?.role === "pending"}
                  className="app-button app-button-secondary w-full disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {joiningRoomId === room._id ? "Joining..." : "Join room"}
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
