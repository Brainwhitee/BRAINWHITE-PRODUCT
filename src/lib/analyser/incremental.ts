// Push-driven incremental sync (Phase 6b).
// Re-analyses only the files a push modified: fetch just those files, re-parse them, replace their symbols, chunks and
// outgoing edges, and leave everything else in the database untouched. Anything that could change the rest of the graph
// (files added/removed, config files, force pushes, history gaps, too many files) is decided by planSync() and falls
// back to the full sync. Any error during an incremental run also falls back to the full sync.
import fs from "fs/promises";
import path from "path";
import { createHash } from "crypto";
import { db } from "../db";
import { claimRepo, syncRepository } from "./pipeline";
import { languageOf, makeFilter } from "./filter";
import { redactSecrets } from "./secrets";
import { isParsable, parseSource, type ParsedSymbol } from "./parse";
import { createResolver, emptyImportStats } from "./resolve-ts";
import { buildChunks } from "./chunk";
import { buildSymbolEdges, withSymbolIds, type FileFacts, type SymbolWithId } from "./edges";
import { heuristicChunk, newStats, summariseChunk, summariseRollup } from "./summarise";
import { isConfigFile, planSync, type ChangeSet } from "./sync-plan";
import { fetchWithRetry, rateLimitHint } from "../github-fetch";

export type FetchFile = (path: string) => Promise<string | null>;
const SYMBOL_TYPES = ["CALLS", "REFERENCES", "EXTENDS", "IMPLEMENTS"];
const MAX_IMPORTERS = 120; // more importers than this and a full sync is just as cheap
const sha1 = (s: string) => createHash("sha1").update(s).digest("hex");

type RepoRow = { id: string; source: string; location: string; branch: string };

function defaultFetch(repo: RepoRow, ref: string): FetchFile {
  if (repo.source === "local") {
    const root = path.resolve(repo.location);
    return async (p) => {
      const abs = path.resolve(root, p);
      if (abs !== root && !abs.startsWith(root + path.sep)) return null; // never read outside the repo folder
      return fs.readFile(abs, "utf8").catch(() => null);
    };
  }
  const headers: Record<string, string> = { Accept: "application/vnd.github.raw", "User-Agent": "brainwhite" };
  if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  return async (p) => {
    const url = `${process.env.GITHUB_API_BASE ?? "https://api.github.com"}/repos/${repo.location}/contents/${p.split("/").map(encodeURIComponent).join("/")}?ref=${encodeURIComponent(ref)}`;
    const r = await fetchWithRetry(url, { headers });
    if (r.status === 404) return null;
    if (!r.ok) throw new Error(rateLimitHint(r) ?? `GitHub fetch failed for ${p} (${r.status})`);
    return r.text();
  };
}

// Entry point for pushes and manual triggers. Returns the SyncRun id ("" when another sync already holds the lock).
export async function syncAuto(repoId: string, change: ChangeSet, fetchFile?: FetchFile): Promise<string> {
  const repo = await db.repository.findUniqueOrThrow({ where: { id: repoId } });
  const rule = async (p: string) => (await db.file.findFirst({ where: { repoId, path: p }, select: { content: true } }))?.content ?? "";
  const filter = makeFilter(await rule(".gitignore"), `${await rule(".brainwhiteignore")}\n${repo.customIgnore}`);
  const plan = planSync({ lastSha: repo.lastSyncedSha, change, filter });

  if (plan.mode === "full") {
    console.log(`[sync] ${repo.location}: full sync (${plan.reason})`);
    return syncRepository(repoId);
  }
  try {
    return await runIncremental(repo, plan.mode === "noop" ? [] : plan.files, change, plan.reason, fetchFile);
  } catch (e) {
    console.error(`[sync] ${repo.location}: incremental failed, falling back to full sync:`, e);
    return syncRepository(repoId);
  }
}

