// Pure force-directed layout for the interactive code map (no DOM, no React). Deterministic: positions start on a
// seeded ring, so the same graph always settles the same way and tests are stable.
// Forces: node repulsion, edge springs, a pull toward the node's group (module) centre, and a weak pull to the origin.

export type FNode = { id: string; group: string; r: number; x: number; y: number; vx: number; vy: number; fixed?: boolean };
export type FEdge = { from: string; to: string };

export type ForceOptions = {
  repulsion?: number; spring?: number; springLen?: number; groupPull?: number; gravity?: number; damping?: number;
};

const D: Required<ForceOptions> = { repulsion: 1800, spring: 0.04, springLen: 70, groupPull: 0.03, gravity: 0.004, damping: 0.82 };

// Cheap seeded PRNG so layouts are reproducible.
function rng(seed: number) {
  let s = seed >>> 0 || 1;
  return () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296);
}

export function initNodes(items: { id: string; group: string; r: number }[]): FNode[] {
  const groups = [...new Set(items.map((i) => i.group))].sort();
  const ringR = Math.max(120, groups.length * 38); // big graphs start with clusters further apart
  const centre = new Map(groups.map((g, i) => [g, { x: Math.cos((i / groups.length) * Math.PI * 2) * ringR, y: Math.sin((i / groups.length) * Math.PI * 2) * ringR }]));
  const rand = rng(items.length * 7919 + groups.length);
  return items.map((i) => {
    const c = centre.get(i.group)!;
    return { ...i, x: c.x + (rand() - 0.5) * 60, y: c.y + (rand() - 0.5) * 60, vx: 0, vy: 0 };
  });
}

export function groupCentres(nodes: FNode[]): Map<string, { x: number; y: number; n: number }> {
  const m = new Map<string, { x: number; y: number; n: number }>();
  for (const n of nodes) {
    const c = m.get(n.group) ?? { x: 0, y: 0, n: 0 };
    c.x += n.x; c.y += n.y; c.n++;
    m.set(n.group, c);
  }
  for (const c of m.values()) { c.x /= c.n; c.y /= c.n; }
  return m;
}

// One simulation step. `alpha` (0..1) cools the system. Returns total kinetic energy (stop animating when it is tiny).
export function tick(nodes: FNode[], edges: FEdge[], alpha: number, opt: ForceOptions = {}): number {
  const o = { ...D, ...opt };
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const n = nodes.length;

  for (let i = 0; i < n; i++) {
    const a = nodes[i];
    for (let j = i + 1; j < n; j++) {
      const b = nodes[j];
      let dx = a.x - b.x, dy = a.y - b.y;
      let d2 = dx * dx + dy * dy;
      if (d2 > 160_000) continue; // beyond 400px repulsion is negligible
      if (d2 < 0.01) { dx = (i - j) * 0.1; dy = 0.1; d2 = dx * dx + dy * dy; }
      const d = Math.sqrt(d2);
      const minD = a.r + b.r + 6;
      let f = (o.repulsion * alpha) / d2;
      if (d < minD) f += (minD - d) * 0.5; // collision push so circles do not overlap
      const fx = (dx / d) * f, fy = (dy / d) * f;
      a.vx += fx; a.vy += fy; b.vx -= fx; b.vy -= fy;
    }
  }

  for (const e of edges) {
    const a = byId.get(e.from), b = byId.get(e.to);
    if (!a || !b || a === b) continue;
    const dx = b.x - a.x, dy = b.y - a.y;
    const d = Math.sqrt(dx * dx + dy * dy) || 1;
    const f = (d - o.springLen) * o.spring * alpha;
    const fx = (dx / d) * f, fy = (dy / d) * f;
    a.vx += fx; a.vy += fy; b.vx -= fx; b.vy -= fy;
  }

  const centres = groupCentres(nodes);
  let energy = 0;
  for (const p of nodes) {
    const c = centres.get(p.group)!;
    p.vx += (c.x - p.x) * o.groupPull * alpha - p.x * o.gravity * alpha;
    p.vy += (c.y - p.y) * o.groupPull * alpha - p.y * o.gravity * alpha;
    if (p.fixed) { p.vx = 0; p.vy = 0; continue; }
    p.vx *= o.damping; p.vy *= o.damping;
    p.x += p.vx; p.y += p.vy;
    energy += p.vx * p.vx + p.vy * p.vy;
  }
  return energy;
}

// Run to rest for the first paint, so the user never watches a chaotic start.
export function settle(nodes: FNode[], edges: FEdge[], iterations = 260, opt: ForceOptions = {}): void {
  for (let i = 0; i < iterations; i++) tick(nodes, edges, Math.max(0.02, 1 - i / iterations), opt);
}

export function bounds(nodes: { x: number; y: number; r: number }[]) {
  if (!nodes.length) return { minX: -100, minY: -100, maxX: 100, maxY: 100 };
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const n of nodes) { minX = Math.min(minX, n.x - n.r); minY = Math.min(minY, n.y - n.r); maxX = Math.max(maxX, n.x + n.r); maxY = Math.max(maxY, n.y + n.r); }
  return { minX, minY, maxX, maxY };
}

// Mermaid text for any (filtered) graph, so it can be pasted into docs or mermaid.live.
export function toMermaid(
  nodes: { id: string; label: string; group: string }[],
  edges: { from: string; to: string; type: string }[],
  groupLabel: (g: string) => string = (g) => g,
): string {
  const safeId = new Map(nodes.map((n, i) => [n.id, "n" + i]));
  const esc = (s: string) => s.replace(/["[\]()<>{}|]/g, " ").trim();
  const lines = ["graph LR"];
  const groups = new Map<string, typeof nodes>();
  for (const n of nodes) (groups.get(n.group) ?? groups.set(n.group, []).get(n.group)!).push(n);
  let gi = 0;
  for (const [g, ns] of groups) {
    lines.push(`  subgraph g${gi++}["${esc(groupLabel(g))}"]`);
    for (const n of ns) lines.push(`    ${safeId.get(n.id)}["${esc(n.label)}"]`);
    lines.push("  end");
  }
  const arrow: Record<string, string> = { IMPORTS: "-->", CALLS: "==>", REFERENCES: "-.->", EXTENDS: "-->", IMPLEMENTS: "-.->" };
  for (const e of edges) {
    const a = safeId.get(e.from), b = safeId.get(e.to);
    if (!a || !b) continue;
    const label = e.type === "IMPORTS" ? "" : `|${e.type.toLowerCase()}|`;
    lines.push(`  ${a} ${arrow[e.type] ?? "-->"}${label} ${b}`);
  }
  return lines.join("\n");
}
