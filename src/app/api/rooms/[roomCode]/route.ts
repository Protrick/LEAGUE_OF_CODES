import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ roomCode: string }> }
) {
  try {
    const { roomCode } = await params;

    const room = await prisma.room.findUnique({
      where: { roomCode: roomCode.toUpperCase() },
      include: {
        host: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
        participants: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });

    if (!room) {
      return NextResponse.json(
        { error: "Room not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      room: {
        id: room.id,
        roomCode: room.roomCode,
        hostId: room.hostId,
        host: room.host,
        status: room.status,
        participants: room.participants,
        createdAt: room.createdAt,
      },
    });
  } catch (error) {
    console.error("Get room error:", error);
    return NextResponse.json(
      { error: "Failed to fetch room" },
      { status: 500 }
    );
  }
}
