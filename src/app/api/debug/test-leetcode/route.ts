import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const BASE_URL = "https://alfa-leetcode-api.onrender.com";

    // Test different endpoints
    const endpoints = [
      `/problems?limit=5`,
      `/problems?limit=5&difficulty=EASY`,
      `/problems?limit=5&tags=array`,
      `/daily`,
    ];

    const results = [];

    for (const endpoint of endpoints) {
      try {
        const url = `${BASE_URL}${endpoint}`;
        console.log(`Testing: ${url}`);

        const res = await fetch(url, { cache: "no-store" });
        const data = await res.json();

        results.push({
          endpoint,
          status: res.status,
          dataType: typeof data,
          isArray: Array.isArray(data),
          length: Array.isArray(data) ? data.length : Object.keys(data).length,
          sample: Array.isArray(data) ? data[0] : Object.keys(data).slice(0, 3),
        });
      } catch (error) {
        results.push({
          endpoint,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    return NextResponse.json({ results });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
