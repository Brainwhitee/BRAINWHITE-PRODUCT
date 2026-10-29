"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function CreateSlideDeckPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    topic: "",
    audience: "engineers" as "engineers" | "managers" | "executives" | "mixed",
    slideCount: 7,
    includeDiagrams: true,
    includeCode: true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const res = await fetch("/api/slides", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to generate slides");
      }

      const data = await res.json();
      router.push(`/slides/${data.deck.id}`);
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to create deck";
      setError(msg);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white p-4 sm:p-6 md:p-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Create Slide Deck</h1>
          <p className="text-slate-400 mt-1">
            Generate AI-powered slides with diagrams, code examples, and speaker notes.
          </p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-[#0a0a0a] p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <label className="block text-sm font-semibold text-slate-300 mb-1">
                Topic
              </label>
              <Input
                label="Topic"
                placeholder="e.g. React Server Components, System Design, Onboarding Best Practices"
                value={formData.topic}
                onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                required
              />
            </div>

            <div className="space-y-4">
              <label className="block text-sm font-semibold text-slate-300 mb-1">
                Audience
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {["engineers", "managers", "executives", "mixed"].map((audience) => (
                  <button
                    key={audience}
                    type="button"
                    onClick={() =>
                      setFormData({ ...formData, audience: audience as any })
                    }
                    className={`px-4 py-3 rounded-lg text-sm font-medium border transition-colors ${
                      formData.audience === audience
                        ? "border-[#FC7819] bg-[#FC7819]/10 text-[#FC7819]"
                        : "border-slate-700 bg-slate-900 text-slate-400 hover:border-slate-500"
                    }`}
                  >
                    {audience.charAt(0).toUpperCase() + audience.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-slate-300">
                  Slide Count
                </label>
                <span className="text-xs font-mono text-[#FC7819]">{formData.slideCount}</span>
              </div>
              <input
                type="range"
                min="3"
                max="15"
                step="1"
                value={formData.slideCount}
                onChange={(e) =>
                  setFormData({ ...formData, slideCount: Number(e.target.value) })
                }
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-[#FC7819]"
              />
            </div>

            <div className="space-y-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.includeDiagrams}
                  onChange={(e) =>
                    setFormData({ ...formData, includeDiagrams: e.target.checked })
                  }
                  className="w-4 h-4 rounded border-slate-600 text-[#FC7819] focus:ring-[#FC7819] bg-[#0a0a0a]"
                />
                <span className="text-slate-300">Include Mermaid diagrams</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.includeCode}
                  onChange={(e) =>
                    setFormData({ ...formData, includeCode: e.target.checked })
                  }
                  className="w-4 h-4 rounded border-slate-600 text-[#FC7819] focus:ring-[#FC7819] bg-[#0a0a0a]"
                />
                <span className="text-slate-300">Include code examples</span>
              </label>
            </div>

            {error && (
              <div className="p-3 rounded-lg border border-red-500/30 bg-red-500/10 text-red-400 text-sm">
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full bg-[#FC7819] text-black font-semibold py-3 hover:bg-[#ff8c33] disabled:opacity-50"
              disabled={isLoading || !formData.topic}
            >
              {isLoading ? "Generating deck…" : "Generate Slide Deck"}
            </Button>
          </form>
        </div>

        <div className="mt-8 p-4 rounded-lg border border-slate-800 bg-[#0a0a0a]/50 text-sm text-slate-400">
          <p className="mb-2">How it works:</p>
          <ul className="space-y-1 list-disc list-inside">
            <li>Enter a topic and select your audience</li>
            <li>AI generates slide titles, content, diagrams, and code examples</li>
            <li>View your deck with interactive Mermaid diagram rendering</li>
            <li>Decks are saved to your organisation for later access</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
