// Core tests (no DB, no network): import extraction + resolution. Run: npm run test:core
import test from "node:test";
import assert from "node:assert/strict";
import { createResolver } from "../src/lib/analyser/resolve";
import { parseSource } from "../src/lib/analyser/parse";
import { assignModules, type FileGraph } from "../src/lib/analyser/cluster";
import { moduleNameFor } from "../src/lib/analyser/modules";
import { buildSymbolEdges, withSymbolIds, type FileFacts } from "../src/lib/analyser/edges";

const mk = (files: Record<string, string>) => createResolver(new Set(Object.keys(files)), (p) => files[p]);

test("parseSource finds static, re-export, require and dynamic imports anywhere", async () => {
  const code = `
import a from "./a";
export * from "./re";
const b = require("./b");
async function f() { const c = await import("./c"); if (x) { require("./d"); } }
const tpl = require(\`./nope-\${x}\`);
`;
  const r = await parseSource("typescript", code);
  assert.deepEqual([...r!.imports].sort(), ["./a", "./b", "./c", "./d", "./re"]);
});

test("tsconfig paths alias and baseUrl", () => {
  const resolve = mk({
    "tsconfig.json": `{ // comment\n "compilerOptions": { "baseUrl": ".", "paths": { "@app/*": ["src/app/*"] } } }`,
    "src/app/util.ts": "", "src/lib/x.ts": "", "src/main.ts": "",
  });
  assert.deepEqual(resolve("src/main.ts", "@app/util", "typescript"), { kind: "internal", target: "src/app/util.ts" });
  assert.deepEqual(resolve("src/main.ts", "src/lib/x", "typescript"), { kind: "internal", target: "src/lib/x.ts" });
});

test("tsconfig extends and nearest config wins in a monorepo", () => {
  const resolve = mk({
    "tsconfig.base.json": `{ "compilerOptions": { "paths": { "@shared/*": ["./shared/*"] } } }`,
    "packages/web/tsconfig.json": `{ "extends": "../../tsconfig.base.json", "compilerOptions": { "baseUrl": "." } }`,
    "packages/web/src/a.ts": "", "packages/web/shared/s.ts": "",
  });
  assert.equal(resolve("packages/web/src/a.ts", "@shared/s", "typescript").kind, "internal");
});

test("index files, .js to .ts mapping, css asset", () => {
  const resolve = mk({ "src/a.ts": "", "src/ui/index.tsx": "", "src/b.ts": "", "src/g.css": "" });
  assert.deepEqual(resolve("src/a.ts", "./ui", "typescript"), { kind: "internal", target: "src/ui/index.tsx" });
  assert.deepEqual(resolve("src/a.ts", "./b.js", "typescript"), { kind: "internal", target: "src/b.ts" });
  assert.deepEqual(resolve("src/a.ts", "./g.css", "typescript"), { kind: "internal", target: "src/g.css" });
});

test("workspace package names resolve to local folders", () => {
  const resolve = mk({
    "packages/core/package.json": `{ "name": "@acme/core" }`, "packages/core/src/index.ts": "", "packages/core/src/deep.ts": "",
    "apps/web/a.ts": "",
  });
  assert.deepEqual(resolve("apps/web/a.ts", "@acme/core", "typescript"), { kind: "internal", target: "packages/core/src/index.ts" });
  assert.deepEqual(resolve("apps/web/a.ts", "@acme/core/deep", "typescript"), { kind: "internal", target: "packages/core/src/deep.ts" });
});

test("classification: package = external, missing relative/alias = unresolved", () => {
  const resolve = mk({ "tsconfig.json": `{ "compilerOptions": { "paths": { "@/*": ["./src/*"] } } }`, "src/a.ts": "" });
  assert.equal(resolve("src/a.ts", "react", "typescript").kind, "external");
  assert.equal(resolve("src/a.ts", "node:fs", "typescript").kind, "external");
  assert.equal(resolve("src/a.ts", "./missing", "typescript").kind, "unresolved");
  assert.equal(resolve("src/a.ts", "@/missing", "typescript").kind, "unresolved");
});

test("python: src layout absolute import, relative import, stdlib external", () => {
  const resolve = mk({ "src/app/models.py": "", "src/app/views.py": "", "src/app/__init__.py": "", "tests/t.py": "" });
  assert.deepEqual(resolve("src/app/views.py", "app.models", "python"), { kind: "internal", target: "src/app/models.py" });
  assert.deepEqual(resolve("src/app/views.py", ".models", "python"), { kind: "internal", target: "src/app/models.py" });
  assert.deepEqual(resolve("tests/t.py", "app.models", "python"), { kind: "internal", target: "src/app/models.py" });
  assert.equal(resolve("src/app/views.py", "os.path", "python").kind, "external");
  assert.equal(resolve("src/app/views.py", "app.missing", "python").kind, "unresolved");
});

