import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";

export default async function SlidesPage() {
  const user = await getUser();
  if (!user) redirect("/login");

  const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL ?? ""}/api/slides`, {
    cache: "no-store",
  });
  const data = await res.json();
  const decks = data.decks ?? [];

  return (
    <div className="min-h-screen bg-[#050505] text-white p-4 sm:p-6 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Slide Decks</h1>
            <p className="text-slate-400 mt-1">
              Create and view AI-generated slide decks with diagrams and code.
            </p>
          </div>
          <a
            href="/slides/create"
            className="inline-flex items-center gap-2 bg-[#FC7819] text-black font-semibold px-6 py-3 rounded-lg hover:bg-[#ff8c33] transition-colors"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Create New Deck
          </a>
        </div>

        {decks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mb-4">
              <svg
                className="w-8 h-8 text-slate-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0Z"
                />
              </svg>
            </div>
            <h2 className="text-xl font-semibold mb-2">No slide decks yet</h2>
            <p className="text-slate-400 mb-6 max-w-xs">
              Create your first AI-generated slide deck. Enter a topic, choose your audience,
              and we'll generate slides with diagrams and code examples.
            </p>
            <a
              href="/slides/create"
              className="bg-[#FC7819] text-black font-semibold px-8 py-3 rounded-lg hover:bg-[#ff8c33] transition-colors"
            >
              Create New Deck
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {decks.map((deck: any) => (
              <div
                key={deck.id}
                className="group rounded-xl border border-slate-800 bg-[#0a0a0a] p-6 hover:border-[#FC7819]/50 transition-colors cursor-pointer"
              >
                <div className="flex justify-between items-start mb-4">
                  <span className="text-xs font-mono text-[#FC7819] bg-[#FC7819]/10 px-2 py-1 rounded">
                    {deck.slides?.length ?? 0} slides
                  </span>
                  <div className="w-2 h-2 rounded-full bg-[#FC7819] opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <h3 className="text-xl font-semibold mb-2 group-hover:text-[#FC7819] transition-colors">
                  {deck.title}
                </h3>
                <p className="text-slate-400 text-sm mb-4 line-clamp-2">
                  {deck.description}
                </p>
                <div className="flex items-center justify-between text-xs text-slate-500 pt-3 border-t border-slate-800">
                  <span>{new Date(deck.updatedAt).toLocaleDateString()}</span>
                  <span className="text-[#FC7819]">Open →</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
