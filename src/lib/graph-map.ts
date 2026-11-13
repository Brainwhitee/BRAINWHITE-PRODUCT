import { db } from "./db";
import type { MapData, MapEdge, MapNode } from "./graph";
import { lessonOrder } from "./learning-order";

const MAP_MAX_NODES = 800;
const MAP_MAX_EDGES = 8000;
const MAP_TYPES = ["IMPORTS", "CALLS", "REFERENCES", "EXTENDS", "IMPLEMENTS"];

type RawEdge = { fromId: string; toId: string; type: string; fromKind: string; toKind: string; confidence?: string; weight?: number };

// confidence/weight are newer columns: fall back so the map still loads before the schema push.
async function loadEdgesAll(repoId: string): Promise<RawEdge[]> {
  const base = { fromId: true, toId: true, type: true, fromKind: true, toKind: true } as const;
  try {
    return await db.graphEdge.findMany({ where: { repoId, type: { in: MAP_TYPES } }, take: MAP_MAX_EDGES, select: { ...base, confidence: true, weight: true } });
  } catch {
    return db.graphEdge.findMany({ where: { repoId, type: { in: MAP_TYPES } }, take: MAP_MAX_EDGES, select: base });
  }
}

// Whole repo at file level. File->file IMPORTS as stored; symbol edges (calls, references, extends, implements) are
// folded onto their files, so every kind of connection appears between the same file nodes.
// Caller must have checked org access to repoId.
export async function loadMap(repoId: string): Promise<MapData> {
  const [files, modules] = await Promise.all([
    db.file.findMany({ where: { repoId, deletedAt: null }, select: { id: true, path: true, moduleId: true, lineCount: true, summary: true } }),
    db.module.findMany({ where: { repoId }, include: { _count: { select: { files: true } } }, orderBy: { path: "asc" } }),
  ]);
  const fileIds = new Set(files.map((f) => f.id));
  const raw = await loadEdgesAll(repoId);
  const syms = await db.symbol.findMany({ where: { file: { repoId } }, select: { id: true, fileId: true } });
  const fileOfSym = new Map(syms.map((s) => [s.id, s.fileId]));
  const fileOf = (kind: string, id: string) => (kind === "symbol" ? fileOfSym.get(id) : kind === "file" ? id : undefined);

  const agg = new Map<string, MapEdge>();
  for (const e of raw) {
    const a = fileOf(e.fromKind, e.fromId), b = fileOf(e.toKind, e.toId);
    if (!a || !b || a === b || !fileIds.has(a) || !fileIds.has(b)) continue;
    const k = `${a}|${b}|${e.type}`;
    const cur = agg.get(k) ?? { from: a, to: b, type: e.type, count: 0, heuristic: 0 };
    cur.count += e.weight ?? 1;
    if (e.confidence === "NAME_MATCH") cur.heuristic += e.weight ?? 1;
    agg.set(k, cur);
  }
  const edges = [...agg.values()];
  const inC = new Map<string, number>(), outC = new Map<string, number>();
  for (const e of edges) {
    outC.set(e.from, (outC.get(e.from) ?? 0) + 1);
    inC.set(e.to, (inC.get(e.to) ?? 0) + 1);
  }

  const degree = (id: string) => (inC.get(id) ?? 0) + (outC.get(id) ?? 0);
  const ranked = [...files].sort((a, b) => degree(b.id) - degree(a.id) || a.path.localeCompare(b.path));
  const keep = new Set(ranked.slice(0, MAP_MAX_NODES).map((f) => f.id));
  const truncated = files.length > MAP_MAX_NODES;
  const notes: string[] = [];
  if (truncated) notes.push(`Showing the ${MAP_MAX_NODES} most connected of ${files.length} files.`);
  if (!files.length) notes.push("No files yet. Run a sync for this repository first.");
  else if (!edges.some((e) => e.type !== "IMPORTS")) notes.push("No call/reference edges stored for this repository yet. Re-sync to build them (JavaScript/TypeScript only).");
  if (raw.length >= MAP_MAX_EDGES) notes.push("Edge limit reached: some connections are not shown.");

  const nodes: MapNode[] = files
    .filter((f) => keep.has(f.id))
    .map((f) => ({
      id: f.id, path: f.path, label: f.path.split("/").pop() ?? f.path, moduleId: f.moduleId ?? "none", lineCount: f.lineCount,
      summary: f.summary.slice(0, 300), inCount: inC.get(f.id) ?? 0, outCount: outC.get(f.id) ?? 0,
    }));
  const shownMods = new Set(nodes.map((n) => n.moduleId));
  return {
    repoId, nodes, edges: edges.filter((e) => keep.has(e.from) && keep.has(e.to)),
    modules: modules.filter((m) => shownMods.has(m.id)).map((m) => ({ id: m.id, name: m.name, files: m._count.files })),
    notes, truncated, totalFiles: files.length,
  };
}

// Which files of this repo the candidate's path teaches, and whether the item is completed. Caller must own the assignment.
export async function loadLearningOverlay(assignmentId: string, repoId: string): Promise<{ status: Record<string, "done" | "todo">; order: Record<string, number> }> {
  const a = await db.assignment.findUnique({
    where: { id: assignmentId },
    include: { path: { include: { sections: { orderBy: { order: "asc" }, include: { items: { orderBy: { order: "asc" } } } } } }, progress: true },
  });
  if (!a) return { status: {}, order: {} };
  const done = new Set(a.progress.filter((p) => p.type === "COMPLETED").map((p) => p.itemId));
  const items = a.path.sections.flatMap((s) => s.items.map((i) => ({ ...i, sectionOrder: s.order }))).filter((i) => i.type === "CHUNK" && i.refId);
  const chunks = await db.chunk.findMany({ where: { repoId, id: { in: items.map((i) => i.refId!) } }, select: { id: true, filePath: true } });
  const pathOf = new Map(chunks.map((c) => [c.id, c.filePath]));
  const files = await db.file.findMany({ where: { repoId, path: { in: [...new Set(chunks.map((c) => c.filePath))] } }, select: { id: true, path: true } });
  const idOf = new Map(files.map((f) => [f.path, f.id]));
  const out: Record<string, "done" | "todo"> = {};
  for (const i of items) {
    const p = pathOf.get(i.refId!), id = p ? idOf.get(p) : undefined;
    if (!id) continue;
    if (!done.has(i.id)) out[id] = "todo";
    else if (!out[id]) out[id] = "done";
  }
  const order = lessonOrder(items.map((i) => ({ sectionOrder: i.sectionOrder, order: i.order, fileId: idOf.get(pathOf.get(i.refId!) ?? "") ?? null })));
  return { status: out, order };
}

// Repositories a candidate's assignment teaches (via its CHUNK items), for the learner dashboard.
export async function reposForAssignment(assignmentId: string): Promise<{ id: string; name: string }[]> {
  const a = await db.assignment.findUnique({
    where: { id: assignmentId },
    include: { path: { include: { sections: { include: { items: { select: { type: true, refId: true } } } } } } },
  });
  if (!a) return [];
  const ids = a.path.sections.flatMap((s) => s.items).filter((i) => i.type === "CHUNK" && i.refId).map((i) => i.refId!);
  if (!ids.length) return [];
  const chunks = await db.chunk.findMany({ where: { id: { in: ids } }, select: { repoId: true }, distinct: ["repoId"] });
  return db.repository.findMany({ where: { id: { in: chunks.map((c) => c.repoId) }, orgId: a.orgId }, select: { id: true, name: true } });
}
