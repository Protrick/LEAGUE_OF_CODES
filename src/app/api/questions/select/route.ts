import { NextResponse } from "next/server";

const BASE_URL = "https://alfa-leetcode-api.onrender.com";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const titleSlug = searchParams.get("titleSlug");

    if (!titleSlug) {
      return NextResponse.json(
        { error: "titleSlug query parameter is required" },
        { status: 400 },
      );
    }

    console.log("🔗 Fetching question details for:", titleSlug);

    const response = await fetch(
      `${BASE_URL}/select?titleSlug=${encodeURIComponent(titleSlug)}`,
      {
        cache: "no-store",
        headers: {
          Accept: "application/json",
        },
      },
    );

    console.log("📊 Question Details API Response status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ API Error:", response.status, errorText);
      return NextResponse.json(
        { error: `Failed to fetch question details: ${response.status}` },
        { status: 502 },
      );
    }

    const data = await response.json();
    console.log(
      "📦 Question details fetched:",
      data.stat?.question__title ?? titleSlug,
    );
    console.log("🔍 Full API response structure:", {
      hasContent: !!data.content,
      hasDescription: !!data.description,
      hasStat: !!data.stat,
      statKeys: Object.keys(data.stat || {}),
      hasExampleTestcases: !!data.exampleTestcases,
      topLevelKeys: Object.keys(data).slice(0, 10),
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error("Question select fetch error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Internal server error while fetching question details",
      },
      { status: 500 },
    );
  }
}
