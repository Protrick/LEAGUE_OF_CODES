import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ roomCode: string }> },
) {
  try {
    const { roomCode } = await params;
    const body = await request.json();

    const { title, titleSlug, difficulty, topic } = body;

    if (!titleSlug) {
      return NextResponse.json(
        { error: "titleSlug is required" },
        { status: 400 },
      );
    }

    // Update the room with selected question details
    const updatedRoom = await prisma.room.update({
      where: { roomCode },
      data: {
        selectedTitle: title || null,
        selectedTitleSlug: titleSlug,
        selectedDifficulty: difficulty || null,
        selectedTopic: topic || null,
        status: "active",
      },
    });

    return NextResponse.json(updatedRoom);
  } catch (error) {
    console.error("❌ Question selection error:", error);
    const errorMsg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Failed to save question to room: ${errorMsg}` },
      { status: 500 },
    );
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ roomCode: string }> },
) {
  try {
    const { roomCode } = await params;

    const room = await prisma.room.findUnique({
      where: { roomCode },
    });

    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    return NextResponse.json({
      title: room.selectedTitle,
      titleSlug: room.selectedTitleSlug,
      difficulty: room.selectedDifficulty,
      topic: room.selectedTopic,
      status: room.status,
    });
  } catch (error) {
    console.error("Question retrieval error:", error);
    return NextResponse.json(
      { error: "Failed to retrieve question from room" },
      { status: 500 },
    );
  }
}
