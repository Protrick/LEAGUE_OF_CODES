"use client";

import Image from "next/image";
import { Plus, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function HeroSection() {
  const router = useRouter();
  const [userName, setUserName] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [roomCode, setRoomCode] = useState("");
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setUserName(parsed?.name ?? parsed?.email?.split("@")[0] ?? null);
        setUserId(parsed?.id ?? null);
      } catch {
        // ignore
      }
    }
  }, []);

  async function handleCreate() {
    setError("");
    if (!userId) {
      setError("You must be logged in to create a room.");
      return;
    }
    setCreating(true);
    try {
      const res = await fetch("/api/rooms/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hostId: userId }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error || "Failed to create room.");
        return;
      }
      router.push(`/contest/${data.roomCode}`);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setCreating(false);
    }
  }

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!roomCode.trim()) {
      setError("Please enter a room code.");
      return;
    }
    if (!userId) {
      setError("You must be logged in to join a room.");
      return;
    }
    setJoining(true);
    try {
      const res = await fetch("/api/rooms/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomCode: roomCode.trim().toUpperCase(),
          userId,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error || "Failed to join room.");
        return;
      }
      router.push(`/contest/${data.roomCode}`);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setJoining(false);
    }
  }

  return (
    <section className="relative max-w-7xl mx-auto px-6 pt-24 pb-20 grid lg:grid-cols-2 gap-12 items-center">
      <div className="absolute top-0 left-0 w-125 h-125 bg-purple-600/10 blur-[120px] rounded-full -z-10" />

      <div className="z-10">
        {userName && (
          <p className="text-gray-400 text-sm mb-4 tracking-widest uppercase">
            👋 Welcome back,{" "}
            <span className="text-[#7c5cff] font-semibold">{userName}</span>
          </p>
        )}

        <h1 className="text-6xl md:text-7xl font-bold tracking-tighter mb-12 leading-[0.9]">
          Code. <span className="text-purple-500">Compete.</span> <br />
          Improve.
        </h1>

        <p className="text-gray-400 text-lg md:text-xl mb-10 max-w-lg leading-relaxed">
          The premium arena for elite developers. Create private contests, solve
          complex algorithms, and climb the leaderboard in real-time.
        </p>

        <div className="flex flex-wrap gap-4 mb-4">
          <Button
            size="lg"
            onClick={handleCreate}
            disabled={creating}
            className="bg-[#7c5cff] cursor-pointer hover:bg-[#6a4ce0] hover:shadow-[0_0_25px_rgba(124,92,255,0.5)] text-white rounded-xl px-8 h-14 text-base font-bold gap-2 transition-all"
          >
            <Plus size={20} />
            {creating ? "Creating..." : "Create Arena"}
          </Button>

          <form onSubmit={handleJoin} className="flex gap-2">
            <input
              type="text"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
              placeholder="Room code"
              maxLength={8}
              className="h-14 px-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-gray-600 focus:outline-none focus:border-[#7c5cff] text-sm font-mono uppercase tracking-widest w-36"
            />
            <Button
              size="lg"
              type="submit"
              disabled={joining}
              variant="outline"
              className="border-[#7c5cff] text-[#7c5cff] cursor-pointer hover:bg-[#7c5cff] hover:text-white rounded-xl px-6 h-14 text-base font-bold gap-2 transition-all bg-transparent"
            >
              <LogIn size={20} />
              {joining ? "Joining..." : "Join Arena"}
            </Button>
          </form>
        </div>

        {error && (
          <p className="text-sm text-red-400 mt-2" role="alert">
            {error}
          </p>
        )}

        <div className="mt-12 flex items-center gap-6 text-xs text-gray-500 font-mono">
          <span className="flex gap-3">
            <span className="opacity-50">&lt;&gt;</span> C++ / Python / Java /
            Go
          </span>
        </div>
      </div>

      <div className="relative z-10 lg:ml-auto w-full max-w-150">
        <div className="absolute -inset-4 bg-linear-to-tr from-purple-600/20 to-blue-500/20 rounded-3xl blur-2xl opacity-50" />
        <div className="relative rounded-2xl border border-white/10 overflow-hidden shadow-2xl">
          <Image
            src="/Visual_Assets/code_preview.png"
            alt="Code Editor Preview"
            width={600}
            height={400}
            priority
            className="w-full pt-14 h-auto object-cover"
          />
        </div>
      </div>
    </section>
  );
}
