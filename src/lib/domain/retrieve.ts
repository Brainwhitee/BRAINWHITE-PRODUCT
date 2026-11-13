import { Prisma } from "@prisma/client";
import { db } from "../db";
import { queryTerms, rankDocs, type RankDoc } from "./rank";

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

export const tokenize = queryTerms;

// Retrieval v2: Postgres narrows the candidates (ILIKE on file path/content and chunk title/summary, so file
// bodies of unrelated files never leave the database), then rank.ts scores them (BM25 + import-graph boost +
// token budget). Org-scoped (AI-07: never cross org). No schema change needed; a tsvector/GIN index can replace
// the ILIKE prefilter later without touching the ranker.
const MAX_FILES = 300;
const MAX_CHUNKS = 600;

export async function retrieve(orgId: string, question: string, opts: { currentChunkId?: string | null; limit?: number } = {}): Promise<Snippet[]> {
  const tokens = tokenize(question);
  if (tokens.length === 0) return [];
  const pats = tokens.map((t) => `%${t}%`);

  const current = opts.currentChunkId ? await db.chunk.findFirst({ where: { id: opts.currentChunkId, module: { repo: { orgId } } } }) : null;

  const hitFiles = await db.$queryRaw<{ id: string; repoId: string; path: string }[]>(Prisma.sql`
    SELECT f."id", f."repoId", f."path" FROM "File" f JOIN "Repository" r ON r."id" = f."repoId"
    WHERE r."orgId" = ${orgId} AND f."deletedAt" IS NULL AND (f."path" ILIKE ANY(${pats}) OR f."content" ILIKE ANY(${pats}))
    LIMIT ${MAX_FILES}`);
  const fileKeys = new Set(hitFiles.map((f) => `${f.repoId}|${f.path}`));
  if (current) fileKeys.add(`${current.repoId}|${current.filePath}`);

  const chunkWhere: Prisma.ChunkWhereInput[] = [
    ...tokens.map((t) => ({ title: { contains: t, mode: "insensitive" as const } })),
    ...tokens.map((t) => ({ summary: { contains: t, mode: "insensitive" as const } })),
  ];
  const pathPairs = [...fileKeys].map((k) => { const [repoId, filePath] = k.split("|"); return { repoId, filePath }; });
  const chunks = await db.chunk.findMany({
    where: { module: { repo: { orgId } }, status: { not: "DEPRECATED" }, OR: [...chunkWhere, ...pathPairs] },
    take: MAX_CHUNKS,
  });
  if (current && !chunks.some((c) => c.id === current.id)) chunks.push(current);

  const repoIds = [...new Set(chunks.map((c) => c.repoId))];
  const wantedPaths = [...new Set(chunks.map((c) => c.filePath))];
  const files = repoIds.length
    ? await db.file.findMany({ where: { repoId: { in: repoIds }, path: { in: wantedPaths }, deletedAt: null }, select: { id: true, repoId: true, path: true, content: true } })
    : [];
  const fileByKey = new Map(files.map((f) => [`${f.repoId}|${f.path}`, f]));

  const meta = new Map<string, Snippet>();
  const docs: RankDoc[] = [];
  for (const c of chunks) {
    const f = fileByKey.get(`${c.repoId}|${c.filePath}`);
    if (!f) continue;
    const body = f.content.split("\n").slice(c.startLine - 1, c.endLine).join("\n");
    docs.push({ id: c.id, fileKey: f.id, path: c.filePath, title: c.title, summary: c.summary, body });
    meta.set(c.id, { n: 0, kind: "code", repoId: c.repoId, path: c.filePath, start: c.startLine, end: c.endLine, title: c.title, text: "", score: 0 });
  }

  const handouts = await db.handout.findMany({ where: { orgId, extractedText: { not: "" } }, select: { id: true, filename: true, extractedText: true } });
  for (const h of handouts) {
    const id = "handout:" + h.id;
    docs.push({ id, fileKey: id, path: h.filename, title: h.filename, summary: "", body: h.extractedText.slice(0, 6000) });
    meta.set(id, { n: 0, kind: "handout", path: h.filename, start: 1, end: 1, title: h.filename, text: "", score: 0 });
  }

  // import edges touching the candidate files (graph boost); nodes are File ids
  const fileIds = files.map((f) => f.id);
  const edgeRows = fileIds.length
    ? await db.graphEdge.findMany({ where: { repoId: { in: repoIds }, type: "IMPORTS", OR: [{ fromId: { in: fileIds } }, { toId: { in: fileIds } }] }, select: { fromId: true, toId: true }, take: 5000 })
    : [];

  return rankDocs(docs, question, { currentId: current?.id, edges: edgeRows.map((e) => [e.fromId, e.toId]), limit: opts.limit ?? 5 }).map((r, i) => ({
    ...meta.get(r.doc.id)!, n: i + 1, text: r.doc.body.slice(0, 2500), score: Math.round(r.score * 100) / 100,
  }));
}
