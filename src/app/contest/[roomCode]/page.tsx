"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useRoomSocket } from "@/hooks/useSocket";
import { Button } from "@/components/ui/button";
import { Copy, Check, Wifi, WifiOff, Crown, Users } from "lucide-react";

interface Participant {
  id: string;
  email: string;
  name: string | null;
}

interface Room {
  id: string;
  roomCode: string;
  hostId: string;
  status: string;
  participants: Participant[];
}

export default function ContestPage() {
  const params = useParams();
  const router = useRouter();
  const roomCode = params?.roomCode as string;

  const [room, setRoom] = useState<Room | null>(null);
  const [currentUser, setCurrentUser] = useState<{
    id: string;
    name?: string | null;
    email: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [copied, setCopied] = useState(false);

  const { participants, isConnected } = useRoomSocket(roomCode);

  // load current user
  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (!stored) {
      router.replace("/login");
      return;
    }
    try {
      setCurrentUser(JSON.parse(stored));
    } catch {
      router.replace("/login");
    }
  }, [router]);

  // fetch room on mount
  useEffect(() => {
    if (!roomCode) return;
    fetch(`/api/rooms/${roomCode}`)
      .then((res) => res.json())
      .then((data) => {
        if (data?.room) {
          setRoom(data.room);
        } else {
          setNotFound(true);
        }
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [roomCode]);

  // keep participants in sync with socket updates
  useEffect(() => {
    if (participants.length > 0) {
      setRoom((prev) => (prev ? { ...prev, participants } : null));
    }
  }, [participants]);

  function copyCode() {
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0A0A0F]">
        <div className="text-center space-y-4">
          <div className="w-10 h-10 border-2 border-[#7c5cff] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-gray-400 text-sm">Loading room...</p>
        </div>
      </div>
    );
  }

  if (notFound || !room) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#0A0A0F] gap-4">
        <p className="text-red-400 text-xl font-semibold">Room not found</p>
        <Button
          onClick={() => router.push("/")}
          className="bg-[#7c5cff] hover:bg-[#6a4ce0] text-white rounded-xl"
        >
          Go Home
        </Button>
      </div>
    );
  }

  const isHost = currentUser?.id === room.hostId;
  const displayParticipants =
    participants.length > 0 ? participants : room.participants;

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-white">
      {/* Top bar */}
      <div className="border-b border-white/10 bg-[#0A0A0F]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span
              onClick={() => router.push("/")}
              className="font-mono font-bold text-white text-lg cursor-pointer hover:text-[#7c5cff] transition-colors"
            >
              AlgoAryna
            </span>
            <span className="text-white/20">/</span>
            <span className="font-mono font-bold text-[#7c5cff] tracking-widest">
              {room.roomCode}
            </span>
            <span
              className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded-full border ${
                room.status === "waiting"
                  ? "border-yellow-500/30 bg-yellow-500/10 text-yellow-400"
                  : room.status === "active"
                    ? "border-green-500/30 bg-green-500/10 text-green-400"
                    : "border-gray-500/30 bg-gray-500/10 text-gray-400"
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
              {room.status.charAt(0).toUpperCase() + room.status.slice(1)}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div
              className={`flex items-center gap-1.5 text-xs ${
                isConnected ? "text-green-400" : "text-red-400"
              }`}
            >
              {isConnected ? <Wifi size={14} /> : <WifiOff size={14} />}
              {isConnected ? "Connected" : "Disconnected"}
            </div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="max-w-6xl mx-auto px-6 py-10 grid lg:grid-cols-3 gap-8">
        {/* Participants panel */}
        <div className="lg:col-span-1 space-y-4">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <h2 className="text-base font-semibold mb-5 flex items-center gap-2">
              <Users size={16} className="text-[#7c5cff]" />
              Participants
              <span className="ml-auto text-xs text-gray-400 font-normal bg-white/5 px-2 py-0.5 rounded-full border border-white/10">
                {displayParticipants.length}
              </span>
            </h2>

            <div className="space-y-2">
              {displayParticipants.length === 0 ? (
                <p className="text-gray-500 text-sm">No participants yet</p>
              ) : (
                displayParticipants.map((p) => (
                  <div
                    key={p.id}
                    className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${
                      p.id === currentUser?.id
                        ? "border-[#7c5cff]/40 bg-[#7c5cff]/10"
                        : "border-white/5 bg-white/5"
                    }`}
                  >
                    <div className="w-9 h-9 bg-[#7c5cff]/20 border border-[#7c5cff]/30 rounded-full flex items-center justify-center text-[#7c5cff] font-bold text-sm shrink-0">
                      {(p.name?.[0] ?? p.email[0]).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm truncate">
                        {p.name ?? "Anonymous"}
                        {p.id === currentUser?.id && (
                          <span className="ml-1 text-xs text-gray-500">
                            (you)
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {p.email}
                      </p>
                    </div>
                    {p.id === room.hostId && (
                      <Crown
                        size={14}
                        className="text-yellow-400 shrink-0"
                        title="Host"
                      />
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Room code share box */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs text-gray-400 mb-2 font-medium">
              Invite friends — share room code
            </p>
            <div className="flex items-center gap-2">
              <code className="text-sm text-[#7c5cff] bg-[#7c5cff]/10 px-4 py-2 rounded-lg flex-1 text-center font-mono tracking-widest border border-[#7c5cff]/20 font-bold">
                {room.roomCode}
              </code>
              <Button
                onClick={copyCode}
                size="sm"
                className="bg-[#7c5cff] hover:bg-[#6a4ce0] text-white rounded-lg h-9 w-9 p-0 shrink-0"
                title="Copy room code"
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
              </Button>
            </div>
            {copied && (
              <p className="text-xs text-green-400 mt-2 text-center">
                Room code copied!
              </p>
            )}
          </div>
        </div>

        {/* Waiting / arena area */}
        <div className="lg:col-span-2">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-8 flex flex-col items-center justify-center min-h-105 text-center">
            {room.status === "waiting" ? (
              <>
                <div className="w-16 h-16 rounded-full border-2 border-[#7c5cff]/30 bg-[#7c5cff]/10 flex items-center justify-center mb-6">
                  <div className="w-4 h-4 rounded-full bg-[#7c5cff] animate-pulse" />
                </div>
                <h3 className="text-2xl font-bold mb-3">
                  {isHost ? "Ready to start?" : "Waiting for host to start..."}
                </h3>
                <p className="text-gray-400 text-sm max-w-sm mb-2">
                  {isHost
                    ? `${displayParticipants.length} participant${displayParticipants.length !== 1 ? "s" : ""} in the room. Start when everyone is ready.`
                    : "The contest will begin once the host starts it. Hang tight!"}
                </p>
                {isHost && (
                  <Button
                    className="mt-6 bg-[#7c5cff] hover:bg-[#6a4ce0] text-white rounded-xl px-8 h-12 font-bold"
                    onClick={() => router.push(`/contest/${roomCode}/select`)}
                  >
                    Select Question
                  </Button>
                )}
              </>
            ) : (
              <p className="text-gray-400 capitalize">
                Contest is {room.status}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
