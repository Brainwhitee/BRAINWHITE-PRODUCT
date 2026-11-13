import { db } from "../db";
import type { SuggestInput } from "./path-suggest";

// Loads what suggestPath() needs for one repository. Caller must have checked org access to repoId.
export async function loadSuggestInput(repoId: string): Promise<SuggestInput> {
  const [modules, chunks, deps, fanIn] = await Promise.all([
    db.module.findMany({ where: { repoId }, include: { _count: { select: { files: true } } } }),
    db.chunk.findMany({ where: { repoId, status: { not: "DEPRECATED" } }, select: { id: true, moduleId: true, filePath: true, title: true, startLine: true, endLine: true, estMinutes: true } }),
    db.graphEdge.findMany({ where: { repoId, type: "DEPENDS_ON" }, select: { fromId: true, toId: true } }),
    db.graphEdge.groupBy({ by: ["toId"], where: { repoId, type: "IMPORTS" }, _count: { _all: true } }),
  ]);
  const files = fanIn.length ? await db.file.findMany({ where: { repoId, id: { in: fanIn.map((f) => f.toId) } }, select: { id: true, path: true } }) : [];
  const pathOf = new Map(files.map((f) => [f.id, f.path]));
  const fileFanIn: Record<string, number> = {};
  for (const f of fanIn) { const p = pathOf.get(f.toId); if (p) fileFanIn[p] = f._count._all; }
  return {
    modules: modules.map((m) => ({ id: m.id, name: m.name, path: m.path, files: m._count.files, summary: m.summary })),
    moduleEdges: deps.map((e) => ({ from: e.fromId, to: e.toId })),
    chunks, fileFanIn,
  };
}
