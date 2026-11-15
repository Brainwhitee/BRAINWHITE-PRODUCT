// Phase 7: suggest a draft learning path from the knowledge graph (pure: no DB, no AI). Tested in scripts/path-suggest.test.ts.
// Rules (deliberately simple and explainable, so a manager can review them):
//  1. Skip noise modules (fixtures, docs, scripts, tests, examples, migrations) and modules without chunks.
//  2. Keep the most central modules (most other modules depend on them, then most files), up to `maxSections`.
//  3. Order them foundations-first: a module comes after the modules it depends on, so every lesson only uses ideas
//     the learner has already seen. Cycles are legal in import graphs and are broken at the back edge.
//  4. Inside a module, the most imported files come first (they are the ones everything else relies on), then file order.
//  5. Each section is capped in lessons and minutes. Nothing is invented: every lesson is an existing chunk.
import { dependencyOrder } from "../graph";

export type SModule = { id: string; name: string; path: string; files: number; summary: string };
export type SChunk = { id: string; moduleId: string; filePath: string; title: string; startLine: number; endLine: number; estMinutes: number };
export type SuggestInput = {
  modules: SModule[];
  moduleEdges: { from: string; to: string }[]; // from depends on to
  chunks: SChunk[];
  fileFanIn: Record<string, number>; // file path -> number of files importing it
  maxSections?: number;
  maxChunksPerSection?: number;
  maxMinutesPerSection?: number;
};
export type SuggestedSection = { moduleId: string; title: string; intro: string; chunks: SChunk[]; minutes: number; why: string };
export type Suggestion = { sections: SuggestedSection[]; skipped: { name: string; reason: string }[]; totalMinutes: number };

const NOISE = /(^|\/)(fixtures?|__tests__|tests?|specs?|docs?|scripts?|examples?|migrations?|\.github)(\/|$)/i;

export const isNoiseModule = (path: string) => NOISE.test(path);

export function suggestPath(input: SuggestInput): Suggestion {
  const maxSections = input.maxSections ?? 6;
  const maxChunks = input.maxChunksPerSection ?? 5;
  const maxMinutes = input.maxMinutesPerSection ?? 90;

  const chunksOf = new Map<string, SChunk[]>();
  for (const c of input.chunks) (chunksOf.get(c.moduleId) ?? chunksOf.set(c.moduleId, []).get(c.moduleId)!).push(c);

  const skipped: Suggestion["skipped"] = [];
  const candidates: SModule[] = [];
  for (const m of input.modules) {
    if (isNoiseModule(m.path)) skipped.push({ name: m.name, reason: "tests, fixtures, docs or scripts" });
    else if (!(chunksOf.get(m.id)?.length)) skipped.push({ name: m.name, reason: "no lessons (chunks) yet" });
    else candidates.push(m);
  }

  // centrality: how many other candidate modules depend on this one
  const ids = new Set(candidates.map((m) => m.id));
  const dependents = new Map<string, number>();
  for (const e of input.moduleEdges) if (ids.has(e.from) && ids.has(e.to) && e.from !== e.to) dependents.set(e.to, (dependents.get(e.to) ?? 0) + 1);
  const central = [...candidates].sort((a, b) => (dependents.get(b.id) ?? 0) - (dependents.get(a.id) ?? 0) || b.files - a.files || a.name.localeCompare(b.name));
  const chosen = central.slice(0, maxSections);
  for (const m of central.slice(maxSections)) skipped.push({ name: m.name, reason: `less central than the ${maxSections} chosen modules` });

  const chosenIds = new Set(chosen.map((m) => m.id));
  const order = dependencyOrder(
    chosen.map((m) => ({ id: m.id })),
    input.moduleEdges.filter((e) => chosenIds.has(e.from) && chosenIds.has(e.to)),
  );
  const byId = new Map(chosen.map((m) => [m.id, m]));

  const sections: SuggestedSection[] = [];
  for (const id of order) {
    const m = byId.get(id)!;
    const ranked = [...(chunksOf.get(id) ?? [])].sort(
      (a, b) => (input.fileFanIn[b.filePath] ?? 0) - (input.fileFanIn[a.filePath] ?? 0) || a.filePath.localeCompare(b.filePath) || a.startLine - b.startLine,
    );
    const picked: SChunk[] = [];
    let minutes = 0;
    for (const c of ranked) {
      if (picked.length >= maxChunks) break;
      if (picked.length > 0 && minutes + c.estMinutes > maxMinutes) continue;
      picked.push(c);
      minutes += c.estMinutes;
    }
    const n = dependents.get(id) ?? 0;
    sections.push({
      moduleId: id, title: m.name, minutes,
      intro: (m.summary.split(/(?<=\.)\s/)[0] ?? "").slice(0, 240),
      chunks: picked,
      why: n === 0 ? "nothing else in this path depends on it" : n === 1 ? "1 other module builds on it" : `${n} other modules build on it`,
    });
  }
  return { sections, skipped, totalMinutes: sections.reduce((s, x) => s + x.minutes, 0) };
}

// The intro note of a section. Every claim points at real source lines (deterministic: nothing here is generated, so nothing can be invented).
export function sectionNote(sec: Pick<SuggestedSection, "intro" | "why" | "chunks">): string {
  const head = [sec.intro, `Why now: ${sec.why}.`].filter(Boolean).join("\n\n");
  const cites = sec.chunks.map((c) => `- ${c.filePath}:${c.startLine}-${c.endLine} (${c.title})`).join("\n");
  return cites ? `${head}\n\nSource lines you will read:\n${cites}` : head;
}
