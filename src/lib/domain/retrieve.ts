import { db } from "../db";

export type Snippet = {
  n: number;
  kind: "code" | "handout";
  repoId?: string;
  path: string; // file path or handout filename
  start: number;
  end: number;
  title: string;
  text: string;
  score: number;
};

const STOP = new Set(["the", "and", "for", "how", "what", "why", "does", "this", "that", "with", "from", "are", "can", "where", "which", "about", "into", "use", "used", "its", "has", "have", "you", "your", "was", "when", "who"]);

export const tokenize = (q: string) =>
  [...new Set(q.toLowerCase().split(/[^a-z0-9_]+/).filter((t) => t.length >= 3 && !STOP.has(t)))];

// MVP retrieval: keyword scoring over chunk metadata + code text + handout text, org-scoped (AI-07: never cross org).
// Vector/graph hybrid (AI-02) replaces this later; the Snippet shape stays the same.
export async function retrieve(orgId: string, question: string, opts: { currentChunkId?: string | null; limit?: number } = {}): Promise<Snippet[]> {
  const tokens = tokenize(question);
  if (tokens.length === 0) return [];
  const chunks = await db.chunk.findMany({ where: { module: { repo: { orgId } }, status: { not: "DEPRECATED" } } });
  const files = await db.file.findMany({ where: { repo: { orgId } }, select: { repoId: true, path: true, content: true } });
  const content = new Map(files.map((f) => [`${f.repoId}|${f.path}`, f.content.split("\n")]));
  const current = opts.currentChunkId ? chunks.find((c) => c.id === opts.currentChunkId) : null;

  const scored: Snippet[] = [];
  for (const c of chunks) {
    const lines = content.get(`${c.repoId}|${c.filePath}`);
    if (!lines) continue;
    const body = lines.slice(c.startLine - 1, c.endLine).join("\n");
    const lower = body.toLowerCase();
    let score = 0;
    for (const t of tokens) {
      if (c.title.toLowerCase().includes(t)) score += 4;
      if (c.filePath.toLowerCase().includes(t)) score += 2;
      if (c.summary.toLowerCase().includes(t)) score += 1;
      const hits = lower.split(t).length - 1;
      score += Math.min(hits, 5);
    }
    if (current && c.id === current.id) score += score > 0 ? 3 : 0;
    else if (current && c.moduleId === current.moduleId && score > 0) score += 1;
    if (score > 0)
      scored.push({ n: 0, kind: "code", repoId: c.repoId, path: c.filePath, start: c.startLine, end: c.endLine, title: c.title, text: body.slice(0, 2500), score });
  }

  const handouts = await db.handout.findMany({ where: { orgId, extractedText: { not: "" } } });
  for (const h of handouts) {
    const lower = h.extractedText.toLowerCase();
    let score = 0;
    for (const t of tokens) score += Math.min(lower.split(t).length - 1, 5);
    if (score > 0) scored.push({ n: 0, kind: "handout", path: h.filename, start: 1, end: 1, title: h.filename, text: h.extractedText.slice(0, 1500), score });
  }

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, opts.limit ?? 5)
    .map((s, i) => ({ ...s, n: i + 1 }));
}
