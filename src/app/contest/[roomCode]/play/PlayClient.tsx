"use client";

import React, { useState, useEffect } from "react";
import Editor from "@monaco-editor/react";

const LANGUAGES = [
  { label: "C++", value: "cpp" },
  { label: "Python", value: "python" },
  { label: "JavaScript", value: "javascript" },
  { label: "Java", value: "java" },
  { label: "Go", value: "go" },
];

// Map detailed API response to normalized structure
function normalizeDetailedQuestion(data: any, basicQuestion: any) {
  // Helper: recursively search for a long HTML/text block
  function findLongString(obj: any, minLen = 80): string | null {
    if (!obj) return null;
    if (typeof obj === "string") return obj.length >= minLen ? obj : null;
    if (Array.isArray(obj)) {
      for (const item of obj) {
        const found = findLongString(item, minLen);
        if (found) return found;
      }
      return null;
    }
    if (typeof obj === "object") {
      for (const k of Object.keys(obj)) {
        const found = findLongString(obj[k], minLen);
        if (found) return found;
      }
    }
    return null;
  }

  // Title candidates
  const title =
    data?.stat?.question__title ||
    data?.question?.title ||
    data?.data?.question?.title ||
    data?.title ||
    basicQuestion?.title ||
    "Untitled";

  // Difficulty candidates
  const difficulty =
    data?.difficulty?.level ||
    data?.difficulty ||
    data?.stat?.level ||
    basicQuestion?.difficulty ||
    "Unknown";

  // Description/content candidates (try multiple nested paths)
  const descriptionCandidates = [
    data?.content,
    data?.data?.content,
    data?.question?.content,
    data?.question?.translatedContent,
    data?.description,
    data?.questionContent,
    data?.data?.question?.content,
    data?.body,
  ];

  let description =
    descriptionCandidates.find((v) => !!v && typeof v === "string") || "";
  if (!description) {
    // try to find any long string in the payload
    description = findLongString(data) || "";
  }

  // Examples/testcases
  const exampleTestcases =
    data?.exampleTestcases ||
    data?.data?.exampleTestcases ||
    data?.question?.exampleTestcases ||
    (Array.isArray(data?.examples) ? data.examples.join("\n\n") : "") ||
    "";

  // Constraints
  const constraints =
    data?.stat?.constraintStatement ||
    data?.constraints ||
    data?.constraintStatement ||
    "";

  console.log("✅ Normalized:", {
    title,
    difficulty,
    hasDescription: !!description,
    hasExamples: !!exampleTestcases,
    hasConstraints: !!constraints,
  });

  return {
    title,
    difficulty,
    description,
    exampleTestcases,
    constraints,
    bodyHtml: description,
  };
}

