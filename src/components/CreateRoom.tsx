"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface CreateRoomProps {
  userId: string;
}

export default function CreateRoom({ userId }: CreateRoomProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleCreateRoom = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/rooms/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ hostId: userId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create room");
      }

      // Redirect to contest page
      router.push(`/contest/${data.room.roomCode}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create room");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4 p-6 border rounded-lg">
      <h2 className="text-2xl font-bold">Create a Room</h2>
      {error && (
        <div className="text-red-500 text-sm">{error}</div>
      )}
      <button
        onClick={handleCreateRoom}
        disabled={loading}
        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? "Creating..." : "Create Room"}
      </button>
    </div>
  );
}