test("java: class, static member, wildcard, jdk external", () => {
  const resolve = mk({ "src/main/java/com/acme/util/Strings.java": "", "src/main/java/com/acme/App.java": "" });
  assert.equal(resolve("src/main/java/com/acme/App.java", "com.acme.util.Strings", "java").kind, "internal");
  assert.equal(resolve("src/main/java/com/acme/App.java", "com.acme.util.Strings.trim", "java").kind, "internal");
  assert.equal(resolve("src/main/java/com/acme/App.java", "java.util.List", "java").kind, "external");
  assert.equal(resolve("src/main/java/com/acme/App.java", "com.acme.util.Missing", "java").kind, "unresolved");
  assert.equal(resolve("src/main/java/com/acme/App.java", "org.springframework.Foo", "java").kind, "external");
});

test("paths without baseUrl are relative to the config; extends via workspace package", () => {
  const resolve = mk({
    "tooling/typescript/package.json": `{ "name": "@acme/tsconfig" }`,
    "tooling/typescript/base.json": `{ "compilerOptions": { "strict": true } }`,
    "apps/web/package.json": `{ "name": "web" }`,
    "apps/web/tsconfig.json": `{ "extends": ["@acme/tsconfig/base.json"], "compilerOptions": { "paths": { "~/*": ["./src/*"] } } }`,
    "apps/web/src/env.ts": "", "apps/web/src/page.tsx": "", "apps/web/src/styles.css": "",
  });
  assert.deepEqual(resolve("apps/web/src/page.tsx", "~/env", "tsx"), { kind: "internal", target: "apps/web/src/env.ts" });
  assert.deepEqual(resolve("apps/web/src/page.tsx", "./styles.css?url", "tsx"), { kind: "internal", target: "apps/web/src/styles.css" });
});

test("assets behind a tsconfig alias resolve", () => {
  const resolve = mk({
    "apps/web/tsconfig.json": `{ "compilerOptions": { "paths": { "~/*": ["./src/*"] } } }`,
    "apps/web/src/app/layout.tsx": "", "apps/web/src/app/styles.css": "",
  });
  assert.deepEqual(resolve("apps/web/src/app/layout.tsx", "~/app/styles.css", "tsx"), { kind: "internal", target: "apps/web/src/app/styles.css" });
});

const names = (n: number, dir: string, ext = "ts") => Array.from({ length: n }, (_, i) => `${dir}/f${String(i).padStart(2, "0")}.${ext}`);
const edges = (pairs: [string, string][]): FileGraph => {
  const g: FileGraph = new Map();
  for (const [a, b] of pairs) { if (!g.has(a)) g.set(a, new Set()); g.get(a)!.add(b); }
  return g;
};

test("modules: small folders are untouched", () => {
  const files = [...names(5, "src/a"), ...names(4, "src/b")];
  const m = assignModules(files, new Map());
  assert.equal(new Set(m.values()).size, 2);
});

test("modules: a big folder is split by sub-folder", () => {
  const files = [...names(20, "src/components/ui"), ...names(15, "src/components/experience"), ...names(2, "src/components")];
  const m = assignModules(files, new Map());
  assert.equal(m.get("src/components/ui/f00.ts"), "src/components/ui");
  assert.equal(m.get("src/components/experience/f00.ts"), "src/components/experience");
  assert.equal(m.get("src/components/f00.ts"), "src/components~misc");
});

test("modules: a flat big folder is split along the import graph", () => {
  const dir = "src/lib";
  const f = names(40, dir);
  const pairs: [string, string][] = [];
  for (let i = 1; i < 20; i++) pairs.push([f[i], f[0]]);        // cluster A around f00
  for (let i = 21; i < 40; i++) pairs.push([f[i], f[20]]);      // cluster B around f20
  const m = assignModules(f, edges(pairs));
  assert.notEqual(m.get(f[1]), m.get(f[25]));
  assert.equal(m.get(f[1]), m.get(f[2]));
  assert.equal(m.get(f[0]), "src/lib~f00");
  assert.equal(m.get(f[20]), "src/lib~f20");
});

