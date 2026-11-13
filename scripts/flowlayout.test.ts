// Layered node-canvas layout: columns, ordering, no overlap, cycles, connectors (pure; hand-written expectations).
import { test } from "vitest";
import assert from "node:assert/strict";
import { flowLayout, connectorPath, connectorPoint } from "../src/lib/flowlayout";

const n = (id: string, w = 200, h = 60) => ({ id, w, h });
const e = (from: string, to: string) => ({ from, to });

test("a dependency chain becomes columns left to right, entry points first", () => {
  const r = flowLayout([n("app"), n("api"), n("lib")], [e("app", "api"), e("api", "lib")]);
  assert.deepEqual(["app", "api", "lib"].map((id) => r.placed.get(id)!.layer), [0, 1, 2]);
  assert.ok(r.placed.get("app")!.x < r.placed.get("api")!.x && r.placed.get("api")!.x < r.placed.get("lib")!.x);
  assert.equal(r.layers, 3);
});

test("a module used by two others sits to the right of both (longest path wins)", () => {
  const r = flowLayout([n("a"), n("b"), n("shared")], [e("a", "b"), e("a", "shared"), e("b", "shared")]);
  assert.equal(r.placed.get("shared")!.layer, 2);
});

test("cycles do not crash, drop nodes or loop forever", () => {
  const r = flowLayout([n("x"), n("y"), n("z")], [e("x", "y"), e("y", "z"), e("z", "x")]);
  assert.equal(r.placed.size, 3);
  assert.ok([...r.placed.values()].every((p) => Number.isFinite(p.x) && Number.isFinite(p.y)));
});

test("self edges and edges to unknown ids are ignored; isolated boxes are still placed", () => {
  const r = flowLayout([n("a"), n("lonely")], [e("a", "a"), e("a", "ghost")]);
  assert.equal(r.placed.size, 2);
  assert.equal(r.placed.get("lonely")!.layer, 0);
});

test("boxes never overlap, even with very different heights", () => {
  const nodes = [n("r1", 200, 60), n("r2", 200, 300), n("r3", 200, 90), n("m1", 240, 500), n("m2", 240, 70), n("t", 200, 60)];
  const edges = [e("r1", "m1"), e("r2", "m1"), e("r2", "m2"), e("r3", "m2"), e("m1", "t"), e("m2", "t")];
  const ps = [...flowLayout(nodes, edges).placed.values()];
  for (let i = 0; i < ps.length; i++) for (let j = i + 1; j < ps.length; j++) {
    const a = ps[i], b = ps[j];
    const overlap = a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
    assert.ok(!overlap, `${a.id} overlaps ${b.id}`);
  }
});

test("column spacing leaves the requested gap and uses the widest box of the previous column", () => {
  const r = flowLayout([n("a", 100), n("a2", 300), n("b", 150)], [e("a", "b"), e("a2", "b")], { gapX: 50 });
  assert.equal(r.placed.get("b")!.x, 300 + 50); // column 0 is 300 wide (a2), then a 50px gap
});

test("ordering reduces crossings: two parallel chains end up in matching order", () => {
  // names would sort a,b / c,d which makes a->d and b->c cross; the sweep must fix it
  const r = flowLayout([n("a"), n("b"), n("c"), n("d")], [e("a", "d"), e("b", "c")]);
  const y = (id: string) => r.placed.get(id)!.y;
  const crossing = (y("a") < y("b")) !== (y("d") < y("c"));
  assert.ok(!crossing, `a:${y("a")} b:${y("b")} d:${y("d")} c:${y("c")}`);
});

test("each column is vertically centred around the tallest one", () => {
  const r = flowLayout([n("a", 200, 100), n("b", 200, 100), n("c", 200, 100)], [e("a", "c"), e("b", "c")]);
  const centre = (id: string) => r.placed.get(id)!.y + r.placed.get(id)!.h / 2;
  assert.equal(centre("c"), r.height / 2);
});

test("empty input is fine", () => {
  const r = flowLayout([], []);
  assert.equal(r.placed.size, 0); assert.equal(r.width, 0); assert.equal(r.height, 0);
});

test("connectors leave and arrive horizontally, and the midpoint lies between the ports", () => {
  assert.equal(connectorPath(0, 0, 200, 100), "M0 0 C100 0 100 100 200 100");
  const m = connectorPoint(0, 0, 200, 100);
  assert.ok(m.x > 0 && m.x < 200 && m.y > 0 && m.y < 100);
  assert.deepEqual(connectorPoint(10, 20, 210, 20, 0), { x: 10, y: 20 });
  assert.deepEqual(connectorPoint(10, 20, 210, 20, 1), { x: 210, y: 20 });
});
