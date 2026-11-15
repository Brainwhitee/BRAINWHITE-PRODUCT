// Tree explorer logic: hierarchy, folder merging, layout, reveal helpers (pure; hand-written expectations).
import { test } from "vitest";
import assert from "node:assert/strict";
import { buildTree, layoutTree, ancestors, nearestVisible, descendantFileIds, foldersToOpen, openToDepth } from "../src/lib/tree";

const files = [
  { id: "1", path: "README.md" },
  { id: "2", path: "src/app/api/auth/route.ts" },
  { id: "3", path: "src/app/api/auth/login.ts" },
  { id: "4", path: "src/app/page.tsx" },
  { id: "5", path: "src/lib/db.ts" },
  { id: "6", path: "src/lib/domain/score.ts" },
  { id: "7", path: "scripts/seed.ts" },
];
const t = () => buildTree(files, "demo");

test("repo -> folders -> files, folders before files, alphabetical", () => {
  const { root } = t();
  assert.deepEqual(root.children.map((c) => c.label), ["scripts", "src", "README.md"]);
  const src = root.children.find((c) => c.label === "src")!;
  assert.deepEqual(src.children.map((c) => c.label), ["app", "lib"]);
  assert.equal(root.files, 7); assert.equal(src.files, 5);
});

test("a folder that only contains one folder is merged with it (compact folders)", () => {
  const { byId } = t();
  const merged = byId.get("d:src/app/api/auth");
  assert.ok(merged, "src/app/api/auth should be a single node");
  assert.equal(merged!.label, "api/auth"); // the chain is shown as one label
  const api = [...byId.values()].find((n) => n.kind === "dir" && n.label === "api");
  assert.equal(api, undefined, "api has one child folder and no files, so it merges into api/auth");
  assert.equal(byId.get("d:src/app/api/auth")!.parent, "d:src/app");
});

test("depth and parent links are consistent for every node", () => {
  const { byId, root } = t();
  for (const n of byId.values()) {
    if (n === root) continue;
    const p = byId.get(n.parent!)!;
    assert.equal(n.depth, p.depth + 1, `${n.id}`);
    assert.ok(p.children.includes(n));
  }
});

test("layout: nothing open shows only the root and its children, one row each", () => {
  const { root } = t();
  const l = layoutTree(root, new Set(["root"]));
  assert.equal(l.rows, 3);
  assert.deepEqual([...l.placed.values()].map((p) => p.depth).sort(), [0, 1, 1, 1]);
});

test("layout: opening a folder adds its children and the parent sits in the middle of them", () => {
  const { root, byId } = t();
  const open = new Set(["root", "d:src"]);
  const l = layoutTree(root, open);
  const src = l.placed.get("d:src")!, app = l.placed.get("d:src/app")!, lib = l.placed.get("d:src/lib")!;
  assert.equal(src.row, (app.row + lib.row) / 2);
  assert.equal(app.depth, 2);
  assert.ok(byId.has("d:src/app"));
  const rows = new Set([...l.placed.values()].map((p) => p.row));
  assert.ok(l.placed.size >= 6 && rows.size >= 5);
});

test("layout: rows never collide for leaves", () => {
  const { root } = t();
  const l = layoutTree(root, openToDepth(t(), 9));
  const leafRows = [...l.placed.values()].filter((p) => { const n = [...t().byId.values()].find((x) => x.id === p.id)!; return n.kind === "file"; }).map((p) => p.row);
  assert.equal(new Set(leafRows).size, leafRows.length);
});

test("extra children (functions of an opened file) can be added through childrenOf", () => {
  const { root, byId } = t();
  const file = byId.get("f:5")!;
  const fn = { id: "s:1", kind: "file" as const, label: "connect", path: file.path, children: [], files: 0, parent: file.id, depth: file.depth + 1 };
  const l = layoutTree(root, new Set(["root", "d:src", "d:src/lib", "f:5"]), (n) => (n.id === "f:5" ? [fn] : n.children));
  assert.ok(l.placed.has("s:1"));
  assert.equal(l.placed.get("s:1")!.depth, l.placed.get("f:5")!.depth + 1);
});

test("ancestors, descendant files and reveal helpers", () => {
  const { root, byId } = t();
  assert.deepEqual(ancestors(byId, "f:2"), ["d:src/app/api/auth", "d:src/app", "d:src", "root"]);
  assert.deepEqual(descendantFileIds(byId.get("d:src/lib")!).sort(), ["5", "6"]);
  assert.deepEqual([...foldersToOpen(byId, ["6"])].sort(), ["d:src", "d:src/lib", "d:src/lib/domain", "root"].sort());
  assert.equal(descendantFileIds(root).length, 7);
});

test("nearestVisible falls back to the closest closed folder above a hidden file", () => {
  const { byId } = t();
  const visible = new Set(["root", "d:src", "d:src/app", "d:src/lib"]);
  assert.equal(nearestVisible(byId, "5", visible), "d:src/lib");
  assert.equal(nearestVisible(byId, "2", visible), "d:src/app");
  assert.equal(nearestVisible(byId, "1", visible), "root"); // README is a root file that is not shown: the repo node stands in
  assert.equal(nearestVisible(byId, "1", new Set(["f:1"])), "f:1");
});

test("openToDepth opens folders above the depth only", () => {
  const tree = t();
  const d1 = openToDepth(tree, 1);
  assert.ok(d1.has("root") && !d1.has("d:src"));
  const d2 = openToDepth(tree, 2);
  assert.ok(d2.has("d:src") && !d2.has("d:src/app"));
});

test("empty and flat repositories work", () => {
  assert.equal(buildTree([], "x").root.children.length, 0);
  const flat = buildTree([{ id: "a", path: "a.ts" }, { id: "b", path: "b.ts" }], "x");
  assert.deepEqual(flat.root.children.map((c) => c.label), ["a.ts", "b.ts"]);
});
