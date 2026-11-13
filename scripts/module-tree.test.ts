import { test } from "vitest";
import assert from "node:assert/strict";
import { buildModuleTree } from "../src/lib/analyser/module-tree";

const by = (t: ReturnType<typeof buildModuleTree>) => new Map(t.map((n) => [n.path, n]));

test("plain folders nest under their nearest ancestor module", () => {
  const t = by(buildModuleTree(["src/lib", "src/lib/domain", "src/lib/analyser", "src/app"]));
  assert.equal(t.get("src/lib/domain")!.parent, "src/lib");
  assert.equal(t.get("src/lib/analyser")!.parent, "src/lib");
  assert.equal(t.get("src/lib")!.parent, null); // "src" is not a module, so nothing above it
  assert.equal(t.get("src/app")!.parent, null);
  assert.ok([...t.values()].every((n) => n.kind === "FOLDER"));
});

test("clusters hang under their base folder; a missing base becomes a GROUP", () => {
  const t = by(buildModuleTree(["src/components~button", "src/components~misc", "src/components/ui~card", "src/lib"]));
  assert.deepEqual(t.get("src/components~button"), { path: "src/components~button", kind: "CLUSTER", parent: "src/components" });
  assert.deepEqual(t.get("src/components"), { path: "src/components", kind: "GROUP", parent: null });
  assert.deepEqual(t.get("src/components/ui"), { path: "src/components/ui", kind: "GROUP", parent: "src/components" }); // group under group
  assert.equal(t.get("src/components/ui~card")!.parent, "src/components/ui");
});

test("when the base folder is itself a module it is a FOLDER parent, not a GROUP", () => {
  const t = by(buildModuleTree(["src/ui", "src/ui~button"]));
  assert.equal(t.get("src/ui")!.kind, "FOLDER");
  assert.equal(t.get("src/ui~button")!.parent, "src/ui");
  assert.equal(buildModuleTree(["src/ui", "src/ui~button"]).length, 2); // no duplicate group
});

test("the root module has no parent and is nobody's parent", () => {
  const t = by(buildModuleTree([".", "src/a"]));
  assert.deepEqual(t.get("."), { path: ".", kind: "FOLDER", parent: null });
  assert.equal(t.get("src/a")!.parent, null);
});

test("every parent exists in the output, there are no cycles, and real modules are never lost", () => {
  const input = ["src/components~a", "src/components~b", "src/components/ui~c", "src/lib", "src/lib/domain", "scripts", "scripts/fixtures/x", "."];
  const tree = buildModuleTree(input);
  const paths = new Set(tree.map((n) => n.path));
  for (const n of tree) {
    if (n.parent) assert.ok(paths.has(n.parent), `${n.path} -> missing parent ${n.parent}`);
    let cur: string | null = n.path, hops = 0;
    while (cur && hops++ < 20) cur = tree.find((x) => x.path === cur)?.parent ?? null;
    assert.ok(hops < 20, `cycle at ${n.path}`);
  }
  for (const p of input) assert.ok(paths.has(p), `lost ${p}`);
  assert.equal(tree.filter((n) => n.kind === "GROUP").length, 2); // src/components and src/components/ui
});

test("parentLabels names the parent of folder modules only (clusters already include their folder in their name)", async () => {
  const { parentLabels } = await import("../src/lib/analyser/module-tree");
  const nameFor = (p: string) => p.split("/").pop()!.toUpperCase();
  const m = parentLabels(["src/lib", "src/lib/domain", "src/ui~button", "scripts"], nameFor);
  assert.equal(m.get("src/lib/domain"), "LIB");
  assert.equal(m.has("src/lib"), false);
  assert.equal(m.has("src/ui~button"), false);
  assert.equal(m.has("scripts"), false);
});
