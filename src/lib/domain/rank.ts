// Pure ranking for chat retrieval (no DB, no network): BM25 over weighted fields, then a graph re-rank
// (2-hop propagation over file-import edges), then a token budget. Tested in scripts/rank.test.ts.

export type RankDoc = {
  id: string;
  fileKey: string; // graph node this doc belongs to (file path or file id), used for the graph boost
  path: string;
  title: string;
  summary: string;
  body: string;
};

export type RankOptions = {
  currentId?: string | null; // chunk the learner is looking at: seeds the graph walk and gets a small bonus
  edges?: [string, string][]; // directed file edges [fromFileKey, toFileKey]; treated as undirected for relevance
  limit?: number;
  budgetTokens?: number; // approx (chars / 4) budget for the sum of returned doc texts
  maxCharsPerDoc?: number;
};

export type Ranked = { doc: RankDoc; score: number; lexical: number; graph: number };

const STOP = new Set(["the", "and", "for", "how", "what", "why", "does", "this", "that", "with", "from", "are", "can", "where", "which", "about", "into", "use", "used", "its", "has", "have", "you", "your", "was", "when", "who", "work", "works", "explain", "show", "tell"]);

// "syncRepository" -> sync repository; "SYNC_RUN" -> sync run; "auth.ts" -> auth ts. Light plural/suffix stemming.
export function terms(text: string): string[] {
  const out: string[] = [];
  for (const raw of text.replace(/([a-z0-9])([A-Z])/g, "$1 $2").replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2").toLowerCase().split(/[^a-z0-9]+/)) {
    if (raw.length < 2) continue;
    out.push(stem(raw));
  }
  return out;
}
function stem(word: string): string {
  let w = word;
  if (w.length > 4 && w.endsWith("ies")) w = w.slice(0, -3) + "y";
  else if (/(ss|x|z|ch|sh)es$/.test(w) && w.length > 4) w = w.slice(0, -2);
  else if (w.length > 3 && w.endsWith("s") && !w.endsWith("ss")) w = w.slice(0, -1);
  if (w.length > 5 && w.endsWith("ing")) w = w.slice(0, -3);
  else if (w.length > 4 && w.endsWith("ed")) w = w.slice(0, -2);
  if (w.length > 4 && w.endsWith("e")) w = w.slice(0, -1);
  return w;
}

const STOP_STEMS = new Set([...STOP].map(stem));
export const queryTerms = (q: string) => [...new Set(terms(q).filter((t) => t.length >= 3 && !STOP_STEMS.has(t)))];

const FIELD_WEIGHT = { title: 4, path: 3, summary: 1.5, body: 1 } as const;
const K1 = 1.2;
const B = 0.75;

type Indexed = { doc: RankDoc; tf: Map<string, number>; len: number };

function index(doc: RankDoc): Indexed {
  const tf = new Map<string, number>();
  let len = 0;
  for (const field of Object.keys(FIELD_WEIGHT) as (keyof typeof FIELD_WEIGHT)[]) {
    const w = FIELD_WEIGHT[field];
    const ts = terms(field === "path" ? doc[field].replace(/[/\\.]/g, " ") : doc[field]);
    len += ts.length * (field === "body" ? 1 : 0.25); // short metadata fields should not dominate length normalisation
    for (const t of ts) tf.set(t, (tf.get(t) ?? 0) + w);
  }
  return { doc, tf, len: Math.max(len, 1) };
}

// Graph relevance: each seed pushes its weight to its neighbours (1 hop) and their neighbours (2 hops, halved).
// A node never receives its own seed back, so being an isolated hit is neutral and being near other hits is a bonus.
function propagate(edges: [string, string][], seeds: Map<string, number>): Map<string, number> {
  const adj = new Map<string, Set<string>>();
  for (const [a, b] of edges) {
    if (a === b) continue;
    (adj.get(a) ?? adj.set(a, new Set()).get(a)!).add(b);
    (adj.get(b) ?? adj.set(b, new Set()).get(b)!).add(a);
  }
  const g = new Map<string, number>();
  const add = (k: string, v: number) => g.set(k, (g.get(k) ?? 0) + v);
  for (const [n, s] of seeds) {
    const out = adj.get(n);
    if (!out) continue;
    const w1 = s / out.size;
    for (const m of out) {
      add(m, w1);
      const out2 = adj.get(m)!;
      for (const k of out2) if (k !== n) add(k, (0.5 * w1) / out2.size);
    }
  }
  return g;
}

export function rankDocs(docs: RankDoc[], query: string, opts: RankOptions = {}): Ranked[] {
  const qt = queryTerms(query);
  if (qt.length === 0 || docs.length === 0) return [];
  const idx = docs.map(index);
  const avg = idx.reduce((a, d) => a + d.len, 0) / idx.length;
  const df = new Map<string, number>();
  for (const t of qt) df.set(t, idx.filter((d) => d.tf.has(t)).length);

  const lexical = new Map<string, number>();
  for (const d of idx) {
    let s = 0;
    for (const t of qt) {
      const f = d.tf.get(t);
      if (!f) continue;
      const n = df.get(t)!;
      const idf = Math.log(1 + (idx.length - n + 0.5) / (n + 0.5));
      s += idf * ((f * (K1 + 1)) / (f + K1 * (1 - B + (B * d.len) / avg)));
    }
    if (s > 0) lexical.set(d.doc.id, s);
  }
  if (lexical.size === 0) return [];
  const maxLex = Math.max(...lexical.values());

  // graph relevance: walk from lexical hits (and the current chunk's file) over the import graph
  const fileOf = new Map(docs.map((d) => [d.id, d.fileKey]));
  const graphByFile = new Map<string, number>();
  if (opts.edges?.length) {
    const seeds = new Map<string, number>();
    for (const [id, s] of lexical) seeds.set(fileOf.get(id)!, Math.max(seeds.get(fileOf.get(id)!) ?? 0, s / maxLex));
    const cur = opts.currentId ? fileOf.get(opts.currentId) : undefined;
    if (cur) seeds.set(cur, (seeds.get(cur) ?? 0) + 0.5);
    const pr = propagate(opts.edges, seeds);
    const maxPr = Math.max(...pr.values(), 1e-9);
    for (const [k, v] of pr) graphByFile.set(k, v / maxPr);
  }

  const byId = new Map(docs.map((d) => [d.id, d]));
  const ranked: Ranked[] = [];
  for (const [id, lex] of lexical) {
    const doc = byId.get(id)!;
    const g = graphByFile.get(doc.fileKey) ?? 0;
    const bonus = opts.currentId === id ? 0.25 : 0;
    ranked.push({ doc, lexical: lex, graph: g, score: lex / maxLex + 0.25 * g + bonus });
  }
  ranked.sort((a, b) => b.score - a.score || a.doc.path.localeCompare(b.doc.path));

  // token budget + per-file diversity (max 2 chunks of the same file so one big file cannot fill the context)
  const limit = opts.limit ?? 5, budget = opts.budgetTokens ?? 3000, maxChars = opts.maxCharsPerDoc ?? 2500;
  const out: Ranked[] = [];
  const perFile = new Map<string, number>();
  let used = 0;
  for (const r of ranked) {
    if (out.length >= limit) break;
    if ((perFile.get(r.doc.fileKey) ?? 0) >= 2) continue;
    const cost = Math.ceil(Math.min(r.doc.body.length, maxChars) / 4);
    if (used + cost > budget && out.length > 0) continue;
    used += cost;
    perFile.set(r.doc.fileKey, (perFile.get(r.doc.fileKey) ?? 0) + 1);
    out.push(r);
  }
  return out;
}
