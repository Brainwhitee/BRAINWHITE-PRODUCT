import { test } from "vitest";
import assert from "node:assert/strict";
import { initNodes, settle, bounds, toMermaid, tick } from "../src/lib/forcelayout";

const mk = (n: number, group = "g") => Array.from({ length: n }, (_, i) => ({ id: "n" + i, group, r: 8 }));

test("layout is deterministic and finite", () => {
  const edges = [{ from: "n0", to: "n1" }, { from: "n1", to: "n2" }, { from: "n2", to: "n3" }];
  const a = initNodes(mk(4)), b = initNodes(mk(4));
  settle(a, edges); settle(b, edges);
  assert.deepEqual(a.map((n) => [n.x, n.y]), b.map((n) => [n.x, n.y]));
  assert.ok(a.every((n) => Number.isFinite(n.x) && Number.isFinite(n.y)));
});

test("circles do not overlap and linked nodes sit closer than average", () => {
  const nodes = initNodes(mk(10));
  const edges = [0, 2, 4, 6, 8].map((i) => ({ from: "n" + i, to: "n" + (i + 1) }));
  settle(nodes, edges, 400);
  const d = (i: number, j: number) => Math.hypot(nodes[i].x - nodes[j].x, nodes[i].y - nodes[j].y);
  let minD = Infinity, all = 0, cnt = 0;
  for (let i = 0; i < 10; i++) for (let j = i + 1; j < 10; j++) { minD = Math.min(minD, d(i, j)); all += d(i, j); cnt++; }
  const linked = [0, 2, 4, 6, 8].reduce((s, i) => s + d(i, i + 1), 0) / 5;
  assert.ok(minD >= 14, "no overlap (radius 8 each, minus a small tolerance)");
  assert.ok(linked < all / cnt, "linked pairs are closer than the average pair");
});

test("different groups separate into clusters", () => {
  const items = [...mk(5, "a"), ...mk(5, "b").map((n) => ({ ...n, id: "b" + n.id }))];
  const nodes = initNodes(items);
  settle(nodes, [], 400);
  const c = (g: string) => { const ns = nodes.filter((n) => n.group === g); return { x: ns.reduce((s, n) => s + n.x, 0) / ns.length, y: ns.reduce((s, n) => s + n.y, 0) / ns.length }; };
  const spread = (g: string) => { const m = c(g); return Math.max(...nodes.filter((n) => n.group === g).map((n) => Math.hypot(n.x - m.x, n.y - m.y))); };
  const between = Math.hypot(c("a").x - c("b").x, c("a").y - c("b").y);
  assert.ok(between > spread("a"), "cluster centres are farther apart than a cluster is wide");
});

test("a fixed node does not move", () => {
  const nodes = initNodes(mk(3));
  nodes[0].fixed = true;
  const { x, y } = nodes[0];
  for (let i = 0; i < 50; i++) tick(nodes, [{ from: "n0", to: "n1" }], 1);
  assert.equal(nodes[0].x, x); assert.equal(nodes[0].y, y);
});

test("bounds covers every node radius", () => {
  assert.deepEqual(bounds([{ x: 0, y: 0, r: 5 }, { x: 10, y: 20, r: 5 }]), { minX: -5, minY: -5, maxX: 15, maxY: 25 });
});

test("mermaid export groups by module and labels non-import edges", () => {
  const out = toMermaid(
    [{ id: "1", label: "a.ts", group: "m1" }, { id: "2", label: "b(x).ts", group: "m2" }],
    [{ from: "1", to: "2", type: "IMPORTS" }, { from: "2", to: "1", type: "CALLS" }],
    (g) => (g === "m1" ? "Core" : "UI"),
  );
  assert.ok(out.startsWith("graph LR"));
  assert.ok(out.includes('subgraph g0["Core"]') && out.includes('subgraph g1["UI"]'));
  assert.ok(out.includes('n1["b x .ts"]'), "brackets are stripped so mermaid does not break");
  assert.ok(out.includes("n0 --> n1") && out.includes("n1 ==>|calls| n0"));
});
