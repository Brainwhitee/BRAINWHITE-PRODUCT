// Pure graph helpers for the explorer (no DB, no React): shared types and a layered left-to-right layout.
export type GraphLevel = "module" | "file" | "symbol";
export type GNode = {
  id: string; label: string; sub?: string; kind: "module" | "file" | "symbol";
  size?: number;                // files in a module, lines in a file
  outside?: boolean;            // neighbour shown for context, not part of the focus
  filePath?: string; startLine?: number; endLine?: number; // code pane target
  drill?: { level: GraphLevel; focus: string }; // what a double click opens
};
export type GEdge = { id: string; from: string; to: string; type: string; confidence: "EXACT" | "NAME_MATCH"; weight: number };
export type GraphData = { level: GraphLevel; focus: string | null; title: string; nodes: GNode[]; edges: GEdge[]; notes: string[] };
export type Positioned = GNode & { x: number; y: number };

export const NODE_W = 190;
export const NODE_H = 46;
const GAP_X = 90;
const GAP_Y = 26;

// Longest-path layering. Cycles are legal in import graphs, so back edges found by DFS are ignored for ranking only.
export function layoutGraph(nodes: GNode[], edges: GEdge[]): { nodes: Positioned[]; width: number; height: number } {
  const ids = new Set(nodes.map((n) => n.id));
  const out = new Map<string, string[]>();
  for (const n of nodes) out.set(n.id, []);
  for (const e of edges) if (ids.has(e.from) && ids.has(e.to) && e.from !== e.to) out.get(e.from)!.push(e.to);

  const state = new Map<string, 1 | 2>(); // 1 = on stack, 2 = done
  const preds = new Map<string, string[]>(); // forward (non-back) edges, stored by target
  for (const n of nodes) preds.set(n.id, []);
  const visit = (u: string) => {
    state.set(u, 1);
    for (const v of out.get(u)!) {
      if (state.get(v) === 1) continue; // back edge
      preds.get(v)!.push(u);
      if (!state.has(v)) visit(v);
    }
    state.set(u, 2);
  };
  for (const n of nodes) if (!state.has(n.id)) visit(n.id);

  const layer = new Map<string, number>();
  const rank = (u: string): number => {
    if (layer.has(u)) return layer.get(u)!;
    let r = 0;
    for (const p of preds.get(u)!) r = Math.max(r, rank(p) + 1);
    layer.set(u, r);
    return r;
  };
  for (const n of nodes) rank(n.id);

  const cols = new Map<number, GNode[]>();
  for (const n of nodes) {
    const l = layer.get(n.id)!;
    if (!cols.has(l)) cols.set(l, []);
    cols.get(l)!.push(n);
  }
  const placed: Positioned[] = [];
  let height = 0;
  for (const [l, col] of [...cols].sort((a, b) => a[0] - b[0])) {
    col.sort((a, b) => Number(!!a.outside) - Number(!!b.outside) || a.label.localeCompare(b.label));
    col.forEach((n, i) => placed.push({ ...n, x: l * (NODE_W + GAP_X), y: i * (NODE_H + GAP_Y) }));
    height = Math.max(height, col.length * (NODE_H + GAP_Y));
  }
  return { nodes: placed, width: Math.max(cols.size, 1) * (NODE_W + GAP_X) - GAP_X, height };
}

// Order modules / files for a lesson sequence: dependencies first (post-order DFS, cycles broken at the back edge).
export function dependencyOrder(nodes: { id: string }[], edges: { from: string; to: string }[]): string[] {
  const ids = new Set(nodes.map((n) => n.id));
  const deps = new Map<string, string[]>(); // node -> what it depends on
  for (const n of nodes) deps.set(n.id, []);
  for (const e of edges) if (ids.has(e.from) && ids.has(e.to) && e.from !== e.to) deps.get(e.from)!.push(e.to);
  const done = new Set<string>(), onStack = new Set<string>(), order: string[] = [];
  const visit = (u: string) => {
    done.add(u); onStack.add(u);
    for (const v of deps.get(u)!) if (!done.has(v) && !onStack.has(v)) visit(v);
    onStack.delete(u);
    order.push(u);
  };
  for (const n of nodes) if (!done.has(n.id)) visit(n.id);
  return order;
}
