// Layered left-to-right layout for the node canvas (pure: no DOM, no React). Tested in scripts/flowlayout.test.ts.
// Boxes have their own width and height (a module card grows when expanded). Edges point right: a box is placed to the
// right of everything that points at it, so "who depends on whom" reads like a workflow from left to right.
//  1. cycles (legal in import graphs) are broken at the back edge found by DFS, for ranking only
//  2. longest-path layering gives every box a column
//  3. a few barycenter sweeps order the boxes inside each column to reduce edge crossings
//  4. columns are spaced by their widest box; boxes in a column are stacked and the column is centred vertically

export type FlowNodeIn = { id: string; w: number; h: number };
export type FlowEdgeIn = { from: string; to: string };
export type FlowPlaced = { id: string; x: number; y: number; w: number; h: number; layer: number };
export type FlowResult = { placed: Map<string, FlowPlaced>; width: number; height: number; layers: number };

export function flowLayout(nodes: FlowNodeIn[], edges: FlowEdgeIn[], opt: { gapX?: number; gapY?: number; sweeps?: number } = {}): FlowResult {
  const gapX = opt.gapX ?? 110, gapY = opt.gapY ?? 28, sweeps = opt.sweeps ?? 6;
  const ids = new Set(nodes.map((n) => n.id));
  const out = new Map<string, Set<string>>(), inn = new Map<string, Set<string>>();
  for (const n of nodes) { out.set(n.id, new Set()); inn.set(n.id, new Set()); }
  for (const e of edges) if (e.from !== e.to && ids.has(e.from) && ids.has(e.to)) { out.get(e.from)!.add(e.to); inn.get(e.to)!.add(e.from); }

  // 1. break cycles: edges that point back at a node still on the DFS stack are ignored for ranking
  const state = new Map<string, 1 | 2>();
  const fwdPreds = new Map<string, string[]>(nodes.map((n) => [n.id, []]));
  const visit = (u: string) => {
    state.set(u, 1);
    for (const v of [...out.get(u)!].sort()) {
      if (state.get(v) === 1) continue;
      fwdPreds.get(v)!.push(u);
      if (!state.has(v)) visit(v);
    }
    state.set(u, 2);
  };
  // start from nodes nothing points at, so entry points define the left edge
  const roots = nodes.filter((n) => inn.get(n.id)!.size === 0).map((n) => n.id).sort();
  for (const r of roots) if (!state.has(r)) visit(r);
  for (const n of [...nodes].sort((a, b) => a.id.localeCompare(b.id))) if (!state.has(n.id)) visit(n.id);

  // 2. longest-path layering
  const layer = new Map<string, number>();
  const rank = (u: string): number => {
    const known = layer.get(u);
    if (known !== undefined) return known;
    let r = 0;
    for (const p of fwdPreds.get(u)!) r = Math.max(r, rank(p) + 1);
    layer.set(u, r);
    return r;
  };
  for (const n of nodes) rank(n.id);
  const nLayers = nodes.length ? Math.max(...layer.values()) + 1 : 0;

  // 3. ordering inside columns
  const cols: string[][] = Array.from({ length: nLayers }, () => []);
  for (const n of [...nodes].sort((a, b) => a.id.localeCompare(b.id))) cols[layer.get(n.id)!].push(n.id);
  const pos = new Map<string, number>();
  const reindex = () => cols.forEach((c) => c.forEach((id, i) => pos.set(id, i)));
  reindex();
  const bary = (id: string, neighbours: Set<string>, wantLayer: number): number | null => {
    const xs = [...neighbours].filter((x) => layer.get(x) === wantLayer).map((x) => pos.get(x)!);
    return xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null;
  };
  for (let s = 0; s < sweeps; s++) {
    const down = s % 2 === 0;
    for (let k = down ? 1 : nLayers - 2; down ? k < nLayers : k >= 0; k += down ? 1 : -1) {
      const keyed = cols[k].map((id, i) => ({ id, i, b: bary(id, down ? inn.get(id)! : out.get(id)!, down ? k - 1 : k + 1) }));
      keyed.sort((a, b) => (a.b ?? a.i) - (b.b ?? b.i) || a.i - b.i);
      cols[k] = keyed.map((x) => x.id);
      cols[k].forEach((id, i) => pos.set(id, i));
    }
  }

  // 4. coordinates
  const size = new Map(nodes.map((n) => [n.id, n]));
  const colW = cols.map((c) => Math.max(0, ...c.map((id) => size.get(id)!.w)));
  const colH = cols.map((c) => c.reduce((h, id) => h + size.get(id)!.h, 0) + Math.max(0, c.length - 1) * gapY);
  const height = Math.max(0, ...colH);
  const placed = new Map<string, FlowPlaced>();
  let x = 0;
  cols.forEach((c, li) => {
    let y = (height - colH[li]) / 2;
    for (const id of c) {
      const n = size.get(id)!;
      placed.set(id, { id, x, y, w: n.w, h: n.h, layer: li });
      y += n.h + gapY;
    }
    x += colW[li] + gapX;
  });
  return { placed, width: Math.max(0, x - gapX), height, layers: nLayers };
}

// Smooth connector between two ports (n8n style): leaves horizontally, arrives horizontally.
export function connectorPath(x1: number, y1: number, x2: number, y2: number): string {
  const dx = Math.max(48, Math.abs(x2 - x1) * 0.5);
  return `M${x1} ${y1} C${x1 + dx} ${y1} ${x2 - dx} ${y2} ${x2} ${y2}`;
}

// Point on that connector at t (0..1), used to place a count label on the line.
export function connectorPoint(x1: number, y1: number, x2: number, y2: number, t = 0.5): { x: number; y: number } {
  const dx = Math.max(48, Math.abs(x2 - x1) * 0.5);
  const c1x = x1 + dx, c2x = x2 - dx;
  const m = 1 - t;
  return {
    x: m * m * m * x1 + 3 * m * m * t * c1x + 3 * m * t * t * c2x + t * t * t * x2,
    y: m * m * m * y1 + 3 * m * m * t * y1 + 3 * m * t * t * y2 + t * t * t * y2,
  };
}
