// Tests for push-driven sync decisions (no DB, no network).
import { test } from "vitest";
import assert from "node:assert/strict";
import { planSync, changeFromPush, isConfigFile, type ChangeSet } from "../src/lib/analyser/sync-plan";
import { makeFilter } from "../src/lib/analyser/filter";

const filter = makeFilter("", "");
const ch = (c: Partial<ChangeSet>): ChangeSet => ({ added: [], modified: [], removed: [], before: "A", after: "B", ...c });
const plan = (c: Partial<ChangeSet>, lastSha: string | null = "A") => planSync({ lastSha, change: ch(c), filter });

test("one modified source file is incremental", () => {
  const p = plan({ modified: ["src/a.ts"] });
  assert.equal(p.mode, "incremental");
  assert.deepEqual((p as { files: string[] }).files, ["src/a.ts"]);
});

test("never synced, or a gap between last synced commit and the push parent, forces a full sync", () => {
  assert.equal(plan({ modified: ["a.ts"] }, null).mode, "full");
  assert.equal(plan({ modified: ["a.ts"], before: "Z" }).mode, "full");
});

test("a manual trigger without a 'before' sha skips the gap check", () => {
  assert.equal(plan({ modified: ["a.ts"], before: undefined }).mode, "incremental");
});

test("added or removed code files force a full sync (imports elsewhere may now resolve or break)", () => {
  assert.equal(plan({ added: ["src/new.ts"] }).mode, "full");
  assert.equal(plan({ removed: ["src/old.ts"] }).mode, "full");
});

test("added/removed ignored files (images, lockfiles, node_modules) do not matter", () => {
  assert.equal(plan({ added: ["logo.png"], modified: ["a.ts"] }).mode, "incremental");
  assert.equal(plan({ removed: ["node_modules/x/index.js"], modified: ["a.ts"] }).mode, "incremental");
});

test("config files force a full sync, even when only modified", () => {
  for (const f of ["tsconfig.json", "packages/web/tsconfig.base.json", "package.json", "apps/api/package.json", ".gitignore", "pyproject.toml"]) {
    assert.ok(isConfigFile(f), f);
    assert.equal(plan({ modified: [f, "a.ts"] }).mode, "full", f);
  }
  assert.ok(!isConfigFile("src/tsconfig-helper.ts"));
});

test("only ignored files changed is a no-op; too many files is full", () => {
  assert.equal(plan({ modified: ["README.png", "yarn.lock"] }).mode, "noop");
  const many = Array.from({ length: 41 }, (_, i) => `src/f${i}.ts`);
  assert.equal(plan({ modified: many }).mode, "full");
  assert.equal(plan({ modified: many.slice(0, 40) }).mode, "incremental");
});

test("unknown change lists (force push, truncated commits, new branch) force a full sync", () => {
  assert.equal(plan({ modified: ["a.ts"], unknown: true }).mode, "full");
});

test("changeFromPush merges commits and resolves add-then-modify / add-then-remove", () => {
  const c = changeFromPush({
    before: "A", after: "B",
    commits: [
      { added: ["x.ts"], modified: ["a.ts"] },
      { modified: ["x.ts", "a.ts", "b.ts"], removed: ["gone.ts"] },
      { added: ["tmp.ts"] }, { removed: ["tmp.ts"] },
    ],
  });
  assert.deepEqual(c.added.sort(), ["x.ts"]); // added then modified stays "added"
  assert.deepEqual(c.modified.sort(), ["a.ts", "b.ts"]);
  assert.deepEqual(c.removed.sort(), ["gone.ts", "tmp.ts"]);
  assert.equal(c.unknown, false);
});

test("changeFromPush marks force pushes, new/deleted branches and 20+ commits as unknown", () => {
  const one = [{ modified: ["a.ts"] }];
  assert.equal(changeFromPush({ before: "A", after: "B", commits: one, forced: true }).unknown, true);
  assert.equal(changeFromPush({ before: "A", after: "B", commits: one, deleted: true }).unknown, true);
  assert.equal(changeFromPush({ before: "0000000000000000000000000000000000000000", after: "B", commits: one }).unknown, true);
  assert.equal(changeFromPush({ before: "A", after: "B", commits: Array.from({ length: 20 }, () => ({ modified: ["a.ts"] })) }).unknown, true);
  assert.equal(changeFromPush({ before: "A", after: "B", commits: [] }).unknown, true);
  assert.equal(changeFromPush({ before: "A", after: "B", commits: one }).unknown, false);
});