test("modules: flat big folder without structure stays one module; result is deterministic", () => {
  const f = names(40, "src/ui");
  const a = assignModules(f, new Map());
  assert.equal(new Set(a.values()).size, 1);
  const g = edges(f.slice(1, 15).map((x) => [x, f[0]] as [string, string]));
  assert.deepEqual([...assignModules(f, g)], [...assignModules([...f].reverse(), g)].sort((x, y) => (x[0] < y[0] ? -1 : 1)).map((e) => e));
});

test("module names", () => {
  assert.equal(moduleNameFor("src/components/ui"), "Ui");
  assert.equal(moduleNameFor("src/lib~auth-helpers"), "Lib · Auth Helpers");
  assert.equal(moduleNameFor("src/lib~misc"), "Lib · Other");
  assert.equal(moduleNameFor("."), "Root");
});

async function facts(files: Record<string, string>) {
  const resolve = mk(files);
  const out: FileFacts[] = [];
  for (const [path, code] of Object.entries(files)) {
    const res = await parseSource(path.endsWith(".tsx") ? "tsx" : "typescript", code);
    out.push({ path, lang: path.endsWith(".tsx") ? "tsx" : "typescript", fileId: "file:" + path, symbols: withSymbolIds("r", path, res!.symbols), refs: res!.refs });
  }
  const sym = (path: string, name: string) => out.find((f) => f.path === path)!.symbols.find((s) => s.name === name)!.id;
  return { edges: buildSymbolEdges(out, resolve), sym };
}

test("symbol edges: imported call (with alias), namespace call, new, extends, implements, JSX", async () => {
  const { edges, sym } = await facts({
    "a.ts": `export function helper() {}
export class Base {}
export interface I {}
export function go() {}`,
    "b.tsx": `import { helper as h, Base } from "./a";
import * as ns from "./a";
import type { I } from "./a";
` +
      `export function Comp() { return null; }
` +
      `export function main() { h(); ns.go(); new Base(); return <Comp />; }
` +
      `export class Child extends Base implements I { run() { main(); } }`,
  });
  const has = (from: string, to: string, type: string, conf = "EXACT") =>
    edges.some((e) => e.fromId === from && e.toId === to && e.type === type && e.confidence === conf);
  assert.ok(has(sym("b.tsx", "main"), sym("a.ts", "helper"), "CALLS"), "aliased import call");
  assert.ok(has(sym("b.tsx", "main"), sym("a.ts", "go"), "CALLS"), "namespace call");
  assert.ok(has(sym("b.tsx", "main"), sym("a.ts", "Base"), "CALLS"), "new Base()");
  assert.ok(has(sym("b.tsx", "main"), sym("b.tsx", "Comp"), "REFERENCES"), "JSX usage");
  assert.ok(has(sym("b.tsx", "Child"), sym("a.ts", "Base"), "EXTENDS"), "extends");
  assert.ok(has(sym("b.tsx", "Child"), sym("a.ts", "I"), "IMPLEMENTS"), "implements");
  assert.ok(has(sym("b.tsx", "run"), sym("b.tsx", "main"), "CALLS"), "same-file call from a method");
});

test("symbol edges: obj.method() is NAME_MATCH only when unique in imported files; unknown calls make no edge", async () => {
  const { edges, sym } = await facts({
    "svc.ts": `export class Svc { save() {} }`,
    "other.ts": `export function save() {}`,
    "use.ts": `import { Svc } from "./svc";
export function f(db: any, s: Svc) { s.save(); db.nothing(); console.log(1); }`,
  });
  const fromF = edges.filter((e) => e.fromId === sym("use.ts", "f"));
  assert.equal(fromF.length, 1);
  assert.equal(fromF[0].toId, sym("svc.ts", "save"));
  assert.equal(fromF[0].confidence, "NAME_MATCH");
});

test("symbol edges: top-level calls come from the file; repeated calls add weight; symbol ids are stable", async () => {
  const a = await facts({ "x.ts": `export function t() {}`, "y.ts": `import { t } from "./x";
t();
export function g() { t(); t(); }` });
  const top = a.edges.find((e) => e.fromKind === "file");
  assert.equal(top?.fromId, "file:y.ts");
  assert.equal(a.edges.find((e) => e.fromKind === "symbol")?.weight, 2);
  const b = await facts({ "x.ts": `// moved down

export function t() {}`, "y.ts": `import { t } from "./x";
export function g() { t(); }` });
  assert.equal(a.sym("x.ts", "t"), b.sym("x.ts", "t"));
});
