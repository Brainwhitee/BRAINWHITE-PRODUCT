import { db } from "./db";
import type { GEdge, GNode, GraphData, GraphLevel } from "./graph";

const MAX_EDGES = 600;
const SYMBOL_EDGE_TYPES = ["CALLS", "REFERENCES", "EXTENDS", "IMPLEMENTS"];

type RawEdge = { id: string; fromId: string; toId: string; type: string; fromKind: string; toKind: string; confidence?: string; weight?: number };

// confidence/weight are newer columns. If the database has not got them yet, fall back so the graph still loads.
async function loadEdges(repoId: string, where: object): Promise<RawEdge[]> {
  const base = { id: true, fromId: true, toId: true, type: true, fromKind: true, toKind: true } as const;
  try {
    return await db.graphEdge.findMany({ where: { repoId, ...where }, take: MAX_EDGES, select: { ...base, confidence: true, weight: true } });
  } catch {
    return db.graphEdge.findMany({ where: { repoId, ...where }, take: MAX_EDGES, select: base });
  }
}
const toEdge = (e: RawEdge): GEdge => ({ id: e.id, from: e.fromId, to: e.toId, type: e.type, confidence: e.confidence === "NAME_MATCH" ? "NAME_MATCH" : "EXACT", weight: e.weight ?? 1 });
const short = (p: string) => p.split("/").slice(-2).join("/");

async function callEdgeLangs(repoId: string): Promise<string[] | null> {
  try {
    const r = await db.repository.findUnique({ where: { id: repoId }, select: { graphCoverage: true } });
    return (JSON.parse(r?.graphCoverage ?? "{}") as { callEdges?: string[] }).callEdges ?? null;
  } catch {
    return null; // column missing (schema not pushed) or bad JSON
  }
}

// module level: all modules. file level: files of one module plus the files they touch outside it.
// symbol level: symbols of one file plus the symbols/files that call or reference them. Caller must have checked org access to repoId.
export async function loadGraph(repoId: string, level: GraphLevel, focus: string | null): Promise<GraphData | null> {
  const notes: string[] = [];

  if (level === "module") {
    const mods = await db.module.findMany({ where: { repoId }, include: { _count: { select: { files: true } } }, orderBy: { path: "asc" } });
    const ids = new Set(mods.map((m) => m.id));
    const edges = (await loadEdges(repoId, { type: "DEPENDS_ON" })).filter((e) => ids.has(e.fromId) && ids.has(e.toId));
    const nodes: GNode[] = mods.map((m) => ({ id: m.id, label: m.name, sub: `${m._count.files} files`, kind: "module", size: m._count.files, drill: { level: "file", focus: m.id } }));
    if (!nodes.length) notes.push("No modules yet. Run a sync for this repository first.");
    return { level, focus: null, title: "Modules", nodes, edges: edges.map(toEdge), notes };
  }

  if (level === "file") {
    const mod = focus ? await db.module.findFirst({ where: { id: focus, repoId } }) : null;
    if (!mod) return null;
    const files = await db.file.findMany({ where: { repoId, moduleId: mod.id }, select: { id: true, path: true, lineCount: true } });
    const inside = new Set(files.map((f) => f.id));
    const all = await loadEdges(repoId, { type: "IMPORTS", OR: [{ fromId: { in: [...inside] } }, { toId: { in: [...inside] } }] });
    const outsideIds = [...new Set(all.flatMap((e) => [e.fromId, e.toId]).filter((id) => !inside.has(id)))];
    const outside = outsideIds.length ? await db.file.findMany({ where: { repoId, id: { in: outsideIds } }, select: { id: true, path: true, moduleId: true } }) : [];
    const nodes: GNode[] = [
      ...files.map((f): GNode => ({ id: f.id, label: short(f.path), sub: `${f.lineCount} lines`, kind: "file", size: f.lineCount, filePath: f.path, drill: { level: "symbol", focus: f.id } })),
      ...outside.map((f): GNode => ({ id: f.id, label: short(f.path), sub: "outside this module", kind: "file", outside: true, filePath: f.path, drill: f.moduleId ? { level: "file", focus: f.moduleId } : undefined })),
    ];
    return { level, focus: mod.id, title: `Module: ${mod.name}`, nodes, edges: all.map(toEdge), notes };
  }

  const file = focus ? await db.file.findFirst({ where: { id: focus, repoId }, select: { id: true, path: true } }) : null;
  if (!file) return null;
  const syms = await db.symbol.findMany({ where: { fileId: file.id }, orderBy: { startLine: "asc" } });
  const mine = new Set(syms.map((s) => s.id));
  const all = mine.size ? await loadEdges(repoId, { type: { in: SYMBOL_EDGE_TYPES }, OR: [{ fromId: { in: [...mine] } }, { toId: { in: [...mine] } }] }) : [];
  const otherSymIds = [...new Set(all.flatMap((e) => (e.fromKind === "symbol" ? [e.fromId, e.toId] : [e.toId])).filter((id) => !mine.has(id)))];
  const others = otherSymIds.length ? await db.symbol.findMany({ where: { id: { in: otherSymIds } }, include: { file: { select: { path: true } } } }) : [];
  const topIds = [...new Set(all.filter((e) => e.fromKind === "file").map((e) => e.fromId))];
  const topFiles = topIds.length ? await db.file.findMany({ where: { id: { in: topIds } }, select: { id: true, path: true } }) : [];
  const nodes: GNode[] = [
    ...syms.map((s): GNode => ({ id: s.id, label: s.name, sub: `${s.kind} · lines ${s.startLine}-${s.endLine}`, kind: "symbol", filePath: file.path, startLine: s.startLine, endLine: s.endLine })),
    ...others.map((s): GNode => ({ id: s.id, label: s.name, sub: s.file.path, kind: "symbol", outside: true, filePath: s.file.path, startLine: s.startLine, endLine: s.endLine })),
    ...topFiles.map((f): GNode => ({ id: f.id, label: f.path.split("/").pop() ?? f.path, sub: "top-level code", kind: "file", outside: true, filePath: f.path })),
  ];
  const known = new Set(nodes.map((n) => n.id));

  const cov = await callEdgeLangs(repoId);
  const isJsTs = /\.(tsx?|jsx?|mjs|cjs)$/.test(file.path);
  if (!isJsTs) notes.push("Call edges exist only for JavaScript/TypeScript so far. An empty graph here does NOT mean nobody calls these symbols.");
  else if (!cov?.length && !all.length) notes.push("No call edges stored. Re-sync this repository to build them.");
  else if (!all.length) notes.push("No callers or callees found for the symbols in this file.");
  if (all.some((e) => e.confidence === "NAME_MATCH")) notes.push("Dashed edges are heuristic name matches, not proven.");
  return { level, focus: file.id, title: `File: ${file.path}`, nodes, edges: all.filter((e) => known.has(e.fromId) && known.has(e.toId)).map(toEdge), notes };
}
