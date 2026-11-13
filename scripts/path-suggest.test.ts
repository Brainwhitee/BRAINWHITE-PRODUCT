// Tests for the graph -> draft learning path suggestion (no DB, no AI). Expectations are hand-written.
import { test } from "vitest";
import assert from "node:assert/strict";
import { suggestPath, isNoiseModule, sectionNote, type SChunk, type SModule } from "../src/lib/domain/path-suggest";

const mod = (id: string, path = id, files = 3, summary = `${id} does things. More text.`): SModule => ({ id, name: id.toUpperCase(), path, files, summary });
let n = 0;
const ck = (moduleId: string, filePath: string, over: Partial<SChunk> = {}): SChunk => ({ id: `c${n++}`, moduleId, filePath, title: `t${n}`, startLine: 1, endLine: 20, estMinutes: 5, ...over });

test("foundations come first: a module is taught after the modules it depends on", () => {
  // app -> api -> lib  (app depends on api, api depends on lib)
  const r = suggestPath({
    modules: [mod("app"), mod("api"), mod("lib")],
    moduleEdges: [{ from: "app", to: "api" }, { from: "api", to: "lib" }],
    chunks: [ck("app", "app/x.ts"), ck("api", "api/x.ts"), ck("lib", "lib/x.ts")],
    fileFanIn: {},
  });
  assert.deepEqual(r.sections.map((s) => s.moduleId), ["lib", "api", "app"]);
});

test("noise modules and modules without chunks are skipped, with a reason", () => {
  const r = suggestPath({
    modules: [mod("core"), mod("fx", "scripts/fixtures/ts-alias"), mod("docs", "docs"), mod("empty")],
    moduleEdges: [],
    chunks: [ck("core", "core/a.ts"), ck("fx", "x.ts"), ck("docs", "d.md")],
    fileFanIn: {},
  });
  assert.deepEqual(r.sections.map((s) => s.moduleId), ["core"]);
  assert.deepEqual(r.skipped.map((s) => s.name).sort(), ["DOCS", "EMPTY", "FX"]);
  assert.ok(isNoiseModule("src/__tests__") && isNoiseModule("scripts") && !isNoiseModule("src/lib/tests-helper"));
});

test("only the most central modules are kept when there are too many", () => {
  const mods = ["a", "b", "c", "d"].map((i) => mod(i));
  // everyone depends on "d"; "c" is depended on by "a"; "a" and "b" by nobody
  const r = suggestPath({
    modules: mods,
    moduleEdges: [{ from: "a", to: "d" }, { from: "b", to: "d" }, { from: "c", to: "d" }, { from: "a", to: "c" }],
    chunks: mods.map((m) => ck(m.id, `${m.id}/x.ts`)),
    fileFanIn: {},
    maxSections: 2,
  });
  assert.deepEqual(r.sections.map((s) => s.moduleId), ["d", "c"]); // d (3 dependents) and c (1) beat a, b (0)
  assert.equal(r.skipped.filter((s) => s.reason.startsWith("less central")).length, 2);
});

test("inside a module the most imported file is taught first", () => {
  const r = suggestPath({
    modules: [mod("m")], moduleEdges: [],
    chunks: [ck("m", "m/rare.ts"), ck("m", "m/popular.ts"), ck("m", "m/mid.ts")],
    fileFanIn: { "m/popular.ts": 9, "m/mid.ts": 3, "m/rare.ts": 0 },
  });
  assert.deepEqual(r.sections[0].chunks.map((c) => c.filePath), ["m/popular.ts", "m/mid.ts", "m/rare.ts"]);
});

test("a section is capped by lesson count and by minutes, but always has at least one lesson", () => {
  const many = Array.from({ length: 10 }, (_, i) => ck("m", `m/f${i}.ts`));
  assert.equal(suggestPath({ modules: [mod("m")], moduleEdges: [], chunks: many, fileFanIn: {}, maxChunksPerSection: 4 }).sections[0].chunks.length, 4);
  const big = [ck("m", "m/a.ts", { estMinutes: 80 }), ck("m", "m/b.ts", { estMinutes: 30 }), ck("m", "m/c.ts", { estMinutes: 5 })];
  const r = suggestPath({ modules: [mod("m")], moduleEdges: [], chunks: big, fileFanIn: {}, maxMinutesPerSection: 90 });
  assert.deepEqual(r.sections[0].chunks.map((c) => c.filePath), ["m/a.ts", "m/c.ts"]); // b (30) would overflow 90; c (5) still fits
  assert.equal(r.sections[0].minutes, 85);
  const huge = suggestPath({ modules: [mod("m")], moduleEdges: [], chunks: [ck("m", "m/a.ts", { estMinutes: 500 })], fileFanIn: {}, maxMinutesPerSection: 90 });
  assert.equal(huge.sections[0].chunks.length, 1);
});

test("import cycles between modules do not break ordering or drop modules", () => {
  const r = suggestPath({
    modules: [mod("x"), mod("y")], moduleEdges: [{ from: "x", to: "y" }, { from: "y", to: "x" }],
    chunks: [ck("x", "x/a.ts"), ck("y", "y/a.ts")], fileFanIn: {},
  });
  assert.equal(r.sections.length, 2);
});

test("every suggested lesson is an existing chunk, with an intro and a reason", () => {
  const chunks = [ck("a", "a/x.ts"), ck("b", "b/x.ts")];
  const r = suggestPath({ modules: [mod("a"), mod("b")], moduleEdges: [{ from: "b", to: "a" }], chunks, fileFanIn: {} });
  const known = new Set(chunks.map((c) => c.id));
  for (const s of r.sections) {
    assert.ok(s.chunks.every((c) => known.has(c.id)));
    assert.equal(s.intro, `${s.moduleId} does things.`); // first sentence of the module summary
  }
  assert.equal(r.sections[0].why, "1 other module builds on it"); // a is taught first because b depends on it
  assert.equal(r.sections[1].why, "nothing else in this path depends on it");
  assert.equal(r.totalMinutes, r.sections.reduce((s, x) => s + x.minutes, 0));
});

test("the section note cites the exact source lines of every lesson, and only those", () => {
  const chunks = [ck("m", "src/db.ts", { title: "connect", startLine: 3, endLine: 17 }), ck("m", "src/auth.ts", { title: "login", startLine: 40, endLine: 88 })];
  const note = sectionNote({ intro: "Database access.", why: "2 other modules build on it", chunks });
  assert.ok(note.startsWith("Database access.\n\nWhy now: 2 other modules build on it."));
  assert.ok(note.includes("- src/db.ts:3-17 (connect)") && note.includes("- src/auth.ts:40-88 (login)"));
  assert.equal(note.split("\n").filter((l) => l.startsWith("- ")).length, 2);
  assert.equal(sectionNote({ intro: "", why: "x", chunks: [] }), "Why now: x."); // no lessons, no empty citation list
});
