"use client";

import { useState } from "react";
import CreateRoom from "@/components/CreateRoom";
import JoinRoom from "@/components/JoinRoom";

export default function RoomsPage() {
  // In a real app, get userId from auth context/session
  // For demo purposes, using a placeholder
  const [userId] = useState("demo-user-id");

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8 text-center">Rooms</h1>
      <div className="grid md:grid-cols-2 gap-6">
        <CreateRoom userId={userId} />
        <JoinRoom userId={userId} />
      </div>
      <div className="mt-6 text-sm text-gray-500 text-center">
        <p>Note: In production, userId should come from authentication.</p>
        <p>For now, using a demo userId. Make sure to create a user first via /api/auth/register</p>
      </div>
    </div>
  );
}
