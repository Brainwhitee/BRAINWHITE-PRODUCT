import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getSlideDecks } from "@/lib/domain/slides";
import Link from "next/link";
import { Plus, Presentation, ArrowRight, Layers } from "lucide-react";

export default async function SlidesPage() {
  const user = await requireUser();
  const decks = await getSlideDecks(user.orgId);

  return (
    <div className="min-h-screen bg-[#050505] text-white p-4 sm:p-6 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Presentation className="w-5 h-5 text-[#FC7819]" />
              <h1 className="text-3xl font-bold tracking-tight">Slide Decks</h1>
            </div>
            <p className="text-slate-400 text-sm">
              Generate executive presentations, architecture blueprints, and code walkthroughs with interactive Mermaid diagrams.
            </p>
          </div>
          <Link
            href="/slides/create"
            className="inline-flex items-center gap-2 bg-[#FC7819] text-black font-semibold px-5 py-2.5 rounded-xl hover:bg-[#ff8c33] transition-all shadow-md active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Deck</span>
          </Link>
        </div>

        {decks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed border-neutral-800 rounded-3xl bg-neutral-950/40 p-8">
            <div className="w-16 h-16 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-center mb-4 text-[#FC7819]">
              <Layers className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">No slide decks yet</h2>
            <p className="text-slate-400 mb-6 max-w-md text-sm leading-relaxed">
              Create your first AI-powered or heuristic slide deck. Enter your topic, select your audience, and Brainwhite instantly generates slides with architecture diagrams, code blocks, and speaker notes.
            </p>
            <Link
              href="/slides/create"
              className="inline-flex items-center gap-2 bg-[#FC7819] text-black font-semibold px-6 py-3 rounded-xl hover:bg-[#ff8c33] transition-all shadow-md active:scale-95 text-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Deck</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {decks.map((deck) => (
              <Link
                key={deck.id}
                href={`/slides/${deck.id}`}
                className="group rounded-2xl border border-neutral-800 bg-neutral-950/60 p-6 hover:border-[#FC7819]/60 transition-all block hover:shadow-[0_8px_30px_rgba(252,120,25,0.06)] hover:-translate-y-0.5"
              >
                <div className="flex justify-between items-start mb-4">
                  <span className="text-[11px] font-mono text-[#FC7819] bg-[#FC7819]/10 border border-[#FC7819]/20 px-2.5 py-0.5 rounded-full font-medium">
                    {deck.slides?.length ?? 0} slides
                  </span>
                  <ArrowRight className="w-4 h-4 text-neutral-500 group-hover:text-[#FC7819] group-hover:translate-x-1 transition-all" />
                </div>
                <h3 className="text-lg font-bold mb-2 text-white group-hover:text-[#FC7819] transition-colors line-clamp-1">
                  {deck.title}
                </h3>
                <p className="text-neutral-400 text-xs mb-4 line-clamp-2 leading-relaxed">
                  {deck.description}
                </p>
                <div className="flex items-center justify-between text-[11px] text-neutral-500 pt-3 border-t border-neutral-800/80">
                  <span>Updated {new Date(deck.updatedAt).toLocaleDateString()}</span>
                  <span className="text-[#FC7819] font-medium">View Deck →</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
