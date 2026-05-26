import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { roomCode, userId } = body as { roomCode?: string; userId?: string };

    if (!roomCode || !userId) {
      return NextResponse.json(
        { error: "roomCode and userId are required" },
        { status: 400 },
      );
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const room = await prisma.room.findUnique({
      where: { roomCode: roomCode.toUpperCase() },
      include: {
        participants: { select: { id: true, email: true, name: true } },
      },
    });

    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    if (room.status === "ended") {
      return NextResponse.json(
        { error: "Room has already ended" },
        { status: 400 },
      );
    }

    // already in room — just return it
    const isParticipant = room.participants.some((p) => p.id === userId);
    if (isParticipant) {
      return NextResponse.json({
        roomCode: room.roomCode,
        room: {
          id: room.id,
          roomCode: room.roomCode,
          hostId: room.hostId,
          status: room.status,
          participants: room.participants,
        },
      });
    }

    const updatedRoom = await prisma.room.update({
      where: { id: room.id },
      data: { participants: { connect: { id: userId } } },
      include: {
        participants: { select: { id: true, email: true, name: true } },
      },
    });

    // @ts-ignore
    if (global.io) {
      // @ts-ignore
      global.io.to(room.roomCode).emit("update_participants", {
        roomCode: room.roomCode,
        participants: updatedRoom.participants,
      });
    }

    return NextResponse.json({
      roomCode: updatedRoom.roomCode,
      room: {
        id: updatedRoom.id,
        roomCode: updatedRoom.roomCode,
        hostId: updatedRoom.hostId,
        status: updatedRoom.status,
        participants: updatedRoom.participants,
      },
    });
  } catch (error) {
    console.error("Join room error:", error);
    return NextResponse.json({ error: "Failed to join room" }, { status: 500 });
  }
}
