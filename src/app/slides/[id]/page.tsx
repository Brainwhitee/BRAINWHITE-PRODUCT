"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import MermaidDiagram from "@/components/ui/mermaid-diagram";
import { Button } from "@/components/ui/button";

type SlideType = "title" | "content" | "diagram" | "code" | "quote" | "two-column";

type Slide = {
  id: string;
  type: SlideType;
  title: string;
  content: string;
  speakerNotes?: string;
  diagramCode?: string;
  codeSnippet?: string;
  codeLanguage?: string;
  order: number;
};

type Deck = {
  id: string;
  title: string;
  description: string;
  slides: Slide[];
  createdAt: string;
  updatedAt: string;
  orgId: string;
  userId: string;
};

export default function SlideDeckPage() {
  const params = useParams();
  const router = useRouter();
  const [deck, setDeck] = useState<Deck | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDeck();
  }, [params.id]);

  async function loadDeck() {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/slides`, {
        cache: "no-store",
      });
      const data = await res.json();
      const found = (data.decks ?? []).find((d: any) => d.id === params.id);
      if (!found) {
        setError("Deck not found");
        return;
      }
      setDeck(found);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load deck");
    } finally {
      setIsLoading(false);
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[#FC7819] border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400">Loading deck…</p>
        </div>
      </div>
    );
  }

  if (error || !deck) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6">
        <div className="max-w-md text-center">
          <h1 className="text-xl font-semibold text-white mb-2">{error || "Deck not found"}</h1>
          <Button
            onClick={() => router.push("/slides")}
            className="bg-[#FC7819] text-black font-semibold py-2 px-6 hover:bg-[#ff8c33] mt-4"
          >
            Back to Decks
          </Button>
        </div>
      </div>
    );
  }

  const slides = deck.slides.sort((a: Slide, b: Slide) => a.order - b.order);
  const current = slides[currentSlide] ?? slides[0];
  const total = slides.length;

  const slideTypeColors: Record<string, string> = {
    title: "#FC7819",
    content: "#3b82f6",
    diagram: "#10b981",
    code: "#8b5cf6",
    quote: "#f59e0b",
    "two-column": "#ec4899",
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-800">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{deck.title}</h1>
            <p className="text-slate-400 text-sm mt-1">{deck.description}</p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              onClick={() => router.push("/slides")}
              variant="outline"
            >
              Back to Decks
            </Button>
            <Button
              onClick={() => setCurrentSlide(0)}
              disabled={currentSlide === 0}
              className="text-xs px-3 py-1.5"
            >
              ← First
            </Button>
            <Button
              onClick={() => setCurrentSlide(currentSlide - 1)}
              disabled={currentSlide === 0}
              className="text-xs px-2 py-1.5"
            >
              Prev
            </Button>
            <span className="text-xs text-slate-400">
              {currentSlide + 1} / {total}
            </span>
            <Button
              onClick={() => setCurrentSlide(currentSlide + 1)}
              disabled={currentSlide >= total - 1}
              className="text-xs px-2 py-1.5"
            >
              Next
            </Button>
            <Button
              onClick={() => setCurrentSlide(total - 1)}
              disabled={currentSlide >= total - 1}
              className="text-xs px-3 py-1.5"
            >
              Last →
            </Button>
          </div>
        </div>
      </div>

      {/* Slide Viewport */}
      <div className="max-w-6xl mx-auto py-8 px-4">
        <div
          className="relative rounded-2xl border border-slate-800 bg-[#0a0a0a] shadow-2xl p-8 min-h-[70vh]"
          style={{ backgroundImage: "radial-gradient(circle at 50% 50%, rgba(252, 120, 25, 0.05), transparent 50%)" }}
        >
          {/* Slide Type Badge */}
          <div className="absolute top-4 left-4">
            <span
              className={`px-2 py-1 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-slate-900 border border-slate-700 text-[#FC7819]`}
            >
              {current.type}
            </span>
          </div>

          {/* Slide Content */}
          <div className="relative z-10 h-full flex flex-col">
            {current.type === "title" && (
              <div className="flex h-full items-center justify-center text-center px-4">
                <div>
                  <h1 className="text-6xl sm:text-8xl font-black tracking-tighter text-white mb-4 leading-tight">
                    {current.title}
                  </h1>
                  <p className="text-xl text-slate-400 max-w-2xl mx-auto">
                    {current.content}
                  </p>
                </div>
              </div>
            )}

            {current.type === "content" && (
              <div className="flex h-full flex-col justify-center px-4">
                <h2 className="text-3xl font-bold mb-6 text-white">{current.title}</h2>
                <div className="prose prose-invert max-w-none text-slate-300 leading-relaxed">
                  {current.content.split("\n").map((line, i) => (
                    <p key={i} className="mb-4 flex items-start gap-2">
                      <span className="text-[#FC7819] mt-0.5">▸</span>
                      {line}
                    </p>
                  ))}
                </div>
              </div>
            )}

            {current.type === "diagram" && (
              <div className="flex h-full flex-col items-center justify-center px-4">
                <h2 className="text-2xl font-bold mb-4 text-white text-center">{current.title}</h2>
                <MermaidDiagram code={current.diagramCode ?? ""} />
                {current.content && (
                  <p className="mt-4 text-sm text-slate-400 text-center max-w-md">
                    {current.content}
                  </p>
                )}
              </div>
            )}

            {current.type === "code" && (
              <div className="flex h-full flex-col items-center justify-center px-4">
                <h2 className="text-2xl font-bold mb-4 text-white text-center">{current.title}</h2>
                <div className="w-full max-w-3xl rounded-xl border border-slate-700 bg-black overflow-hidden shadow-lg">
                  <div className="flex items-center gap-2 px-4 py-2 bg-slate-900 border-b border-slate-700">
                    <div className="flex gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-red-500" />
                      <div className="w-3 h-3 rounded-full bg-yellow-500" />
                      <div className="w-3 h-3 rounded-full bg-green-500" />
                    </div>
                    <span className="text-xs text-slate-500 ml-auto">
                      {current.codeLanguage ?? "text"}
                    </span>
                  </div>
                  <pre className="p-4 overflow-x-auto text-sm font-mono text-slate-300">
                    <code>{current.codeSnippet ?? ""}</code>
                  </pre>
                </div>
                {current.content && (
                  <p className="mt-4 text-sm text-slate-400 text-center max-w-md">
                    {current.content}
                  </p>
                )}
              </div>
            )}

            {current.type === "quote" && (
              <div className="flex h-full items-center justify-center text-center px-8">
                <div className="max-w-2xl">
                  <div className="border-l-4 border-[#FC7819] pl-6 py-4">
                    <p className="text-2xl font-light italic text-white leading-relaxed">
                      " {current.content} "
                    </p>
                    <p className="mt-4 text-right text-sm font-semibold text-[#FC7819]">
                      — {current.title}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {current.type === "two-column" && (
              <div className="flex h-full items-center justify-center gap-8 px-4">
                <div className="w-1/2 p-4">
                  <h3 className="text-xl font-bold mb-4 text-white">{current.title}</h3>
                  <div className="prose prose-invert max-w-none text-slate-300 leading-relaxed">
                    {current.content.split("||")[0] ?? current.content}
                  </div>
                </div>
                <div className="w-1/2 p-4 border-l border-slate-800">
                  <div className="prose prose-invert max-w-none text-slate-400 leading-relaxed">
                    {current.content.split("||")[1] ?? ""}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Speaker Notes */}
          {current.speakerNotes && (
            <div className="absolute bottom-4 left-4 right-4">
              <div className="bg-slate-900/80 backdrop-blur border border-slate-700 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <svg
                    className="w-4 h-4 text-[#FC7819]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 10h.01M12 10h.01M16 10h.01M9 16H5l2-2L5 3l3.98 3.98M21 12a9 9 0 11-18 0 9 9 0 0118 0Z"
                    />
                  </svg>
                  <span className="text-xs font-bold text-[#FC7819] uppercase tracking-wider">
                    Speaker Notes
                  </span>
                </div>
                <p className="text-sm text-slate-300 italic">{current.speakerNotes}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Slide Thumbnails */}
      <div className="max-w-6xl mx-auto py-6 px-4">
        <div className="flex flex-wrap gap-2">
          {slides.map((s, idx) => (
            <button
              key={s.id}
              onClick={() => setCurrentSlide(idx)}
              className={`w-10 h-10 rounded border flex items-center justify-center text-xs transition-all ${
                currentSlide === idx
                  ? "border-[#FC7819] bg-[#FC7819]/20"
                  : "border-slate-700 hover:border-slate-500"
              }`}
            >
              {idx + 1}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
