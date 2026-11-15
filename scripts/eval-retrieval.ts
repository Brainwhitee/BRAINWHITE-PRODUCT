// Retrieval eval (no DB, no network): builds chunks + import graph for this repo's src/ in memory, then compares the
// OLD keyword scorer (copied from the previous retrieve.ts) against the new ranker on saved questions.
//   npm run eval:retrieval           prints per-question rank of the expected file and top-1 / top-3 hit rates
// Expected files were written by hand from the repo layout, not taken from either scorer's output.
import fs from "fs";
import path from "path";
import { loadSource } from "../src/lib/analyser/source";
import { languageOf, makeFilter } from "../src/lib/analyser/filter";
import { isParsable, parseSource } from "../src/lib/analyser/parse";
import { buildChunks } from "../src/lib/analyser/chunk";
import { createResolver } from "../src/lib/analyser/resolve-ts";
import { rankDocs, queryTerms, type RankDoc } from "../src/lib/domain/rank";

process.env.ALLOW_LOCAL_REPOS = "true";

import { QUESTIONS } from "./retrieval-questions";

const EXCLUDE = new Set(["src/lib/domain/rank.ts", "src/lib/domain/retrieve.ts"]);

// ---- OLD scorer (verbatim logic of the previous retrieve.ts) ----
const OLD_STOP = new Set(["the", "and", "for", "how", "what", "why", "does", "this", "that", "with", "from", "are", "can", "where", "which", "about", "into", "use", "used", "its", "has", "have", "you", "your", "was", "when", "who"]);
const oldTokens = (q: string) => [...new Set(q.toLowerCase().split(/[^a-z0-9_]+/).filter((t) => t.length >= 3 && !OLD_STOP.has(t)))];
function oldRank(chunks: { path: string; title: string; summary: string; body: string }[], q: string) {
  const tokens = oldTokens(q);
  const scored: { path: string; score: number }[] = [];
  for (const c of chunks) {
    const lower = c.body.toLowerCase();
    let score = 0;
    for (const t of tokens) {
      if (c.title.toLowerCase().includes(t)) score += 4;
      if (c.path.toLowerCase().includes(t)) score += 2;
      if (c.summary.toLowerCase().includes(t)) score += 1;
      score += Math.min(lower.split(t).length - 1, 5);
    }
    if (score > 0) scored.push({ path: c.path, score });
  }
  return scored.sort((a, b) => b.score - a.score);
}

async function main() {
  const root = path.resolve(__dirname, "..");
  const src = await loadSource("local", root, "main");
  try {
    const readText = async (p: string) => fs.promises.readFile(`${src.root}/${p}`, "utf8").catch(() => "");
    const filter = makeFilter(await readText(".gitignore"), await readText(".brainwhiteignore"));
    const files: { path: string; lang: string; content: string }[] = [];
    for (const f of src.files) {
      if (filter(f.path, f.size) || !f.path.startsWith("src/")) continue;
      const content = await fs.promises.readFile(f.abs, "utf8").catch(() => "");
      if (content && !content.includes("\u0000")) files.push({ path: f.path, lang: languageOf(f.path), content });
    }
    const all = new Set(files.map((f) => f.path));
    const contentOf = new Map(files.map((f) => [f.path, f.content]));
    const resolve = createResolver(all, (p) => contentOf.get(p));

    const chunks: { path: string; title: string; summary: string; body: string }[] = [];
    const edges: [string, string][] = [];
    for (const f of files) {
      const parsed = isParsable(f.lang) ? await parseSource(f.lang, f.content).catch(() => null) : null;
      for (const spec of parsed?.imports ?? []) {
        const r = resolve(f.path, spec, f.lang);
        if (r.kind === "internal") edges.push([f.path, r.target]);
      }
      if (EXCLUDE.has(f.path)) continue;
      const lines = f.content.split("\n");
      for (const c of buildChunks("eval", f.path, f.content, parsed?.symbols ?? []))
        chunks.push({ path: f.path, title: c.title, summary: "", body: lines.slice(c.startLine - 1, c.endLine).join("\n") });
    }
    const docs: RankDoc[] = chunks.map((c, i) => ({ id: String(i), fileKey: c.path, path: c.path, title: c.title, summary: c.summary, body: c.body }));
    console.log(`Corpus: ${files.length} files, ${chunks.length} chunks, ${edges.length} import edges\n`);

    const firstRank = (paths: string[], expect: string[]) => {
      const seen: string[] = [];
      for (const p of paths) if (!seen.includes(p)) seen.push(p);
      const i = seen.findIndex((p) => expect.includes(p));
      return i < 0 ? null : i + 1;
    };
    const stats = { old: [0, 0], neu: [0, 0] }; // [top1, top3]
    console.log("old  new   question");
    for (const { q, expect } of QUESTIONS) {
      const o = firstRank(oldRank(chunks, q).map((x) => x.path), expect);
      // compare on distinct files at limit 5 chunks (same as chat); rank = position among distinct files returned
      const n = firstRank(rankDocs(docs, q, { edges, limit: 5 }).map((x) => x.doc.path), expect);
      if (o === 1) stats.old[0]++;
      if (o && o <= 3) stats.old[1]++;
      if (n === 1) stats.neu[0]++;
      if (n && n <= 3) stats.neu[1]++;
      console.log(`${String(o ?? "-").padStart(3)}  ${String(n ?? "-").padStart(3)}   ${q}`);
    }
    const N = QUESTIONS.length;
    console.log(`\nTop-1: old ${stats.old[0]}/${N}   new ${stats.neu[0]}/${N}`);
    console.log(`Top-3: old ${stats.old[1]}/${N}   new ${stats.neu[1]}/${N}`);
    console.log(`(queryTerms example: ${JSON.stringify(queryTerms(QUESTIONS[0].q))})`);
  } finally {
    await src.cleanup();
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