export default function PlayClient() {
  const [language, setLanguage] = useState("cpp");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [detailedQuestion, setDetailedQuestion] = useState<any>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [leftPanelWidth, setLeftPanelWidth] = useState(38); // percentage

  // Fetch list of questions
  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        setLoading(true);
        const res = await fetch("/api/questions?limit=20");
        const json = await res.json();
        if (!mounted) return;
        if (!res.ok) {
          setError(json?.error || "Failed to fetch questions");
          setQuestions([]);
        } else {
          const qs = json?.questions ?? [];
          setQuestions(qs);
          setSelectedIndex(qs.length > 0 ? 0 : -1);
        }
      } catch (err: any) {
        if (!mounted) return;
        setError(err?.message ?? String(err));
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, []);

  // Fetch detailed question when selected
  useEffect(() => {
    const selected = questions[selectedIndex];
    if (!selected || !selected.titleSlug) {
      setDetailedQuestion(null);
      return;
    }

    let mounted = true;
    async function loadDetails() {
      try {
        setLoadingDetails(true);
        const res = await fetch(
          `/api/questions/select?titleSlug=${encodeURIComponent(selected.titleSlug)}`,
        );
        const json = await res.json();
        if (!mounted) return;
        if (res.ok) {
          setDetailedQuestion(normalizeDetailedQuestion(json, selected));
        } else {
          console.error("Failed to fetch details:", json?.error);
          setDetailedQuestion(selected);
        }
      } catch (err: any) {
        if (mounted) {
          console.error("Error fetching details:", err);
          setDetailedQuestion(selected);
        }
      } finally {
        if (mounted) setLoadingDetails(false);
      }
    }
    loadDetails();
    return () => {
      mounted = false;
    };
  }, [selectedIndex, questions]);

  const selected = detailedQuestion ?? questions[selectedIndex] ?? null;

  // Debug: log selected question
  useEffect(() => {
    console.log("🎯 Selected question updated:", {
      hasTitle: !!selected?.title,
      hasDescription: !!selected?.description,
      title: selected?.title?.substring(0, 50),
    });
  }, [selected]);

  // Use pointer events for more reliable dragging (mouse + touch)
  const handlePointerDown = (e: React.PointerEvent) => {
    e.currentTarget.setPointerCapture?.(e.pointerId);
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = leftPanelWidth;
    const container = document.querySelector(
      ".main-layout",
    ) as HTMLElement | null;
    if (!container) return;

    const handlePointerMove = (moveEvent: PointerEvent) => {
      const delta = moveEvent.clientX - startX;
      const containerWidth = container.clientWidth || 1;
      const newWidth = startWidth + (delta / containerWidth) * 100;
      const clampedWidth = Math.max(20, Math.min(70, newWidth));
      setLeftPanelWidth(clampedWidth);
    };

    const handlePointerUp = (upEvent: PointerEvent) => {
      try {
        (e.currentTarget as Element).releasePointerCapture?.(e.pointerId);
      } catch (err) {
        // ignore
      }
      document.removeEventListener("pointermove", handlePointerMove);
      document.removeEventListener("pointerup", handlePointerUp);
    };

    document.addEventListener("pointermove", handlePointerMove);
    document.addEventListener("pointerup", handlePointerUp);
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#0a0a0c] text-indigo-100 font-sans">
      {/* ── NAVBAR ── */}
      <header className="flex items-center justify-between px-8 h-16 bg-[#0a0a0c] border-b border-white/5">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded bg-purple-600 flex items-center justify-center">
            <span className="text-white font-bold text-sm">{"</>"}</span>
          </div>
          <span className="font-bold text-xl tracking-tight text-white">
            AlgoAryna
          </span>
        </div>

        <div className="flex items-center gap-6 text-sm font-medium text-gray-400">
          <div className="px-4 py-1.5 rounded-lg bg-white/5 border border-white/10 italic">
            Room: <span className="text-purple-500 font-mono">#9921</span>
          </div>
          <div className="px-4 py-1.5 rounded-lg bg-white/5 border border-white/10 italic">
            <button className="hover:text-white transition-colors">
              Log Out
            </button>
          </div>
        </div>
      </header>

      {/* ── MAIN LAYOUT ── */}
      <div className="flex flex-1 overflow-hidden main-layout">
        {/* LEFT: Selected Question Details (CodeClash-style) */}
        <aside
          className="flex flex-col bg-[#0e0f12] border-r border-white/5 shadow-2xl relative"
          style={{ width: `${leftPanelWidth}%` }}
        >
          <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h2 className="text-white font-semibold">Description</h2>
              <div className="text-sm text-gray-400">
                {loading ? "Loading…" : `${questions.length}`}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button className="text-sm text-gray-400 hover:text-white">
                Description
              </button>
              <button className="text-sm text-gray-500">Submissions</button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            {selected ? (
              <div className="space-y-5">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-2xl font-bold text-white">{`${selectedIndex + 1}. ${selected.title ?? "Untitled"}`}</div>
                    <div className="mt-2 flex items-center gap-3">
                      <span className="text-xs font-semibold px-2 py-1 rounded bg-green-600/10 text-green-300 border border-green-600/20">
                        {(
                          selected.difficulty ??
                          selected.difficultyLevel ??
                          "Unknown"
                        ).toString()}
                      </span>
                      <span className="text-xs text-gray-400">Solved</span>
                    </div>
                  </div>
                </div>

                <div className="text-sm text-gray-300 leading-relaxed">
                  {selected.description ? (
                    <>
                      {selected.description.includes("<") ? (
                        <div
                          dangerouslySetInnerHTML={{
                            __html: selected.description,
                          }}
                          className="prose prose-invert max-w-none"
                        />
                      ) : (
                        <div className="whitespace-pre-wrap">
                          {selected.description}
                        </div>
                      )}
                    </>
                  ) : selected.bodyHtml ? (
                    <div
                      dangerouslySetInnerHTML={{ __html: selected.bodyHtml }}
                      className="prose prose-invert max-w-none"
                    />
                  ) : (
                    <div>
                      {selected.summary || "Problem description unavailable."}
                    </div>
                  )}
                </div>

                {/* Examples / Test Cases */}
                {selected.exampleTestcases && (
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-purple-400 uppercase">
                      Examples
                    </h4>
                    {selected.exampleTestcases.split(/\n\n+/).map(
                      (testcase: string, i: number) =>
                        testcase.trim() && (
                          <div
                            key={i}
                            className="p-4 rounded-lg bg-[#0b0b0d] border border-white/5"
                          >
                            <div className="text-xs text-gray-400 font-semibold mb-2">
                              Example {i + 1}:
                            </div>
                            <pre className="bg-[#060607] p-3 rounded text-sm text-gray-200 overflow-x-auto whitespace-pre-wrap break-words">
                              {testcase.trim()}
                            </pre>
                          </div>
                        ),
                    )}
                  </div>
                )}
                {selected.examples &&
                  Array.isArray(selected.examples) &&
                  !selected.exampleTestcases && (
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold text-purple-400 uppercase">
                        Examples
                      </h4>
                      {selected.examples.map((ex: any, i: number) => (
                        <div
                          key={i}
                          className="p-4 rounded-lg bg-[#0b0b0d] border border-white/5"
                        >
                          <div className="text-xs text-gray-400 font-semibold mb-2">
                            Example {i + 1}:
                          </div>
                          <pre className="bg-[#060607] p-3 rounded text-sm text-gray-200 overflow-x-auto">
                            {ex}
                          </pre>
                        </div>
                      ))}
                    </div>
                  )}

                {/* Constraints */}
                {selected.constraints && (
                  <div className="mt-4">
                    <h4 className="text-xs font-bold text-purple-400 uppercase">
                      Constraints
                    </h4>
                    <pre className="text-xs text-gray-400 font-mono mt-2 whitespace-pre-wrap">
                      {selected.constraints}
                    </pre>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-sm text-gray-400">No problem selected.</div>
            )}
          </div>

          {/* Draggable separator (larger hit area for reliability) */}
          <div
            onPointerDown={handlePointerDown}
            role="separator"
            aria-orientation="vertical"
            className="absolute right-0 top-0 bottom-0 w-8 -mr-4 flex items-center justify-center cursor-col-resize"
          >
            <div className="w-[2px] h-full bg-gradient-to-b from-purple-500/0 via-purple-500/60 to-purple-500/0" />
          </div>
        </aside>

        {/* Draggable divider (between left and right) */}
        <div
          onMouseDown={handleMouseDown}
          className="w-1 cursor-col-resize bg-gradient-to-b from-purple-500/0 via-purple-500/50 to-purple-500/0 hover:w-1.5 hover:from-purple-500/40 hover:via-purple-500/70 hover:to-purple-500/40 transition-all"
        />

        {/* RIGHT: Code Editor Area (shrinkable) */}
        <main className="flex-1 flex flex-col bg-[#0a0a0c] p-4 relative min-w-0">
          <div className="flex-1 flex flex-col rounded-2xl border border-purple-500/20 bg-[#0d0d0f] overflow-hidden shadow-[0_0_60px_-15px_rgba(168,85,247,0.15)]">
            <div className="h-14 flex items-center justify-between px-6 bg-white/5 border-b border-white/5">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
                </div>

                {/* Language Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="flex items-center gap-3 px-3 py-1.5 rounded-md bg-white/[0.03] border border-white/10 hover:border-purple-500/50 hover:bg-white/[0.06] transition-all group"
                  >
                    <span className="text-[11px] font-mono font-medium text-gray-400 group-hover:text-purple-400 transition-colors uppercase tracking-widest">
                      {LANGUAGES.find((l) => l.value === language)?.label}
                    </span>
                    <span
                      className={`text-[8px] text-gray-600 transition-transform ${isDropdownOpen ? "rotate-180" : ""}`}
                    >
                      ▼
                    </span>
                  </button>

                  {isDropdownOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setIsDropdownOpen(false)}
                      ></div>

                      <div className="absolute top-full left-0 mt-2 w-40 py-2 rounded-xl bg-[#0a0a0c] border border-white/10 shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                        {LANGUAGES.map((lang) => (
                          <div
                            key={lang.value}
                            onClick={() => {
                              setLanguage(lang.value);
                              setIsDropdownOpen(false);
                            }}
                            className="px-4 py-2 text-[11px] font-mono text-gray-400 hover:text-white hover:bg-purple-600/20 cursor-pointer transition-colors"
                          >
                            {lang.label}
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>

                <span className="text-[11px] font-mono text-gray-600 border-l border-white/10 pl-6">
                  solution.
                  {language === "python"
                    ? "py"
                    : language === "javascript"
                      ? "js"
                      : language}
                </span>
              </div>

              <div className="flex gap-4">
                <button className="px-5 py-1.5 text-xs font-bold text-gray-400 hover:text-white transition-colors">
                  Run
                </button>
                <button className="px-6 py-1.5 text-xs font-bold text-white bg-purple-600 rounded-lg hover:bg-purple-500 transition-all shadow-lg shadow-purple-600/30">
                  Submit Arena
                </button>
              </div>
            </div>

            {/* Questions chip bar (click to show details on left) */}
            <div className="px-6 py-3 border-b border-white/5 bg-[#0d0d0f]">
              <div className="flex gap-3 overflow-x-auto py-1">
                {questions.map((q, idx) => {
                  const isSelected = idx === selectedIndex;
                  return (
                    <button
                      key={q.titleSlug ?? q.title ?? idx}
                      onClick={() => setSelectedIndex(idx)}
                      className={`flex-shrink-0 px-3 py-1 rounded-full text-sm font-medium ${isSelected ? "bg-purple-600 text-white" : "bg-white/5 text-gray-300"} hover:brightness-110 transition-all`}
                    >
                      {q.title}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Monaco Editor Container */}
            <div className="flex-1 pt-4 bg-[#0d0d0f] min-w-0">
              <Editor
                height="100%"
                theme="vs-dark"
                language={language}
                defaultValue={`// AlgoAryna Optimization V2\nint solve(vector<int>& nums) {\n    int n = nums.size();\n    // Write code here...\n    return 0;\n}`}
                options={{
                  minimap: { enabled: false },
                  fontSize: 14,
                  lineNumbers: "on",
                  fontFamily: "JetBrains Mono, monospace",
                  padding: { top: 10 },
                }}
              />
            </div>

            {/* Status Bar */}
            <div className="h-14 flex items-center justify-between px-6 bg-black/40 border-t border-white/5">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span className="text-[11px] font-mono text-green-500/80 uppercase tracking-widest"></span>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
