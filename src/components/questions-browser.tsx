"use client";

import { useMemo, useState } from "react";

type ApiQuestion = {
  title?: string;
  titleSlug?: string;
  difficulty?: string;
  topicTags?: Array<{ name?: string; slug?: string }>;
};

type QuestionItem = {
  title: string;
  slug: string;
  difficulty: string;
  tags: string[];
};

const DEFAULT_LIMIT = 10;

function normalizeQuestions(input: unknown): QuestionItem[] {
  if (!Array.isArray(input)) return [];

  return input.map((q) => {
    const item = q as ApiQuestion;
    return {
      title: item.title ?? "Untitled",
      slug: item.titleSlug ?? "",
      difficulty: item.difficulty ?? "UNKNOWN",
      tags:
        item.topicTags?.map((tag) => tag.slug ?? tag.name ?? "").filter(Boolean) ??
        [],
    };
  });
}

export default function QuestionsBrowser() {
  const [difficulty, setDifficulty] = useState("");
  const [tags, setTags] = useState("");
  const [limit, setLimit] = useState(DEFAULT_LIMIT);
  const [skip, setSkip] = useState(0);
  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const queryPreview = useMemo(() => {
    const params = new URLSearchParams({
      limit: String(limit),
      skip: String(skip),
    });
    if (difficulty) params.set("difficulty", difficulty);
    if (tags.trim()) params.set("tags", tags.trim());
    return `/api/questions?${params.toString()}`;
  }, [difficulty, tags, limit, skip]);

  async function fetchQuestions() {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({
        limit: String(limit),
        skip: String(skip),
      });
      if (difficulty) params.set("difficulty", difficulty);
      if (tags.trim()) params.set("tags", tags.trim());

      const response = await fetch(`/api/questions?${params.toString()}`);
      const data = (await response.json()) as { questions?: unknown; error?: string };

      if (!response.ok) {
        throw new Error(data.error ?? "Failed to fetch questions");
      }

      setQuestions(normalizeQuestions(data.questions));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="w-full max-w-4xl rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <h2 className="mb-4 text-xl font-semibold">Question Fetcher</h2>

      <div className="grid gap-3 md:grid-cols-4">
        <select
          value={difficulty}
          onChange={(e) => setDifficulty(e.target.value)}
          className="rounded-md border p-2 dark:bg-zinc-900"
        >
          <option value="">All Difficulty</option>
          <option value="EASY">EASY</option>
          <option value="MEDIUM">MEDIUM</option>
          <option value="HARD">HARD</option>
        </select>

        <input
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="tags: array,graph"
          className="rounded-md border p-2 dark:bg-zinc-900"
        />

        <input
          type="number"
          min={1}
          max={50}
          value={limit}
          onChange={(e) => setLimit(Number(e.target.value) || DEFAULT_LIMIT)}
          className="rounded-md border p-2 dark:bg-zinc-900"
        />

        <input
          type="number"
          min={0}
          value={skip}
          onChange={(e) => setSkip(Number(e.target.value) || 0)}
          className="rounded-md border p-2 dark:bg-zinc-900"
        />
      </div>

      <div className="mt-4 flex items-center gap-3">
        <button
          onClick={fetchQuestions}
          disabled={loading}
          className="rounded-md bg-black px-4 py-2 text-white disabled:opacity-60 dark:bg-white dark:text-black"
        >
          {loading ? "Fetching..." : "Fetch Questions"}
        </button>
        <code className="text-xs text-zinc-500">{queryPreview}</code>
      </div>

      {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}

      <ul className="mt-6 space-y-3">
        {questions.map((q) => (
          <li key={q.slug || q.title} className="rounded-md border p-3">
            <p className="font-medium">{q.title}</p>
            <p className="text-sm text-zinc-500">{q.difficulty}</p>
            <p className="text-xs text-zinc-500">{q.tags.join(", ") || "no-tags"}</p>
            {q.slug ? (
              <a
                className="text-sm text-blue-600 hover:underline"
                target="_blank"
                rel="noreferrer"
                href={`https://leetcode.com/problems/${q.slug}/`}
              >
                Open Problem
              </a>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
