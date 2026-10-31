import { getOrgGithubToken } from "../domain/github-app";
import fs from "fs/promises";
import { createHash } from "crypto";
import { db } from "../db";
import { loadSource } from "./source";
import { languageOf, makeFilter } from "./filter";
import { redactSecrets } from "./secrets";
import { isParsable, parseSource } from "./parse";
import { modulePathFor, moduleNameFor, resolveImport } from "./modules";
import { buildChunks } from "./chunk";
import { heuristicChunk, llmEnabled, newStats, summariseChunk, summariseRollup } from "./summarise";

const sha1 = (s: string) => createHash("sha1").update(s).digest("hex");

async function pool<T>(items: T[], n: number, fn: (x: T) => Promise<void>) {
  let i = 0;
  await Promise.all(
    Array.from({ length: n }, async () => {
      while (i < items.length) await fn(items[i++]);
    }),
  );
}

// Entry point. Runs in-process for the MVP; swap for a queue worker when PLT-08 lands.
export async function syncRepository(repoId: string): Promise<string> {
  const repo = await db.repository.findUniqueOrThrow({ where: { id: repoId }, include: { project: true } });
  const run = await db.syncRun.create({ data: { repoId } });
  await db.repository.update({ where: { id: repoId }, data: { syncStatus: "RUNNING" } });
  const progress = (progress: string, extra: object = {}) =>
    db.syncRun.update({ where: { id: run.id }, data: { progress, ...extra } });

  let cleanup: () => Promise<void> = async () => {};
  try {
    await progress("Fetching source");
    const token = await getOrgGithubToken(repo.orgId);
    const src = await loadSource(repo.source, repo.location, repo.branch, token);
    cleanup = src.cleanup;

    const readText = async (p: string) => fs.readFile(`${src.root}/${p}`, "utf8").catch(() => "");
    const filter = makeFilter(await readText(".gitignore"), `${await readText(".brainwhiteignore")}\n${repo.customIgnore}`);

    // ---- read, filter, redact ----
    await progress("Filtering and redacting");
    type Loaded = { path: string; lang: string; content: string; hash: string };
    const loaded: Loaded[] = [];
    let skipped = 0;
    let redactions = 0;
    const redactionsByFile = new Map<string, number>();
    for (const f of src.files) {
      if (filter(f.path, f.size)) { skipped++; continue; }
      const raw = await fs.readFile(f.abs, "utf8").catch(() => "");
      if (!raw || raw.includes("\u0000")) { skipped++; continue; }
      const r = redactSecrets(raw);
      redactions += r.count;
      if (r.count) redactionsByFile.set(f.path, r.count);
      loaded.push({ path: f.path, lang: languageOf(f.path), content: r.text, hash: sha1(r.text) });
    }
    const sha = src.sha ?? sha1(loaded.map((l) => l.path + l.hash).sort().join(""));
    const paths = new Set(loaded.map((l) => l.path));
    await progress(`Parsing ${loaded.length} files`, { filesSeen: src.files.length, filesSkipped: skipped, secretsRedacted: redactions });

    // ---- upsert files; drop deleted ----
    await db.file.deleteMany({ where: { repoId, path: { notIn: [...paths] } } });
    const existing = new Map((await db.file.findMany({ where: { repoId } })).map((f) => [f.path, f]));
    const fileIds = new Map<string, string>();
    const imports = new Map<string, string[]>();
    const symbolsByFile = new Map<string, Awaited<ReturnType<typeof parseSource>>>();
    let parsed = 0;

    for (const l of loaded) {
      const prev = existing.get(l.path);
      const data = {
        language: l.lang, contentHash: l.hash, content: l.content,
        lineCount: l.content.split("\n").length, redactions: redactionsByFile.get(l.path) ?? 0, deletedAt: null,
      };
      const row = prev
        ? await db.file.update({ where: { id: prev.id }, data })
        : await db.file.create({ data: { repoId, path: l.path, ...data } });
      fileIds.set(l.path, row.id);

      let res = null;
      if (isParsable(l.lang)) {
        try { res = await parseSource(l.lang, l.content); parsed++; } catch (e) { console.error("[parse]", l.path, e); res = null; }
      }
      symbolsByFile.set(l.path, res);
      imports.set(l.path, res?.imports ?? []);
      await db.symbol.deleteMany({ where: { fileId: row.id } });
      if (res?.symbols.length)
        await db.symbol.createMany({
          data: res.symbols.map((s) => ({
            fileId: row.id, kind: s.kind, name: s.name, signature: s.signature, doc: s.doc,
            startLine: s.startLine, endLine: s.endLine,
          })),
        });
    }

    // ---- modules ----
    await progress("Detecting modules");
    const modIds = new Map<string, string>();
    const modPathOf = new Map<string, string>();
    for (const l of loaded) modPathOf.set(l.path, modulePathFor(l.path));
    for (const mp of new Set(modPathOf.values())) {
      const m = await db.module.upsert({
        where: { repoId_path: { repoId, path: mp } },
        update: {},
        create: { repoId, path: mp, name: moduleNameFor(mp) },
      });
      modIds.set(mp, m.id);
    }
    await db.module.deleteMany({ where: { repoId, path: { notIn: [...modIds.keys()] } } });
    for (const l of loaded)
      await db.file.update({ where: { id: fileIds.get(l.path)! }, data: { moduleId: modIds.get(modPathOf.get(l.path)!)! } });

    // ---- graph edges ----
    await progress("Building dependency graph");
    await db.graphEdge.deleteMany({ where: { repoId } });
    const fileEdges: { repoId: string; fromId: string; toId: string; type: string; fromKind: string; toKind: string }[] = [];
    const modEdges = new Set<string>();
    for (const l of loaded)
      for (const spec of imports.get(l.path) ?? []) {
        const target = resolveImport(l.path, spec, l.lang, paths);
        if (!target || target === l.path) continue;
        fileEdges.push({ repoId, fromId: fileIds.get(l.path)!, toId: fileIds.get(target)!, type: "IMPORTS", fromKind: "file", toKind: "file" });
        const a = modIds.get(modPathOf.get(l.path)!)!;
        const b = modIds.get(modPathOf.get(target)!)!;
        if (a !== b) modEdges.add(`${a}|${b}`);
      }
    if (fileEdges.length) await db.graphEdge.createMany({ data: fileEdges });
    if (modEdges.size)
      await db.graphEdge.createMany({
        data: [...modEdges].map((k) => {
          const [fromId, toId] = k.split("|");
          return { repoId, fromId, toId, type: "DEPENDS_ON", fromKind: "module", toKind: "module" };
        }),
      });

    // ---- chunks (stable ids) ----
    await progress("Generating learning chunks");
    const stats = newStats();
    const prevChunks = new Map((await db.chunk.findMany({ where: { repoId } })).map((c) => [c.id, c]));
    const seen = new Set<string>();
    const needSummary: { id: string; filePath: string; title: string; code: string; heuristic: string; hash: string }[] = [];

    for (const l of loaded) {
      const syms = symbolsByFile.get(l.path)?.symbols ?? [];
      const lines = l.content.split("\n");
      for (const d of buildChunks(repoId, l.path, l.content, syms)) {
        seen.add(d.id);
        const prev = prevChunks.get(d.id);
        const inside = syms.filter((s) => s.startLine >= d.startLine && s.endLine <= d.endLine);
        const doc = inside.find((s) => s.doc)?.doc ?? "";
        const heuristic = heuristicChunk(l.path, d.title, doc, inside.map((s) => s.kind), d.endLine - d.startLine + 1, l.lang);
        const changed = prev ? prev.contentHash !== d.contentHash : false;
        const base = {
          moduleId: modIds.get(modPathOf.get(l.path)!)!, repoId, title: d.title, filePath: l.path,
          startLine: d.startLine, endLine: d.endLine, estMinutes: d.estMinutes, difficulty: d.difficulty,
          contentHash: d.contentHash, sha,
        };
        if (prev) {
          await db.chunk.update({ where: { id: d.id }, data: { ...base, status: changed ? "UPDATED" : prev.status } });
        } else {
          await db.chunk.create({ data: { id: d.id, ...base, summary: heuristic } });
        }
        // content-hash cache: only (re)summarise when the code changed or never summarised by LLM
        if (!prev || changed || (llmEnabled() && prev.summaryHash !== d.contentHash))
          needSummary.push({ id: d.id, filePath: l.path, title: d.title, code: lines.slice(d.startLine - 1, d.endLine).join("\n"), heuristic, hash: d.contentHash });
      }
    }
    await db.chunk.deleteMany({ where: { repoId, id: { notIn: [...seen] } } });

    // ---- summaries (bottom-up) ----
    await progress(`Summarising ${needSummary.length} chunks`);
    await pool(needSummary, 4, async (c) => {
      const s = await summariseChunk(c, stats);
      await db.chunk.update({ where: { id: c.id }, data: { summary: s.text, summaryHash: s.llm ? c.hash : "" } });
    });

    await progress("Rolling up file, module and repo summaries");
    const files = await db.file.findMany({ where: { repoId }, include: { symbols: true } });
    const chunkSummaries = await db.chunk.findMany({ where: { repoId }, select: { filePath: true, moduleId: true, summary: true } });
    for (const f of files) {
      if (f.summaryHash === f.contentHash && f.summary) continue;
      const parts = chunkSummaries.filter((c) => c.filePath === f.path).map((c) => c.summary);
      const names = f.symbols.slice(0, 8).map((s) => s.name);
      const heuristic = `${f.path.split("/").pop()}: ${f.language} file, ${f.lineCount} lines${names.length ? `, defines ${names.join(", ")}` : ""}.`;
      const text = parts.length > 1 ? await summariseRollup({ kind: "file", name: f.path, parts, heuristic }, stats) : parts[0] ?? heuristic;
      await db.file.update({ where: { id: f.id }, data: { summary: text, summaryHash: f.contentHash } });
    }
    const modules = await db.module.findMany({ where: { repoId }, include: { files: true } });
    const modSummaries: string[] = [];
    for (const m of modules) {
      const fileSums = (await db.file.findMany({ where: { moduleId: m.id }, select: { path: true, summary: true } })).map((f) => f.summary);
      const top = m.files.slice(0, 5).map((f) => f.path.split("/").pop()).join(", ");
      const heuristic = `${m.name}: ${m.files.length} files (${top}${m.files.length > 5 ? ", …" : ""}).`;
      const summary = await summariseRollup({ kind: "module", name: m.name, parts: fileSums, heuristic }, stats);
      await db.module.update({ where: { id: m.id }, data: { summary, description: summary.split(".")[0] + "." } });
      modSummaries.push(`${m.name}: ${summary}`);
    }
    const langCount: Record<string, number> = {};
    for (const l of loaded) langCount[l.lang] = (langCount[l.lang] ?? 0) + 1;
    const repoSummary = await summariseRollup(
      { kind: "repo", name: repo.name, parts: modSummaries, heuristic: `${repo.name}: ${loaded.length} files across ${modules.length} modules.` },
      stats,
    );

    await db.repository.update({
      where: { id: repoId },
      data: { syncStatus: "HEALTHY", lastSyncedSha: sha, lastSyncedAt: new Date(), summary: repoSummary, languages: JSON.stringify(langCount) },
    });
    await db.syncRun.update({
      where: { id: run.id },
      data: {
        status: "SUCCESS", finishedAt: new Date(), sha, filesParsed: parsed, progress: "Done",
        summariesGenerated: stats.calls,
      },
    });
    return run.id;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    try {
      await db.repository.update({ where: { id: repoId }, data: { syncStatus: "FAILED" } });
      await db.syncRun.update({ where: { id: run.id }, data: { status: "FAILED", finishedAt: new Date(), error: msg, progress: "Failed" } });
    } catch (err) {
      console.error("[pipeline] Failed to record error state:", err);
    }
    return run.id;
  } finally {
    await cleanup();
  }
}
