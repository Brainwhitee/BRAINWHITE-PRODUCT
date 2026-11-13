"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import MermaidDiagram from "@/components/ui/mermaid-diagram";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Trash2, Home, Share2, Check } from "lucide-react";

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
  const [isDeleting, setIsDeleting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadDeck = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/slides/${params.id}`, {
        cache: "no-store",
      });
      if (!res.ok) {
        throw new Error(res.status === 404 ? "Deck not found" : "Failed to load deck");
      }
      const data = await res.json();
      if (!data.deck) {
        setError("Deck not found");
        return;
      }
      setDeck(data.deck);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load deck");
    } finally {
      setIsLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    loadDeck();
  }, [loadDeck]);

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this slide deck? This action cannot be undone.")) return;
    try {
      setIsDeleting(true);
      const res = await fetch(`/api/slides/${params.id}`, { method: "DELETE" });
      if (res.ok) {
        router.push("/slides");
      } else {
        alert("Failed to delete slide deck.");
        setIsDeleting(false);
      }
    } catch {
      alert("Error deleting slide deck.");
      setIsDeleting(false);
    }
  };

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const slides = deck?.slides ? [...deck.slides].sort((a, b) => a.order - b.order) : [];
  const total = slides.length;

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (total === 0) return;
      if (e.key === "ArrowRight" || e.key === " " || e.key === "PageDown") {
        e.preventDefault();
        setCurrentSlide((prev) => Math.min(prev + 1, total - 1));
      } else if (e.key === "ArrowLeft" || e.key === "PageUp") {
        e.preventDefault();
        setCurrentSlide((prev) => Math.max(prev - 1, 0));
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [total]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[#FC7819] border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400 text-sm">Loading presentation…</p>
        </div>
      </div>
    );
  }

  if (error || !deck || total === 0) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6">
        <div className="max-w-md text-center">
          <h1 className="text-xl font-bold text-white mb-2">{error || "Deck not found"}</h1>
          <p className="text-slate-400 text-sm mb-6">The presentation could not be found or you may not have access to it.</p>
          <Button
            onClick={() => router.push("/slides")}
            className="bg-[#FC7819] text-black font-semibold py-2 px-6 hover:bg-[#ff8c33] rounded-xl"
          >
            Back to Decks
          </Button>
        </div>
      </div>
    );
  }

  const current = slides[currentSlide] ?? slides[0];

  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col justify-between">
      {/* Header */}
      <div className="px-6 py-4 border-b border-neutral-800 bg-neutral-950/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white line-clamp-1">{deck.title}</h1>
            <p className="text-slate-400 text-xs mt-0.5 line-clamp-1">{deck.description}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push("/slides")}
              className="p-2 rounded-lg bg-neutral-900 border border-neutral-800 text-slate-400 hover:text-white hover:border-neutral-700 transition-colors"
              title="All Decks"
            >
              <Home className="w-4 h-4" />
            </button>
            <button
              onClick={handleCopyLink}
              className="p-2 rounded-lg bg-neutral-900 border border-neutral-800 text-slate-400 hover:text-white hover:border-neutral-700 transition-colors"
              title="Copy Link"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
            </button>
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="p-2 rounded-lg bg-neutral-900 border border-neutral-800 text-slate-400 hover:text-red-400 hover:border-red-900/50 transition-colors"
              title="Delete Deck"
            >
              <Trash2 className="w-4 h-4" />
            </button>

            <div className="h-5 w-px bg-neutral-800 mx-1" />

            {/* Navigation buttons */}
            <button
              onClick={() => setCurrentSlide(0)}
              disabled={currentSlide === 0}
              className="px-2.5 py-1.5 text-xs rounded-lg bg-neutral-900 border border-neutral-800 text-slate-300 disabled:opacity-40 hover:border-neutral-700 transition-colors"
            >
              First
            </button>
            <button
              onClick={() => setCurrentSlide((prev) => Math.max(prev - 1, 0))}
              disabled={currentSlide === 0}
              className="p-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-slate-300 disabled:opacity-40 hover:border-neutral-700 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-mono text-slate-400 px-2">
              {currentSlide + 1} / {total}
            </span>
            <button
              onClick={() => setCurrentSlide((prev) => Math.min(prev + 1, total - 1))}
              disabled={currentSlide >= total - 1}
              className="p-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-slate-300 disabled:opacity-40 hover:border-neutral-700 transition-colors"
            >
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentSlide(total - 1)}
              disabled={currentSlide >= total - 1}
              className="px-2.5 py-1.5 text-xs rounded-lg bg-neutral-900 border border-neutral-800 text-slate-300 disabled:opacity-40 hover:border-neutral-700 transition-colors"
            >
              Last
            </button>
          </div>
        </div>
      </div>

      {/* Slide Viewport */}
      <div className="flex-1 max-w-6xl w-full mx-auto py-6 sm:py-8 px-4 flex flex-col justify-center">
        <div
          className="relative rounded-3xl border border-neutral-800 bg-neutral-950 p-6 sm:p-12 min-h-[60vh] flex flex-col justify-between shadow-2xl"
          style={{ backgroundImage: "radial-gradient(circle at 50% 50%, rgba(252, 120, 25, 0.04), transparent 70%)" }}
        >
          {/* Slide Type Badge */}
          <div className="absolute top-5 left-5">
            <span className="px-3 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-neutral-900 border border-neutral-800 text-[#FC7819]">
              {current.type}
            </span>
          </div>

          {/* Slide Content */}
          <div className="relative z-10 flex-1 flex flex-col justify-center py-8">
            {current.type === "title" && (
              <div className="flex h-full items-center justify-center text-center px-4">
                <div>
                  <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-white mb-6 leading-tight">
                    {current.title}
                  </h1>
                  <p className="text-base sm:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
                    {current.content}
                  </p>
                </div>
              </div>
            )}

            {current.type === "content" && (
              <div className="flex h-full flex-col justify-center max-w-3xl mx-auto w-full px-4">
                <h2 className="text-2xl sm:text-4xl font-extrabold mb-8 text-white tracking-tight">{current.title}</h2>
                <div className="space-y-4 text-slate-300 text-base sm:text-lg leading-relaxed">
                  {current.content.split("\n").filter(Boolean).map((line, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <span className="text-[#FC7819] font-bold mt-1 text-xs">▸</span>
                      <span>{line.replace(/^[•\-\*]\s*/, "")}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {current.type === "diagram" && (
              <div className="flex h-full flex-col items-center justify-center px-4 w-full">
                <h2 className="text-2xl sm:text-3xl font-bold mb-4 text-white text-center">{current.title}</h2>
                <div className="w-full flex justify-center my-2">
                  <MermaidDiagram code={current.diagramCode ?? ""} />
                </div>
                {current.content && (
                  <p className="mt-4 text-xs sm:text-sm text-slate-400 text-center max-w-xl">
                    {current.content}
                  </p>
                )}
              </div>
            )}

            {current.type === "code" && (
              <div className="flex h-full flex-col items-center justify-center px-4 w-full">
                <h2 className="text-2xl sm:text-3xl font-bold mb-6 text-white text-center">{current.title}</h2>
                <div className="w-full max-w-3xl rounded-2xl border border-neutral-800 bg-neutral-900 overflow-hidden shadow-2xl">
                  <div className="flex items-center gap-2 px-4 py-2.5 bg-neutral-950 border-b border-neutral-800">
                    <div className="flex gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-neutral-700" />
                      <div className="w-2.5 h-2.5 rounded-full bg-neutral-700" />
                      <div className="w-2.5 h-2.5 rounded-full bg-neutral-700" />
                    </div>
                    <span className="text-[11px] font-mono text-neutral-400 ml-auto uppercase">
                      {current.codeLanguage ?? "typescript"}
                    </span>
                  </div>
                  <pre className="p-5 overflow-x-auto text-xs sm:text-sm font-mono text-neutral-200 leading-relaxed">
                    <code>{current.codeSnippet ?? ""}</code>
                  </pre>
                </div>
                {current.content && (
                  <p className="mt-4 text-xs sm:text-sm text-slate-400 text-center max-w-md">
                    {current.content}
                  </p>
                )}
              </div>
            )}

            {current.type === "quote" && (
              <div className="flex h-full items-center justify-center text-center px-8">
                <div className="max-w-2xl">
                  <div className="border-l-4 border-[#FC7819] pl-6 py-4 text-left">
                    <p className="text-xl sm:text-3xl font-light italic text-white leading-relaxed">
                      &ldquo;{current.content.replace(/^["“”]|["“”]$/g, "")}&rdquo;
                    </p>
                    <p className="mt-6 text-right text-xs sm:text-sm font-semibold uppercase tracking-wider text-[#FC7819]">
                      — {current.title}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {current.type === "two-column" && (
              <div className="flex h-full flex-col justify-center px-4 max-w-4xl mx-auto w-full">
                <h3 className="text-2xl sm:text-3xl font-bold mb-8 text-white text-center">{current.title}</h3>
                <div className="grid sm:grid-cols-2 gap-6">
                  <div className="p-6 rounded-2xl border border-neutral-800 bg-neutral-900/40 text-slate-300 text-sm leading-relaxed space-y-2">
                    {(current.content.split("||")[0] ?? current.content).split("\n").map((line, i) => (
                      <p key={i} className={i === 0 ? "font-bold text-white mb-2" : ""}>{line}</p>
                    ))}
                  </div>
                  <div className="p-6 rounded-2xl border border-neutral-800 bg-neutral-900/40 text-slate-400 text-sm leading-relaxed space-y-2">
                    {(current.content.split("||")[1] ?? "").split("\n").map((line, i) => (
                      <p key={i} className={i === 0 ? "font-bold text-neutral-300 mb-2" : ""}>{line}</p>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Speaker Notes */}
          {current.speakerNotes && (
            <div className="mt-6 bg-neutral-900/90 border border-neutral-800 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-bold text-[#FC7819] uppercase tracking-wider font-mono">
                  Presenter Notes
                </span>
              </div>
              <p className="text-xs text-slate-300 italic leading-relaxed">{current.speakerNotes}</p>
            </div>
          )}
        </div>
      </div>

      {/* Slide Thumbnails */}
      <div className="max-w-6xl w-full mx-auto pb-6 px-4">
        <div className="flex flex-wrap items-center justify-center gap-2">
          {slides.map((s, idx) => (
            <button
              key={s.id}
              onClick={() => setCurrentSlide(idx)}
              className={`w-9 h-9 rounded-xl border flex items-center justify-center text-xs font-mono font-medium transition-all ${
                currentSlide === idx
                  ? "border-[#FC7819] bg-[#FC7819] text-black font-bold shadow-sm"
                  : "border-neutral-800 bg-neutral-900 text-slate-400 hover:border-neutral-700 hover:text-white"
              }`}
              title={s.title}
            >
              {idx + 1}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
