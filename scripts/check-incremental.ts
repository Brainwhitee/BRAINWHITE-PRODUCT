// Integration check for incremental sync (needs a LOCAL Postgres; refuses to touch any other database).
//   npm run check:incremental
// Builds a tiny TypeScript project on disk, syncs it twice:
//   repo A: full sync, then edit files, then incremental sync of just those files
//   repo B: full sync of the edited project
// and asserts A and B hold the same graph (files, symbols, chunks, edges, module edges).
// Also checks the safe fallbacks (added file -> full sync) and a no-op change. Cleans up after itself.
import fs from "fs";
import http from "http";
import os from "os";
import path from "path";

try { (process as unknown as { loadEnvFile?: (p?: string) => void }).loadEnvFile?.(); } catch { /* no .env */ }
const url = process.env.DATABASE_URL ?? "";
if (!/@(localhost|127\.0\.0\.1)[:/]/.test(url)) {
  console.error("Refusing to run: DATABASE_URL is not a local database. This check creates and deletes rows.");
  process.exit(2);
}
process.env.ALLOW_LOCAL_REPOS = "true";

let failures = 0;
const check = (name: string, ok: boolean, detail = "") => { console.log(`${ok ? "PASS" : "FAIL"}  ${name}${ok ? "" : "  -> " + detail}`); if (!ok) failures++; };

