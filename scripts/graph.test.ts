// Dummy graphs (hand-made) for the explorer's layout and ordering logic. No DB.
import { describe, expect, test } from "vitest";
import { dependencyOrder, layoutGraph, type GEdge, type GNode } from "../src/lib/graph";

const n = (id: string, extra: Partial<GNode> = {}): GNode => ({ id, label: id, kind: "module", ...extra });
const e = (from: string, to: string): GEdge => ({ id: `${from}>${to}`, from, to, type: "DEPENDS_ON", confidence: "EXACT", weight: 1 });

describe("layoutGraph", () => {
  test("importers sit left of what they import's dependants; chain gets increasing columns", () => {
    const { nodes } = layoutGraph([n("app"), n("lib"), n("db")], [e("app", "lib"), e("lib", "db")]);
    const x = Object.fromEntries(nodes.map((p) => [p.id, p.x]));
    expect(x.app).toBeLessThan(x.lib);
    expect(x.lib).toBeLessThan(x.db);
  });
  test("a cycle does not hang and every node is placed once", () => {
    const { nodes } = layoutGraph([n("a"), n("b"), n("c")], [e("a", "b"), e("b", "c"), e("c", "a")]);
    expect(nodes.map((p) => p.id).sort()).toEqual(["a", "b", "c"]);
  });
  test("nodes in one column do not overlap; edges to unknown nodes are ignored", () => {
    const { nodes } = layoutGraph([n("a"), n("b"), n("c")], [e("a", "ghost")]);
    expect(new Set(nodes.map((p) => `${p.x},${p.y}`)).size).toBe(3);
  });
  test("empty graph", () => {
    expect(layoutGraph([], []).nodes).toEqual([]);
  });
});

describe("dependencyOrder", () => {
  test("dependencies come before their dependants", () => {
    const order = dependencyOrder([{ id: "app" }, { id: "lib" }, { id: "db" }], [{ from: "app", to: "lib" }, { from: "lib", to: "db" }]);
    expect(order).toEqual(["db", "lib", "app"]);
  });
  test("cycle still returns every node", () => {
    expect(dependencyOrder([{ id: "a" }, { id: "b" }], [{ from: "a", to: "b" }, { from: "b", to: "a" }]).sort()).toEqual(["a", "b"]);
  });
});