async function runIncremental(repo: RepoRow & { lastSyncedSha: string | null }, files: string[], change: ChangeSet, why: string, fetchFile?: FetchFile): Promise<string> {
  const repoId = repo.id;
  if (!(await claimRepo(repoId))) return "";
  const run = await db.syncRun.create({ data: { repoId, progress: `Incremental: ${why}` } });
  const progress = (p: string, extra: object = {}) => db.syncRun.update({ where: { id: run.id }, data: { progress: p, ...extra } });

  try {
    const fetch = fetchFile ?? defaultFetch(repo, change.after ?? repo.branch);

    // ---- 1. fetch + redact the modified files ----
    await progress(`Incremental: fetching ${files.length} file(s)`);
    const rows = files.length ? await db.file.findMany({ where: { repoId, path: { in: files }, deletedAt: null } }) : [];
    if (rows.length !== files.length) throw new Error("a modified file is not in the index yet");
    type Changed = { path: string; lang: string; content: string; hash: string; redactions: number; row: (typeof rows)[number] };
    const changed: Changed[] = [];
    for (const row of rows) {
      const raw = await fetch(row.path);
      if (raw == null || raw.includes("\u0000")) throw new Error(`could not read ${row.path}`);
      const r = redactSecrets(raw);
      const hash = sha1(r.text);
      if (hash === row.contentHash) continue; // touched but identical
      changed.push({ path: row.path, lang: languageOf(row.path), content: r.text, hash, redactions: r.count, row });
    }
    if (changed.some((c) => isConfigFile(c.path))) throw new Error("config file in change set");
    const changedIds = changed.map((c) => c.row.id);

    // ---- 2. re-parse, replace symbols ----
    await progress(`Incremental: parsing ${changed.length} file(s)`);
    const oldSymIds = new Set((await db.symbol.findMany({ where: { fileId: { in: changedIds } }, select: { id: true } })).map((s) => s.id));
    const parsed = new Map<string, Awaited<ReturnType<typeof parseSource>>>();
    const symsByPath = new Map<string, SymbolWithId[]>();
    const newSymIds = new Set<string>();
    for (const c of changed) {
      let res = null;
      if (isParsable(c.lang)) { try { res = await parseSource(c.lang, c.content); } catch (e) { console.error("[parse]", c.path, e); } }
      parsed.set(c.path, res);
      await db.file.update({
        where: { id: c.row.id },
        data: { language: c.lang, contentHash: c.hash, content: c.content, lineCount: c.content.split("\n").length, redactions: c.redactions, deletedAt: null },
      });
      await db.symbol.deleteMany({ where: { fileId: c.row.id } });
      const withIds = withSymbolIds(repoId, c.path, res?.symbols ?? []);
      symsByPath.set(c.path, withIds);
      for (const s of withIds) newSymIds.add(s.id);
      if (withIds.length)
        await db.symbol.createMany({ data: withIds.map((s) => ({ id: s.id, fileId: c.row.id, kind: s.kind, name: s.name, signature: s.signature, doc: s.doc, startLine: s.startLine, endLine: s.endLine })) });
    }

    // ---- 3. resolver over the whole indexed tree (config files come from the database) ----
    await progress("Incremental: updating graph");
    const allFiles = await db.file.findMany({ where: { repoId, deletedAt: null }, select: { id: true, path: true, language: true, moduleId: true, contentHash: true } });
    const paths = new Set(allFiles.map((f) => f.path));
    const idOf = new Map(allFiles.map((f) => [f.path, f.id]));
    const cfgPaths = allFiles.filter((f) => isConfigFile(f.path)).map((f) => f.path);
    const cfg = new Map((cfgPaths.length ? await db.file.findMany({ where: { repoId, path: { in: cfgPaths } }, select: { path: true, content: true } }) : []).map((f) => [f.path, f.content]));
    const resolve = createResolver(paths, (p) => cfg.get(p));

    // Files that import a changed file are not edited, but their call/reference edges depend on what the changed file
    // now exports (e.g. it gained a symbol they already import). Re-parse them for their refs only; their rows stay as is.
    const changedSet = new Set(changedIds);
    const importerIds = [...new Set((await db.graphEdge.findMany({ where: { repoId, type: "IMPORTS", toId: { in: changedIds } }, select: { fromId: true } })).map((e) => e.fromId))].filter((id) => !changedSet.has(id));
    if (importerIds.length > MAX_IMPORTERS) throw new Error(`${importerIds.length} files import the changed files (limit ${MAX_IMPORTERS})`);
    const importers = importerIds.length ? await db.file.findMany({ where: { id: { in: importerIds } }, select: { id: true, path: true, language: true, content: true } }) : [];
    const importerParsed = new Map<string, NonNullable<Awaited<ReturnType<typeof parseSource>>>>();
    for (const f of importers) {
      if (!isParsable(f.language)) continue;
      const res = await parseSource(f.language, f.content); // a failure throws: the full sync is the fallback
      if (res) importerParsed.set(f.path, res);
    }

    // ---- 4. outgoing import edges of the changed files ----
    await db.graphEdge.deleteMany({ where: { repoId, type: "IMPORTS", fromId: { in: changedIds } } });
    const stats = emptyImportStats();
    const importEdges: { repoId: string; fromId: string; toId: string; type: string; fromKind: string; toKind: string }[] = [];
    for (const c of changed) {
      const targets = new Set<string>();
      for (const spec of parsed.get(c.path)?.imports ?? []) {
        const r = resolve(c.path, spec, c.lang);
        stats[r.kind]++;
        if (r.kind === "internal" && r.target !== c.path) targets.add(r.target);
      }
      for (const t of targets) importEdges.push({ repoId, fromId: c.row.id, toId: idOf.get(t)!, type: "IMPORTS", fromKind: "file", toKind: "file" });
    }
    if (importEdges.length) await db.graphEdge.createMany({ data: importEdges });

    // ---- 5. module dependency edges, rebuilt from the (now current) import edges ----
    const modOf = new Map(allFiles.map((f) => [f.id, f.moduleId]));
    const allImports = await db.graphEdge.findMany({ where: { repoId, type: "IMPORTS" }, select: { fromId: true, toId: true } });
    const modEdges = new Set<string>();
    for (const e of allImports) {
      const a = modOf.get(e.fromId), b = modOf.get(e.toId);
      if (a && b && a !== b) modEdges.add(`${a}|${b}`);
    }
    await db.graphEdge.deleteMany({ where: { repoId, type: "DEPENDS_ON" } });
    if (modEdges.size)
      await db.graphEdge.createMany({ data: [...modEdges].map((k) => { const [fromId, toId] = k.split("|"); return { repoId, fromId, toId, type: "DEPENDS_ON", fromKind: "module", toKind: "module" }; }) });

    // ---- 6. symbol edges: drop edges out of the changed files and into symbols that no longer exist, then re-derive ----
    const removedSymIds = [...oldSymIds].filter((id) => !newSymIds.has(id));
    // outgoing symbol edges of re-linked importers are re-derived too, so drop them with the changed files' own
    const importerSymIds = importerIds.length ? (await db.symbol.findMany({ where: { fileId: { in: importerIds } }, select: { id: true } })).map((s) => s.id) : [];
    const relinkFileIds = [...changedIds, ...importerIds];
    if (changedIds.length)
      await db.graphEdge.deleteMany({
        where: { repoId, type: { in: SYMBOL_TYPES }, OR: [{ fromId: { in: [...oldSymIds, ...importerSymIds] } }, { fromKind: "file", fromId: { in: relinkFileIds } }, { toId: { in: removedSymIds } }] },
      });
    const dbSyms = await db.symbol.findMany({ where: { file: { repoId } }, select: { id: true, fileId: true, kind: true, name: true, signature: true, doc: true, startLine: true, endLine: true } });
    const symsOfFile = new Map<string, SymbolWithId[]>();
    for (const s of dbSyms) {
      const list = symsOfFile.get(s.fileId) ?? [];
      list.push({ id: s.id, kind: s.kind as ParsedSymbol["kind"], name: s.name, signature: s.signature, doc: s.doc, startLine: s.startLine, endLine: s.endLine, depth: 0 });
      symsOfFile.set(s.fileId, list);
    }
    const changedPaths = new Set(changed.map((c) => c.path));
    const facts: FileFacts[] = allFiles.map((f) => {
      const fresh = changedPaths.has(f.path) ? parsed.get(f.path) : importerParsed.get(f.path); // edges come only from re-parsed files
      return {
        path: f.path, lang: f.language, fileId: f.id,
        symbols: changedPaths.has(f.path) ? symsByPath.get(f.path)! : fresh ? withSymbolIds(repoId, f.path, fresh.symbols) : symsOfFile.get(f.id) ?? [], // a fresh parse keeps `depth`
        refs: fresh?.refs,
      };
    });
    const symEdges = buildSymbolEdges(facts, resolve).map((e) => ({ repoId, ...e }));
    for (let i = 0; i < symEdges.length; i += 2000) await db.graphEdge.createMany({ data: symEdges.slice(i, i + 2000) });

    // ---- 7. chunks of the changed files (same rules as the full sync: stable ids, summary cache by content hash) ----
    await progress("Incremental: updating learning chunks");
    const sha = repo.source === "local" ? sha1(allFiles.map((f) => f.path + f.contentHash).sort().join("")) : change.after ?? repo.lastSyncedSha;
    const llm = newStats();
    const needSummary: { id: string; filePath: string; title: string; code: string; heuristic: string; hash: string }[] = [];
    for (const c of changed) {
      const syms = parsed.get(c.path)?.symbols ?? [];
      const lines = c.content.split("\n");
      const prevChunks = new Map((await db.chunk.findMany({ where: { repoId, filePath: c.path } })).map((k) => [k.id, k]));
      const seen = new Set<string>();
      for (const d of buildChunks(repoId, c.path, c.content, syms)) {
        seen.add(d.id);
        const prev = prevChunks.get(d.id);
        const inside = syms.filter((s) => s.startLine >= d.startLine && s.endLine <= d.endLine);
        const doc = inside.find((s) => s.doc)?.doc ?? "";
        const heuristic = heuristicChunk(c.path, d.title, doc, inside.map((s) => s.kind), d.endLine - d.startLine + 1, c.lang);
        const didChange = prev ? prev.contentHash !== d.contentHash : false;
        const base = {
          moduleId: c.row.moduleId!, repoId, title: d.title, filePath: c.path, startLine: d.startLine, endLine: d.endLine,
          estMinutes: d.estMinutes, difficulty: d.difficulty, contentHash: d.contentHash, sha,
        };
        if (prev) await db.chunk.update({ where: { id: d.id }, data: { ...base, status: didChange ? "UPDATED" : prev.status } });
        else await db.chunk.create({ data: { id: d.id, ...base, summary: heuristic } });
        if (!prev || didChange) needSummary.push({ id: d.id, filePath: c.path, title: d.title, code: lines.slice(d.startLine - 1, d.endLine).join("\n"), heuristic, hash: d.contentHash });
      }
      await db.chunk.deleteMany({ where: { repoId, filePath: c.path, id: { notIn: [...seen] } } });
    }
    await progress(`Incremental: summarising ${needSummary.length} chunk(s)`);
    for (const k of needSummary) {
      const s = await summariseChunk(k, llm);
      await db.chunk.update({ where: { id: k.id }, data: { summary: s.text, summaryHash: s.llm ? k.hash : "" } });
    }

    // ---- 8. roll up the changed files and the modules they live in ----
    const fresh = await db.file.findMany({ where: { id: { in: changedIds } }, include: { symbols: true } });
    for (const f of fresh) {
      const parts = (await db.chunk.findMany({ where: { repoId, filePath: f.path }, select: { summary: true } })).map((k) => k.summary);
      const names = f.symbols.slice(0, 8).map((s) => s.name);
      const heuristic = `${f.path.split("/").pop()}: ${f.language} file, ${f.lineCount} lines${names.length ? `, defines ${names.join(", ")}` : ""}.`;
      const text = parts.length > 1 ? await summariseRollup({ kind: "file", name: f.path, parts, heuristic }, llm) : parts[0] ?? heuristic;
      await db.file.update({ where: { id: f.id }, data: { summary: text, summaryHash: f.contentHash } });
    }
    for (const mid of new Set(fresh.map((f) => f.moduleId).filter((x): x is string => !!x))) {
      const m = await db.module.findUniqueOrThrow({ where: { id: mid }, include: { files: true } });
      const fileSums = (await db.file.findMany({ where: { moduleId: mid }, select: { summary: true } })).map((f) => f.summary);
      const top = m.files.slice(0, 5).map((f) => f.path.split("/").pop()).join(", ");
      const heuristic = `${m.name}: ${m.files.length} files (${top}${m.files.length > 5 ? ", …" : ""}).`;
      const summary = await summariseRollup({ kind: "module", name: m.name, parts: fileSums, heuristic }, llm);
      await db.module.update({ where: { id: mid }, data: { summary, description: summary.split(".")[0] + "." } });
    }

    await db.repository.update({ where: { id: repoId }, data: { syncStatus: "HEALTHY", lastSyncedSha: sha, lastSyncedAt: new Date() } });
    await db.syncRun.update({
      where: { id: run.id },
      data: {
        status: "SUCCESS", finishedAt: new Date(), sha, filesParsed: changed.length, filesSeen: files.length, summariesGenerated: llm.calls,
        progress: `Incremental: ${changed.length} file(s) re-analysed (${why}); imports in those files: ${stats.internal} resolved, ${stats.unresolved} unresolved`,
      },
    });
    return run.id;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    await db.repository.update({ where: { id: repoId }, data: { syncStatus: "FAILED" } });
    await db.syncRun.update({ where: { id: run.id }, data: { status: "FAILED", finishedAt: new Date(), error: msg, progress: "Incremental failed, falling back to a full sync" } });
    throw e; // syncAuto catches this and runs the full sync
  }
}
