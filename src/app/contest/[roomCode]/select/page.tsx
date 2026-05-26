"use client";

import { useMemo, useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import toast from "react-hot-toast";

type ApiQuestion = {
  title?: string;
  titleSlug?: string;
  difficulty?: string;
  tags?: string[];
};

const DIFFICULTY_COLORS = {
  EASY: "bg-emerald-500/20 text-emerald-400 border-emerald-500/50",
  MEDIUM: "bg-yellow-500/20 text-yellow-400 border-yellow-500/50",
  HARD: "bg-red-500/20 text-red-400 border-red-500/50",
};

const TOPIC_OPTIONS = [
  { value: "array", label: "Array" },
  { value: "string", label: "String" },
  { value: "hash-table", label: "Hash Table" },
  { value: "dynamic-programming", label: "Dynamic Programming" },
  { value: "math", label: "Math" },
  { value: "sorting", label: "Sorting" },
  { value: "greedy", label: "Greedy" },
  { value: "depth-first-search", label: "Depth-First Search" },
  { value: "breadth-first-search", label: "Breadth-First Search" },
  { value: "binary-search", label: "Binary Search" },
  { value: "graph", label: "Graph" },
  { value: "tree", label: "Tree" },
  { value: "binary-tree", label: "Binary Tree" },
  { value: "matrix", label: "Matrix" },
  { value: "linked-list", label: "Linked List" },
  { value: "stack", label: "Stack" },
  { value: "queue", label: "Queue" },
  { value: "heap", label: "Heap" },
  { value: "trie", label: "Trie" },
  { value: "bit-manipulation", label: "Bit Manipulation" },
];

export default function SelectQuestionPage() {
  const params = useParams<{ roomCode: string }>();
  const router = useRouter();
  const roomCode = params.roomCode;

  const [difficulty, setDifficulty] = useState("");
  const [topic, setTopic] = useState("array");
  const [limit, setLimit] = useState(10);
  const [skip, setSkip] = useState(0);
  const [questions, setQuestions] = useState<ApiQuestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedQuestions, setSelectedQuestions] = useState<ApiQuestion[]>([]);
  const MAX_QUESTIONS = 3;

  // Auto-fetch questions on page load
  useEffect(() => {
    const loadInitialQuestions = async () => {
      setLoading(true);
      try {
        const sp = new URLSearchParams({
          limit: "10",
          skip: "0",
          tags: "array",
        });

        const res = await fetch(`/api/questions?${sp.toString()}`);
        const data = (await res.json()) as { questions?: ApiQuestion[] };

        const questionsList = Array.isArray(data.questions)
          ? data.questions
          : [];
        setQuestions(questionsList);

        if (questionsList.length > 0) {
          toast.success(`Loaded ${questionsList.length} questions`);
        }
      } catch (error) {
        console.error("Initial load error:", error);
      } finally {
        setLoading(false);
      }
    };

    loadInitialQuestions();
  }, []);

  const queryPreview = useMemo(() => {
    const sp = new URLSearchParams({
      limit: String(limit),
      skip: String(skip),
    });
    if (difficulty) sp.set("difficulty", difficulty);
    if (topic) sp.set("tags", topic);
    return `/api/questions?${sp.toString()}`;
  }, [difficulty, topic, limit, skip]);

  async function fetchQuestions() {
    setLoading(true);
    try {
      const sp = new URLSearchParams({
        limit: String(limit),
        skip: String(skip),
      });
      if (difficulty) sp.set("difficulty", difficulty);
      if (topic) sp.set("tags", topic);

      console.log("📍 Frontend - Fetching with params:", sp.toString());

      const res = await fetch(`/api/questions?${sp.toString()}`);
      const data = (await res.json()) as {
        questions?: ApiQuestion[];
        error?: string;
      };

      console.log("📥 Frontend - Response from backend:", data);

      if (!res.ok) {
        throw new Error(data.error || "Failed to fetch questions");
      }

      const questionsList = Array.isArray(data.questions) ? data.questions : [];
      setQuestions(questionsList);

      console.log("✅ Frontend - Extracted questions:", questionsList.length);

      if (questionsList.length === 0) {
        // Try fetching without filters if we got empty results
        if (topic || difficulty) {
          console.warn("⚠️ No results with filters, trying without filters...");
          const fallbackRes = await fetch(
            `/api/questions?limit=${limit}&skip=${skip}`,
          );
          const fallbackData = (await fallbackRes.json()) as {
            questions?: ApiQuestion[];
          };
          const fallbackList = Array.isArray(fallbackData.questions)
            ? fallbackData.questions
            : [];

          if (fallbackList.length > 0) {
            setQuestions(fallbackList);
            toast.success(
              `Fetched ${fallbackList.length} questions (no filters applied)`,
            );
            return;
          }
        }

        toast.success(
          "No questions found. The problem database may be temporarily unavailable.",
        );
      } else {
        toast.success(`Fetched ${questionsList.length} questions`);
      }
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : "Failed to fetch questions";
      toast.error(errorMsg);
      console.error("Fetch error:", error);
      setQuestions([]);
    } finally {
      setLoading(false);
    }
  }

  function toggleSelectQuestion(q: ApiQuestion) {
    if (!q.titleSlug) {
      toast.error("Invalid question selection");
      return;
    }

    const isSelected = selectedQuestions.some(
      (sq) => sq.titleSlug === q.titleSlug,
    );

    if (isSelected) {
      setSelectedQuestions(
        selectedQuestions.filter((sq) => sq.titleSlug !== q.titleSlug),
      );
      toast.success("Question removed from selection");
    } else {
      if (selectedQuestions.length >= MAX_QUESTIONS) {
        toast.error(`You can only select ${MAX_QUESTIONS} questions`);
        return;
      }

      setSelectedQuestions([...selectedQuestions, q]);
      toast.success(
        `Question selected (${selectedQuestions.length + 1}/${MAX_QUESTIONS})`,
      );
    }
  }

  async function submitSelectedQuestions() {
    if (selectedQuestions.length === 0) {
      toast.error("Please select at least one question");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`/api/rooms/${roomCode}/questions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questions: selectedQuestions.map((q) => ({
            title: q.title,
            titleSlug: q.titleSlug,
            difficulty: q.difficulty,
            topic: topic || "general",
          })),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save questions to room");
      }

      toast.success(
        `${selectedQuestions.length} question${selectedQuestions.length > 1 ? "s" : ""} selected! Redirecting to contest...`,
      );
      router.push(`/contest/${roomCode}/play`);
    } catch (error) {
      toast.error("Failed to select questions");
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-linear-to-br from-black via-slate-900 to-purple-950 text-white p-8">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">
            Select Questions for Contest
          </h1>
          <p className="text-slate-400">
            Room: <span className="text-purple-400 font-mono">{roomCode}</span>
          </p>
          <p className="text-sm mt-2 text-purple-300 font-semibold">
            Selected: {selectedQuestions.length}/{MAX_QUESTIONS}
          </p>
        </div>

        {/* Filter Section */}
        <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-6 mb-8 backdrop-blur-sm">
          <h2 className="text-lg font-semibold mb-4 text-purple-300">
            Filter Questions
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            <div className="flex flex-col">
              <label className="text-sm text-slate-400 mb-2">Difficulty</label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                className="bg-slate-700/50 border border-slate-600 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">All Difficulty</option>
                <option value="EASY">Easy</option>
                <option value="MEDIUM">Medium</option>
                <option value="HARD">Hard</option>
              </select>
            </div>

            <div className="flex flex-col">
              <label className="text-sm text-slate-400 mb-2">Topic</label>
              <select
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="bg-slate-700/50 border border-slate-600 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">All Topics</option>
                {TOPIC_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col">
              <label className="text-sm text-slate-400 mb-2">Limit</label>
              <input
                type="number"
                min="1"
                max="100"
                value={limit}
                onChange={(e) =>
                  setLimit(Math.max(1, Number(e.target.value) || 10))
                }
                className="bg-slate-700/50 border border-slate-600 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div className="flex flex-col">
              <label className="text-sm text-slate-400 mb-2">Skip</label>
              <input
                type="number"
                min="0"
                value={skip}
                onChange={(e) =>
                  setSkip(Math.max(0, Number(e.target.value) || 0))
                }
                className="bg-slate-700/50 border border-slate-600 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div className="flex flex-col justify-end">
              <button
                onClick={fetchQuestions}
                disabled={loading}
                className="px-6 py-2 bg-linear-to-r from-purple-600 to-indigo-600 hover:opacity-90 disabled:opacity-50 transition rounded-lg font-semibold shadow-lg"
              >
                {loading ? "Fetching..." : "Search"}
              </button>
            </div>
          </div>

          {questions.length > 0 && (
            <div className="mt-4 text-sm text-slate-400">
              <code className="bg-slate-900/50 p-2 rounded px-3">
                {queryPreview}
              </code>
            </div>
          )}
        </div>

        {/* Questions List */}
        {questions.length > 0 ? (
          <div className="grid gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-purple-300">
                {questions.length} Question{questions.length !== 1 ? "s" : ""}{" "}
                Found
              </h2>
            </div>

            {questions.map((q) => (
              <div
                key={q.titleSlug ?? q.title}
                className="bg-slate-800/40 border border-slate-700/50 hover:border-purple-500/50 rounded-xl p-5 backdrop-blur-sm transition-all hover:shadow-lg hover:shadow-purple-500/10"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white mb-2">
                      {q.title ?? "Untitled"}
                    </h3>

                    <div className="flex items-center gap-3 flex-wrap">
                      {q.difficulty && (
                        <span
                          className={`text-xs font-semibold px-3 py-1 rounded-full border ${
                            DIFFICULTY_COLORS[
                              q.difficulty as keyof typeof DIFFICULTY_COLORS
                            ] ||
                            "bg-slate-600/20 text-slate-400 border-slate-600/50"
                          }`}
                        >
                          {q.difficulty}
                        </span>
                      )}

                      {q.tags && q.tags.length > 0 && (
                        <div className="flex gap-2 flex-wrap">
                          {q.tags.slice(0, 3).map((tag) => (
                            <span
                              key={tag}
                              className="text-xs bg-slate-700/50 text-slate-300 px-2 py-1 rounded border border-slate-600/50"
                            >
                              {tag}
                            </span>
                          ))}
                          {q.tags.length > 3 && (
                            <span className="text-xs text-slate-400">
                              +{q.tags.length - 3} more
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => toggleSelectQuestion(q)}
                    disabled={
                      submitting ||
                      (selectedQuestions.length >= MAX_QUESTIONS &&
                        !selectedQuestions.some(
                          (sq) => sq.titleSlug === q.titleSlug,
                        ))
                    }
                    className={`px-6 py-2 rounded-lg font-semibold whitespace-nowrap shadow-lg transition ${
                      selectedQuestions.some(
                        (sq) => sq.titleSlug === q.titleSlug,
                      )
                        ? "bg-linear-to-r from-purple-600 to-indigo-600 hover:opacity-90"
                        : "bg-linear-to-r from-green-600 to-emerald-600 hover:opacity-90 disabled:opacity-50"
                    }`}
                  >
                    {selectedQuestions.some(
                      (sq) => sq.titleSlug === q.titleSlug,
                    )
                      ? "✓ Selected"
                      : "Select"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-slate-400 text-lg">
              {loading
                ? "Fetching questions..."
                : "No questions found. Try adjusting filters or click Search."}
            </p>
          </div>
        )}

        {/* Selected Questions Summary and Submit Button */}
        {selectedQuestions.length > 0 && (
          <div className="mt-12 fixed bottom-8 right-8 bg-slate-900 border border-purple-500/50 rounded-xl p-6 max-w-sm shadow-2xl">
            <h3 className="text-lg font-semibold text-purple-300 mb-3">
              Selected Questions ({selectedQuestions.length}/{MAX_QUESTIONS})
            </h3>
            <div className="space-y-2 mb-4 max-h-48 overflow-y-auto">
              {selectedQuestions.map((q) => (
                <div
                  key={q.titleSlug}
                  className="text-sm text-slate-300 flex items-center justify-between bg-slate-800/50 p-2 rounded"
                >
                  <span className="truncate mr-2">{q.title ?? "Untitled"}</span>
                  <button
                    onClick={() => toggleSelectQuestion(q)}
                    className="text-red-400 hover:text-red-300 font-bold shrink-0"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
            <button
              onClick={submitSelectedQuestions}
              disabled={submitting}
              className="w-full px-6 py-3 bg-linear-to-r from-purple-600 to-indigo-600 hover:opacity-90 disabled:opacity-50 transition rounded-lg font-bold shadow-lg"
            >
              {submitting
                ? "Starting..."
                : `Start Contest (${selectedQuestions.length} Q)`}
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
