"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function JoinRoom() {
  const [roomCode, setRoomCode] = useState("");
  const [userId, setUserId] = useState("");
  const [result, setResult] = useState("");
  const router = useRouter();

  async function onJoin() {
    setResult("");
    const res = await fetch("/api/rooms/join", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roomCode, userId }),
    });
    const data = (await res.json()) as { success?: boolean; error?: string };
    setResult(data.success ? "Joined room" : data.error ?? "Failed");
    if (data.success) {
      router.push(`/contest/${roomCode.trim().toUpperCase()}`);
    }
  }

  return (
    <div className="rounded border p-4">
      <h3 className="mb-2 font-semibold">Join Room</h3>
      <input
        className="mb-2 w-full rounded border p-2"
        placeholder="Room code"
        value={roomCode}
        onChange={(e) => setRoomCode(e.target.value)}
      />
      <input
        className="w-full rounded border p-2"
        placeholder="User id"
        value={userId}
        onChange={(e) => setUserId(e.target.value)}
      />
      <button className="mt-3 rounded bg-black px-3 py-2 text-white" onClick={onJoin}>
        Join
      </button>
      {result ? <p className="mt-2 text-sm">{result}</p> : null}
    </div>
  );
}
