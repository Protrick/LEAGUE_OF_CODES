import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type RequestBody = {
  questions: Array<{
    title: string;
    titleSlug: string;
    difficulty?: string;
    topic?: string;
  }>;
};

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ roomCode: string }> },
) {
  try {
    const { roomCode } = await params;
    const body: RequestBody = await req.json();

    console.log(
      `📝 [POST /questions] roomCode=${roomCode}, questionCount=${body.questions?.length}`,
    );

    if (!body.questions || body.questions.length === 0) {
      console.warn(`⚠️ [POST /questions] No questions provided`);
      return NextResponse.json(
        { error: "At least one question is required" },
        { status: 400 },
      );
    }

    if (body.questions.length > 3) {
      console.warn(
        `⚠️ [POST /questions] Too many questions (${body.questions.length})`,
      );
      return NextResponse.json(
        { error: "Maximum 3 questions allowed" },
        { status: 400 },
      );
    }

    // Persist all selected questions. Store as JSON strings in the existing
    // selected* fields to avoid a schema migration. The GET handler will
    // detect and parse these JSON arrays.
    const titles = body.questions.map((q) => q.title ?? null);
    const slugs = body.questions.map((q) => q.titleSlug ?? null);
    const difficulties = body.questions.map((q) => q.difficulty ?? null);
    const topics = body.questions.map((q) => q.topic ?? null);

    console.log(
      `📌 [POST /questions] Saving ${slugs.length} selected questions:`,
      slugs,
    );

    const updatedRoom = await prisma.room.update({
      where: { roomCode },
      data: {
        selectedTitle: JSON.stringify(titles),
        selectedTitleSlug: JSON.stringify(slugs),
        selectedDifficulty: JSON.stringify(difficulties),
        selectedTopic: JSON.stringify(topics),
        status: "active",
      },
    });

    console.log(`✅ [POST /questions] Successfully saved to DB`);

    return NextResponse.json({
      success: true,
      room: updatedRoom,
      questionsCount: body.questions.length,
    });
  } catch (error) {
    console.error("❌ [POST /questions] Error:", error);
    return NextResponse.json(
      { error: "Failed to save questions to room" },
      { status: 500 },
    );
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ roomCode: string }> },
) {
  try {
    const { roomCode } = await params;

    console.log(`🔍 [GET /questions] Fetching questions for room: ${roomCode}`);

    const room = await prisma.room.findUnique({
      where: { roomCode },
      select: {
        selectedTitle: true,
        selectedTitleSlug: true,
        selectedDifficulty: true,
        selectedTopic: true,
        status: true,
      },
    });

    if (!room) {
      console.warn(`⚠️ [GET /questions] Room not found: ${roomCode}`);
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    if (!room.selectedTitleSlug) {
      console.warn(
        `⚠️ [GET /questions] No titleSlug found for room: ${roomCode}`,
      );
      return NextResponse.json(
        { error: "No questions selected yet" },
        { status: 404 },
      );
    }

    // If stored value is JSON (we save arrays as JSON), parse and return an
    // array of selected questions. Otherwise, return the legacy single
    // question shape for backwards compatibility.
    try {
      const parsedSlugs = JSON.parse(room.selectedTitleSlug as string);
      const parsedTitles = JSON.parse(room.selectedTitle as string);
      const parsedDifficulties = JSON.parse(
        (room.selectedDifficulty as string) || "[]",
      );
      const parsedTopics = JSON.parse((room.selectedTopic as string) || "[]");

      if (Array.isArray(parsedSlugs)) {
        const questions = parsedSlugs.map((slug: string, i: number) => ({
          title: parsedTitles?.[i] ?? null,
          titleSlug: slug,
          difficulty: parsedDifficulties?.[i] ?? null,
          topic: parsedTopics?.[i] ?? null,
        }));

        console.log(
          `✅ [GET /questions] Returning ${questions.length} saved question(s)`,
        );
        return NextResponse.json({ questions, status: room.status });
      }
    } catch (err) {
      // not JSON — fall through to legacy response
    }

    console.log(
      `✅ [GET /questions] Found titleSlug: ${room.selectedTitleSlug}`,
    );

    return NextResponse.json({
      title: room.selectedTitle,
      titleSlug: room.selectedTitleSlug,
      difficulty: room.selectedDifficulty,
      topic: room.selectedTopic,
      status: room.status,
    });
  } catch (error) {
    console.error("❌ [GET /questions] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch questions" },
      { status: 500 },
    );
  }
}
