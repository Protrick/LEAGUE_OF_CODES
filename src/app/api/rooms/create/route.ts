import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { hostId } = body as { hostId?: string };

    if (!hostId) {
      return NextResponse.json(
        { error: "hostId is required" },
        { status: 400 },
      );
    }

    const host = await prisma.user.findUnique({ where: { id: hostId } });
    if (!host) {
      return NextResponse.json(
        { error: "Host user not found" },
        { status: 404 },
      );
    }

    const roomCode = nanoid(8).toUpperCase();

    const room = await prisma.room.create({
      data: {
        roomCode,
        hostId,
        participants: { connect: { id: hostId } },
        status: "waiting",
      },
      include: {
        host: { select: { id: true, email: true, name: true } },
        participants: { select: { id: true, email: true, name: true } },
      },
    });

    // notify via socket if available
    // @ts-ignore
    if (global.io) {
      // @ts-ignore
      global.io.to(room.roomCode).emit("update_participants", {
        roomCode: room.roomCode,
        participants: room.participants,
      });
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
      roomCode: room.roomCode,
      shareableLink: `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/contest/${room.roomCode}`,
    });
  } catch (error) {
    console.error("Create room error:", error);
    return NextResponse.json(
      { error: "Failed to create room" },
      { status: 500 },
    );
  }
}
