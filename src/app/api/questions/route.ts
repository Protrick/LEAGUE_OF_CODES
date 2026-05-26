import { NextResponse } from "next/server";

const BASE_URL = "https://alfa-leetcode-api.onrender.com";
const VALID_DIFFICULTIES = new Set(["EASY", "MEDIUM", "HARD"]);

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const limit = searchParams.get("limit") ?? "10";
    const skip = searchParams.get("skip") ?? "0";
    const tags = searchParams.get("tags") ?? "";
    const difficultyParam = searchParams.get("difficulty") ?? "";
    const difficulty = difficultyParam.toUpperCase();

    let upstreamUrl: string;

    // Build the URL based on what filters are provided
    if (difficulty && tags.trim()) {
      // Both difficulty and tags
      upstreamUrl = `${BASE_URL}/problems?limit=${limit}&skip=${skip}&difficulty=${difficulty}&tags=${tags.trim()}`;
    } else if (difficulty) {
      // Only difficulty
      upstreamUrl = `${BASE_URL}/problems?limit=${limit}&skip=${skip}&difficulty=${difficulty}`;
    } else if (tags.trim()) {
      // Only tags
      upstreamUrl = `${BASE_URL}/problems?limit=${limit}&skip=${skip}&tags=${tags.trim()}`;
    } else {
      // No filters - fetch all
      upstreamUrl = `${BASE_URL}/problems?limit=${limit}&skip=${skip}`;
    }

    console.log("🔗 Fetching from upstream API:", upstreamUrl);

    const response = await fetch(upstreamUrl, {
      cache: "no-store",
      headers: {
        Accept: "application/json",
      },
    });

    console.log("📊 API Response status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ API Error:", response.status, errorText);
      return NextResponse.json(
        { error: `Failed to fetch from LeetCode API: ${response.status}` },
        { status: 502 },
      );
    }

    const data = await response.json();
    console.log("📦 Raw API response:", JSON.stringify(data).substring(0, 200));

    // The API returns either an array directly or an object with questions/data property
    let questions = [];
    if (Array.isArray(data)) {
      questions = data;
    } else if (data.questions && Array.isArray(data.questions)) {
      questions = data.questions;
    } else if (data.data && Array.isArray(data.data)) {
      questions = data.data;
    } else if (
      data.problemsetQuestionList &&
      Array.isArray(data.problemsetQuestionList)
    ) {
      questions = data.problemsetQuestionList;
    }

    console.log("✅ Questions extracted:", questions.length);

    // If no questions found and API responded OK, provide fallback mock data
    if (questions.length === 0) {
      console.warn(
        "⚠️ API returned empty results. Using fallback mock data for demo purposes.",
      );
      questions = [
        {
          title: "Two Sum",
          titleSlug: "two-sum",
          difficulty: "Easy",
          tags: ["array", "hash-table"],
        },
        {
          title: "Best Time to Buy and Sell Stock",
          titleSlug: "best-time-to-buy-and-sell-stock",
          difficulty: "Easy",
          tags: ["array", "dynamic-programming"],
        },
        {
          title: "Contains Duplicate",
          titleSlug: "contains-duplicate",
          difficulty: "Easy",
          tags: ["array", "hash-table"],
        },
        {
          title: "Valid Anagram",
          titleSlug: "valid-anagram",
          difficulty: "Easy",
          tags: ["hash-table", "string", "sorting"],
        },
        {
          title: "Group Anagrams",
          titleSlug: "group-anagrams",
          difficulty: "Medium",
          tags: ["array", "hash-table", "string"],
        },
      ];
    }

    return NextResponse.json({ questions });
  } catch (error) {
    console.error("Questions fetch error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Internal server error while fetching questions",
      },
      { status: 500 },
    );
  }
}
