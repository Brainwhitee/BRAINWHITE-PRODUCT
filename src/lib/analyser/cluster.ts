import { modulePathFor } from "./modules";

// Module detection (CBA-08), second pass. Folders stay the starting point (they are what developers expect),
// but a folder that holds too many files is split: first by its sub-folders, then, if it is one flat folder,
// along the import graph (label propagation). If a split would not give real groups, the folder is left alone.
// Everything is deterministic: the same files and edges always produce the same modules.

export type FileGraph = Map<string, Set<string>>; // file -> files it imports

export const MAX_MODULE_FILES = 30;
export const MIN_GROUP_FILES = 3;
const MAX_DEPTH = 3;

const stemOf = (p: string) => (p.split("/").pop() ?? p).replace(/\.[^.]+$/, "");

export function assignModules(files: string[], graph: FileGraph, opts: { max?: number; min?: number } = {}): Map<string, string> {
  const max = opts.max ?? MAX_MODULE_FILES;
  const min = opts.min ?? MIN_GROUP_FILES;

  // undirected weighted adjacency, built once
  const adj = new Map<string, Map<string, number>>();
  const link = (a: string, b: string) => {
    if (!adj.has(a)) adj.set(a, new Map());
    adj.get(a)!.set(b, (adj.get(a)!.get(b) ?? 0) + 1);
  };
  for (const [from, tos] of graph) for (const to of tos) if (from !== to) { link(from, to); link(to, from); }

  const result = new Map<string, string>();
  const byFolder = new Map<string, string[]>();
  for (const f of [...files].sort()) {
    const m = modulePathFor(f);
    if (!byFolder.has(m)) byFolder.set(m, []);
    byFolder.get(m)!.push(f);
  }
  for (const [mod, group] of byFolder) {
    const parts = group.length > max && mod !== "." ? refine(mod, group, 0) : new Map([[mod, group]]);
    for (const [m, fs] of parts) for (const f of fs) result.set(f, m);
  }
  return result;

  function refine(dir: string, group: string[], depth: number): Map<string, string[]> {
    const keep = new Map([[dir, group]]);
    if (depth >= MAX_DEPTH) return keep;

    // 1) split by the next folder level
    const prefix = dir + "/";
    const subs = new Map<string, string[]>();
    for (const f of group) {
      const rest = f.slice(prefix.length);
      const key = rest.includes("/") ? `${dir}/${rest.split("/")[0]}` : dir;
      if (!subs.has(key)) subs.set(key, []);
      subs.get(key)!.push(f);
    }
    if (subs.size > 1) {
      const out = new Map<string, string[]>();
      const misc: string[] = [];
      for (const [key, fs] of subs) {
        if (fs.length < min) { misc.push(...fs); continue; }
        if (fs.length > max && key !== dir) for (const [k, v] of refine(key, fs, depth + 1)) out.set(k, v);
        else out.set(key, fs);
      }
      if (misc.length) {
        // tiny sub-folders are folded into the folder's own files if it has a module, otherwise into "other"
        if (out.has(dir)) out.get(dir)!.push(...misc); else out.set(`${dir}~misc`, misc);
      }
      return out.size > 1 ? out : keep;
    }

    // 2) flat folder: cluster along the import graph
    return clusterByGraph(dir, group) ?? keep;
  }

  function clusterByGraph(dir: string, group: string[]): Map<string, string[]> | null {
    const inGroup = new Set(group);
    const sorted = [...group].sort();
    const label = new Map(sorted.map((f) => [f, f]));
    for (let round = 0; round < 12; round++) {
      let changed = false;
      for (const f of sorted) {
        const score = new Map<string, number>();
        for (const [n, w] of adj.get(f) ?? []) if (inGroup.has(n)) score.set(label.get(n)!, (score.get(label.get(n)!) ?? 0) + w);
        if (!score.size) continue;
        let best = label.get(f)!, bestW = score.get(best) ?? 0;
        for (const [l, w] of [...score].sort((a, b) => (a[0] < b[0] ? -1 : 1))) if (w > bestW) { best = l; bestW = w; }
        if (best !== label.get(f)) { label.set(f, best); changed = true; }
      }
      if (!changed) break;
    }
    const clusters = new Map<string, string[]>();
    for (const f of sorted) {
      const l = label.get(f)!;
      if (!clusters.has(l)) clusters.set(l, []);
      clusters.get(l)!.push(f);
    }
    // fold tiny clusters into the neighbouring cluster they are most connected to, else into "other"
    const big = [...clusters.values()].filter((c) => c.length >= min);
    if (big.length < 2) return null; // no real structure: keep the folder as one module
    const owner = new Map<string, number>();
    big.forEach((c, i) => c.forEach((f) => owner.set(f, i)));
    const parts = big.map((c) => [...c]);
    const misc: string[] = [];
    for (const c of clusters.values()) {
      if (c.length >= min) continue;
      for (const f of c) {
        const votes = new Map<number, number>();
        for (const [n, w] of adj.get(f) ?? []) if (owner.has(n)) votes.set(owner.get(n)!, (votes.get(owner.get(n)!) ?? 0) + w);
        const top = [...votes].sort((a, b) => b[1] - a[1] || a[0] - b[0])[0];
        if (top) parts[top[0]].push(f); else misc.push(f);
      }
    }
    // name each cluster after its most connected file
    const out = new Map<string, string[]>();
    for (const part of parts) {
      const inside = new Set(part);
      const anchor = [...part].sort((a, b) => degree(b, inside) - degree(a, inside) || (a < b ? -1 : 1))[0];
      let key = `${dir}~${stemOf(anchor)}`;
      for (let n = 2; out.has(key); n++) key = `${dir}~${stemOf(anchor)}-${n}`;
      out.set(key, part);
    }
    if (misc.length) out.set(`${dir}~misc`, misc);
    return out;
  }

  function degree(f: string, inside: Set<string>) {
    let d = 0;
    for (const [n, w] of adj.get(f) ?? []) if (inside.has(n)) d += w;
    return d;
  }
}