async function main() {
  const { db } = await import("../src/lib/db");
  const { syncRepository } = await import("../src/lib/analyser/pipeline");
  const { syncAuto } = await import("../src/lib/analyser/incremental");
  // Prisma loads .env when the client is imported, so the keys must be removed after the imports: no LLM, summaries stay heuristic and deterministic
  for (const k of ["GEMINI_API_KEY", "GROQ_API_KEY", "GROK_API_KEY", "XAI_API_KEY"]) delete process.env[k];

  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "bw-inc-"));
  const w = (p: string, s: string) => { fs.mkdirSync(path.dirname(path.join(dir, p)), { recursive: true }); fs.writeFileSync(path.join(dir, p), s); };
  w("tsconfig.json", JSON.stringify({ compilerOptions: { baseUrl: ".", paths: { "@/*": ["src/*"] } } }));
  w("src/lib/b.ts", `export function b1() {\n  return 1;\n}\nexport function b2() {\n  return 2;\n}\n`);
  w("src/lib/a.ts", `import { b1 } from "@/lib/b";\nexport function a1() {\n  return b1() + 1;\n}\n`);
  w("src/app/c.ts", `import { a1 } from "../lib/a";\nimport { b2 } from "@/lib/b";\nexport function c1() {\n  return a1() + b2();\n}\n`);
  w("src/app/d.ts", `export function d1() {\n  return 0;\n}\n`);
  w("src/app/f.ts", `import { b5 } from "@/lib/b";\nexport function f1() {\n  return b5();\n}\n`); // b5 does not exist yet: no edge until b.ts defines it

  const org = await db.organisation.findFirstOrThrow();
  const project = await db.project.findFirstOrThrow({ where: { orgId: org.id } });
  const mk = (name: string) => db.repository.create({ data: { orgId: org.id, projectId: project.id, name, source: "local", location: dir, branch: "main" } });
  const A = await mk("inc-check-A"), B = await mk("inc-check-B");

  // Graph in a form that does not depend on generated ids, so two different repos can be compared.
  async function snapshot(repoId: string) {
    const files = await db.file.findMany({ where: { repoId, deletedAt: null }, include: { symbols: true, module: true } });
    const label = new Map<string, string>();
    for (const f of files) { label.set(f.id, f.path); for (const s of f.symbols) label.set(s.id, `${f.path}#${s.kind}:${s.name}`); }
    for (const m of await db.module.findMany({ where: { repoId } })) label.set(m.id, "module:" + m.path);
    const edges = (await db.graphEdge.findMany({ where: { repoId } })).map((e) => `${e.type}|${e.confidence}|${e.weight}|${label.get(e.fromId) ?? "?" + e.fromId}|${label.get(e.toId) ?? "?" + e.toId}`).sort();
    const chunks = (await db.chunk.findMany({ where: { repoId } })).map((c) => `${c.filePath}|${c.title}|${c.startLine}-${c.endLine}|${c.contentHash}|${c.summary}`).sort(); // status is checked separately: a repo seen for the first time has no "UPDATED" history
    return {
      files: files.map((f) => `${f.path}|${f.contentHash}|${f.lineCount}|${f.module?.path}|${f.summary}`).sort(),
      symbols: files.flatMap((f) => f.symbols.map((s) => `${f.path}|${s.kind}|${s.name}|${s.startLine}-${s.endLine}`)).sort(),
      chunks, edges,
    };
  }
  const diff = (x: string[], y: string[]) => [...x.filter((v) => !y.includes(v)).map((v) => "- " + v), ...y.filter((v) => !x.includes(v)).map((v) => "+ " + v)].slice(0, 6).join("\n    ");
  const lastRun = async (repoId: string) => db.syncRun.findFirstOrThrow({ where: { repoId }, orderBy: { startedAt: "desc" } });

  try {
    // ---- baseline ----
    await syncRepository(A.id);
    const base = await snapshot(A.id);
    check("baseline full sync created files, symbols and edges", base.files.length === 6 && base.symbols.length === 6 && base.edges.some((e) => e.startsWith("IMPORTS")), `files=${base.files.length} symbols=${base.symbols.length}`);
    const beforeSha = (await db.repository.findUniqueOrThrow({ where: { id: A.id } })).lastSyncedSha;

    // ---- edit two files: rename b2->b3, add b4 that calls b1, a1 now calls b4 ----
    w("src/lib/b.ts", `export function b1() {\n  return 1;\n}\nexport function b3() {\n  return 3;\n}\nexport function b4() {\n  return b1() * 4;\n}\nexport function b5() {\n  return 5;\n}\n`);
    w("src/lib/a.ts", `import { b1, b4 } from "@/lib/b";\nexport function a1() {\n  return b1() + b4();\n}\n`);

    const runId = await syncAuto(A.id, { added: [], modified: ["src/lib/b.ts", "src/lib/a.ts"], removed: [], before: beforeSha, after: null });
    const inc = await lastRun(A.id);
    check("push of 2 modified files ran as INCREMENTAL", inc.id === runId && inc.status === "SUCCESS" && inc.progress.startsWith("Incremental:") && inc.filesParsed === 2, `${inc.status} "${inc.progress}" parsed=${inc.filesParsed}`);

    await syncRepository(B.id);
    const a = await snapshot(A.id), b = await snapshot(B.id);
    for (const k of ["files", "symbols", "chunks", "edges"] as const) {
      const same = JSON.stringify(a[k]) === JSON.stringify(b[k]);
      check(`incremental result equals a fresh full sync: ${k} (${a[k].length})`, same, diff(a[k], b[k]));
    }
    const statusOf = async (repoId: string, file: string) => (await db.chunk.findMany({ where: { repoId, filePath: file } })).map((c) => c.status);
    // a.ts keeps symbol `a1` (same stable chunk id) but its code changed -> UPDATED. b.ts changed its symbol names, so its chunk id
    // changed: the old chunk is gone and a new one exists (ACTIVE), which is how renames are meant to behave.
    check("a chunk whose symbols are unchanged but whose code changed is flagged UPDATED (stale-content badge)", (await statusOf(A.id, "src/lib/a.ts")).includes("UPDATED"), JSON.stringify(await statusOf(A.id, "src/lib/a.ts")));
    check("chunks of untouched files stay ACTIVE", (await statusOf(A.id, "src/app/c.ts")).every((x) => x === "ACTIVE"));
    check("c.ts's call into the renamed b2 no longer dangles (no edge to a missing symbol)", !a.edges.some((e) => e.includes("|?")), a.edges.filter((e) => e.includes("|?")).join("; "));
    check("f1 -> b5 edge appears although f.ts itself did not change (importer of a changed file is re-linked)", a.edges.some((e) => e.startsWith("CALLS") && e.includes("src/app/f.ts#function:f1") && e.includes("src/lib/b.ts#function:b5")), "missing edge");
    check("a1 -> b4 call edge exists after the edit", a.edges.some((e) => e.startsWith("CALLS") && e.includes("src/lib/a.ts#function:a1") && e.includes("src/lib/b.ts#function:b4")));

    // ---- a change that touches nothing relevant (same bytes): incremental, nothing re-analysed ----
    const sha2 = (await db.repository.findUniqueOrThrow({ where: { id: A.id } })).lastSyncedSha;
    await syncAuto(A.id, { added: [], modified: ["src/app/d.ts"], removed: [], before: sha2, after: null });
    const same = await lastRun(A.id);
    check("touching a file without changing it is an incremental run with 0 files re-analysed", same.status === "SUCCESS" && same.progress.startsWith("Incremental:") && same.filesParsed === 0, `"${same.progress}" parsed=${same.filesParsed}`);

    // ---- a GitHub-sourced repo: real fetch path against a mock GitHub API that rate-limits the first request ----
    w("src/app/d.ts", `export function d1() {\n  return 1;\n}\nexport function d2() {\n  return d1() + 1;\n}\n`);
    let hits = 0;
    const server = http.createServer((req, res) => {
      const m = new URL(req.url ?? "/", "http://x").pathname.match(/^\/repos\/mock\/proj\/contents\/(.+)$/);
      if (!m) { res.statusCode = 404; res.end(); return; }
      hits++;
      if (hits === 1) { res.statusCode = 429; res.setHeader("retry-after", "1"); res.end("slow down"); return; } // first call is rate limited
      const f = path.join(dir, decodeURIComponent(m[1]));
      if (!fs.existsSync(f)) { res.statusCode = 404; res.end(); return; }
      res.end(fs.readFileSync(f));
    });
    await new Promise<void>((r) => server.listen(0, "127.0.0.1", r));
    process.env.GITHUB_API_BASE = `http://127.0.0.1:${(server.address() as { port: number }).port}`;
    try {
      const shaGh = (await db.repository.findUniqueOrThrow({ where: { id: A.id } })).lastSyncedSha;
      await db.repository.update({ where: { id: A.id }, data: { source: "github", location: "mock/proj" } });
      const t0 = Date.now();
      await syncAuto(A.id, { added: [], modified: ["src/app/d.ts"], removed: [], before: shaGh, after: "abc123" });
      const gh = await lastRun(A.id);
      check("GitHub push with a code change ran INCREMENTAL through the GitHub fetch path", gh.status === "SUCCESS" && gh.progress.startsWith("Incremental:") && gh.filesParsed === 1, `${gh.status} "${gh.progress}" parsed=${gh.filesParsed} err=${gh.error}`);
      check("the rate-limited request (429 Retry-After: 1) was retried, not failed", hits === 2 && Date.now() - t0 >= 900, `hits=${hits} elapsed=${Date.now() - t0}ms`);
      check("the repo now records the pushed commit as last synced", (await db.repository.findUniqueOrThrow({ where: { id: A.id } })).lastSyncedSha === "abc123");
      const C = await mk("inc-check-C");
      try {
        await syncRepository(C.id);
        const ga = await snapshot(A.id), gc = await snapshot(C.id);
        for (const k of ["files", "symbols", "chunks", "edges"] as const) check(`GitHub-path incremental equals a fresh full sync: ${k} (${ga[k].length})`, JSON.stringify(ga[k]) === JSON.stringify(gc[k]), diff(ga[k], gc[k]));
        check("d2 -> d1 call edge exists after the GitHub push", ga.edges.some((e) => e.startsWith("CALLS") && e.includes("src/app/d.ts#function:d2") && e.includes("src/app/d.ts#function:d1")));
      } finally {
        await db.repository.deleteMany({ where: { id: C.id } });
      }
    } finally {
      server.close();
      delete process.env.GITHUB_API_BASE;
      await db.repository.update({ where: { id: A.id }, data: { source: "local", location: dir } });
    }

    // ---- safe fallbacks ----
    w("src/app/e.ts", `import { d1 } from "./d";\nexport const e1 = () => d1();\n`);
    const sha3 = (await db.repository.findUniqueOrThrow({ where: { id: A.id } })).lastSyncedSha;
    await syncAuto(A.id, { added: ["src/app/e.ts"], modified: [], removed: [], before: sha3, after: null });
    const full = await lastRun(A.id);
    check("an added file falls back to a FULL sync", full.status === "SUCCESS" && full.progress.startsWith("Done."), `"${full.progress}"`);
    check("...and the new file is in the graph", (await snapshot(A.id)).edges.some((e) => e.startsWith("IMPORTS") && e.includes("src/app/e.ts") && e.includes("src/app/d.ts")));

    const sha4 = (await db.repository.findUniqueOrThrow({ where: { id: A.id } })).lastSyncedSha;
    await syncAuto(A.id, { added: [], modified: ["src/app/d.ts"], removed: [], before: "not-the-last-sha", after: null });
    const gap = await lastRun(A.id);
    check("a history gap (push parent != last synced commit) falls back to a FULL sync", gap.progress.startsWith("Done."), `"${gap.progress}"`);
    void sha4;

    // ---- locking: while a sync holds the repo, a second one returns "" instead of overlapping ----
    await db.repository.update({ where: { id: A.id }, data: { syncStatus: "RUNNING" } });
    await db.syncRun.create({ data: { repoId: A.id, status: "RUNNING" } });
    const blocked = await syncAuto(A.id, { added: [], modified: ["src/app/d.ts"], removed: [], before: null, after: null });
    check("a concurrent push is refused while another sync is RUNNING", blocked === "", `got run id ${blocked}`);
  } finally {
    await db.repository.deleteMany({ where: { id: { in: [A.id, B.id] } } });
    fs.rmSync(dir, { recursive: true, force: true });
    await db.$disconnect();
  }
  console.log(failures === 0 ? "\nALL CHECKS PASSED" : `\n${failures} CHECK(S) FAILED`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((e) => { console.error(e); process.exit(1); });
