import { NextResponse } from "next/server";

const BASE_URL = "https://alfa-leetcode-api.onrender.com";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const titleSlug = searchParams.get("titleSlug");

    console.log(`📖 [GET /details] Fetching titleSlug: ${titleSlug}`);

    if (!titleSlug) {
      return NextResponse.json(
        { error: "titleSlug query parameter is required" },
        { status: 400 },
      );
    }

    // Fetch detailed question from LeetCode API
    const upstreamUrl = `${BASE_URL}/select?titleSlug=${encodeURIComponent(titleSlug)}`;
    console.log(`🔗 [GET /details] Calling upstream: ${upstreamUrl}`);

    const response = await fetch(upstreamUrl, { cache: "no-store" });

    if (!response.ok) {
      console.error(`❌ [GET /details] Upstream returned ${response.status}`);
      return NextResponse.json(
        { error: "Failed to fetch question details from upstream API" },
        { status: 502 },
      );
    }

    const data = await response.json();

    if (!data || (typeof data === "object" && Object.keys(data).length === 0)) {
      console.warn(
        `⚠️ [GET /details] Empty response from upstream for ${titleSlug}`,
      );
      // Return a mock/fallback response
      return NextResponse.json({
        title: titleSlug,
        titleSlug: titleSlug,
        difficulty: "MEDIUM",
        description:
          "Question details not available. The API is temporarily unavailable.",
        constraints: [],
        examples: [],
        codeSnippets: [
          {
            language: "cpp",
            code: "// Write your solution here\n\nint main() {\n  return 0;\n}",
          },
        ],
      });
    }

    console.log(`✅ [GET /details] Successfully fetched for ${titleSlug}`);
    return NextResponse.json(data);
  } catch (error) {
    console.error("❌ [GET /details] Error:", error);
    return NextResponse.json(
      { error: "Internal server error while fetching question details" },
      { status: 500 },
    );
  }
}
