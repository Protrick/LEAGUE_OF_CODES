"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CreateRoom() {
  const [hostId, setHostId] = useState("");
  const [result, setResult] = useState("");
  const router = useRouter();

  async function onCreate() {
    setResult("");
    const res = await fetch("/api/rooms/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hostId }),
    });
    const data = (await res.json()) as { shareableLink?: string; error?: string };
    setResult(data.shareableLink ?? data.error ?? "Done");
    if (data.shareableLink) {
      const code = data.shareableLink.split("/contest/")[1];
      if (code) router.push(`/contest/${code}`);
    }
  }

  return (
    <div className="rounded border p-4">
      <h3 className="mb-2 font-semibold">Create Room</h3>
      <input
        className="w-full rounded border p-2"
        placeholder="Host userId"
        value={hostId}
        onChange={(e) => setHostId(e.target.value)}
      />
      <button className="mt-3 rounded bg-black px-3 py-2 text-white" onClick={onCreate}>
        Create
      </button>
      {result ? <p className="mt-2 text-sm">{result}</p> : null}
    </div>
  );
}
