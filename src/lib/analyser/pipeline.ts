import { getOrgGithubToken } from "../domain/github-app";
import fs from "fs/promises";
import { createHash } from "crypto";
import { db } from "../db";
import { loadSource } from "./source";
import { languageOf, makeFilter } from "./filter";
import { redactSecrets } from "./secrets";
import { isParsable, parseSource } from "./parse";
import { moduleNameFor } from "./modules";
import { assignModules, type FileGraph } from "./cluster";
import { createResolver, emptyImportStats } from "./resolve-ts";
import { buildSymbolEdges, withSymbolIds, CALL_EDGE_LANGS, type FileFacts, type SymbolWithId } from "./edges";
import { SYNC_TAKEOVER_MS } from "./constants";
import { buildChunks } from "./chunk";
import {
  heuristicChunk,
  llmEnabled,
  newStats,
  summariseRollup,
  buildConceptualModuleSummary,
} from "./summarise";
import { callAi } from "../ai";

const sha1 = (s: string) => createHash("sha1").update(s).digest("hex");

async function pool<T>(items: T[], n: number, fn: (x: T) => Promise<void>) {
  let i = 0;
  await Promise.all(
    Array.from({ length: Math.min(n, items.length || 1) }, async () => {
      while (i < items.length) {
        const item = items[i++];
        if (item !== undefined) await fn(item);
      }
    })
  );
}

// Claim a repository for the INCREMENTAL sync (incremental.ts): refuses while another sync is running, unless that run is older than
// SYNC_TAKEOVER_MS (a stalled run). The full sync below deliberately takes no lock, so "Restart Sync" always works.
export async function claimRepo(repoId: string): Promise<boolean> {
  const claimed = await db.repository.updateMany({
    where: {
      id: repoId,
      OR: [
        { syncStatus: { not: "RUNNING" } },
        { syncRuns: { none: { status: "RUNNING", startedAt: { gte: new Date(Date.now() - SYNC_TAKEOVER_MS) } } } },
      ],
    },
    data: { syncStatus: "RUNNING" },
  });
  return claimed.count > 0;
}

// Entry point: High-throughput, serverless-safe codebase ingestion pipeline
export async function syncRepository(repoId: string): Promise<string> {
  const repo = await db.repository.findUniqueOrThrow({ where: { id: repoId }, include: { project: true } });
  const run = await db.syncRun.create({ data: { repoId } });
  await db.repository.update({ where: { id: repoId }, data: { syncStatus: "RUNNING" } });
  const progress = (progress: string, extra: object = {}) =>
    db.syncRun.update({ where: { id: run.id }, data: { progress, ...extra } });

  let cleanup: () => Promise<void> = async () => {};
  let parsed = 0;
  try {
    await progress("Fetching repository source");
    const token = await getOrgGithubToken(repo.orgId);
    const src = await loadSource(repo.source, repo.location, repo.branch, token);
    cleanup = src.cleanup;

    const readText = async (p: string) => fs.readFile(`${src.root}/${p}`, "utf8").catch(() => "");
    const filter = makeFilter(await readText(".gitignore"), `${await readText(".brainwhiteignore")}\n${repo.customIgnore}`);

    // ---- 1. Filter, read, and redact secrets ----
    await progress("Filtering files and scanning secrets");
    type Loaded = { path: string; lang: string; content: string; hash: string };
    const loaded: Loaded[] = [];
    let skipped = 0;
    let redactions = 0;
    const redactionsByFile = new Map<string, number>();

    for (const f of src.files) {
      if (filter(f.path, f.size)) {
        skipped++;
        continue;
      }
      const raw = await fs.readFile(f.abs, "utf8").catch(() => "");
      if (!raw || raw.includes("\u0000")) {
        skipped++;
        continue;
      }
      const r = redactSecrets(raw);
      redactions += r.count;
      if (r.count) redactionsByFile.set(f.path, r.count);
      loaded.push({ path: f.path, lang: languageOf(f.path), content: r.text, hash: sha1(r.text) });
    }

    const sha = src.sha ?? sha1(loaded.map((l) => l.path + l.hash).sort().join(""));
    const paths = new Set(loaded.map((l) => l.path));
    await progress(`Analyzing ${loaded.length} files`, {
      filesSeen: src.files.length,
      filesSkipped: skipped,
      secretsRedacted: redactions,
    });

    // ---- 2. Pre-parse AST in memory (Pure CPU, 0 database connections used) ----
    const symbolsByFile = new Map<string, Awaited<ReturnType<typeof parseSource>>>();
    const imports = new Map<string, string[]>();

    for (const l of loaded) {
      let res = null;
      if (isParsable(l.lang)) {
        try {
          res = await parseSource(l.lang, l.content);
          if (res) parsed++;
        } catch {
          res = null;
        }
      }
      symbolsByFile.set(l.path, res);
      imports.set(l.path, res?.imports ?? []);
    }

    // ---- 2b. Resolve imports (tsconfig paths/extends, workspaces, require, dynamic import(), Python roots, Java packages) ----
    await progress("Resolving imports");
    const loadedContent = new Map(loaded.map((l) => [l.path, l.content]));
    const resolve = createResolver(paths, (p) => loadedContent.get(p));
    const importStats = emptyImportStats(); // internal-resolved / unresolved / external, stored on the sync run
    const fileGraph: FileGraph = new Map();
    for (const l of loaded)
      for (const spec of imports.get(l.path) ?? []) {
        const r = resolve(l.path, spec, l.lang);
        importStats[r.kind]++;
        if (r.kind !== "internal" || r.target === l.path) continue;
        if (!fileGraph.has(l.path)) fileGraph.set(l.path, new Set());
        fileGraph.get(l.path)!.add(r.target);
      }
    // symbols get ids that stay the same across syncs, so call/reference edges can point at them
    const symIdsByFile = new Map<string, SymbolWithId[]>(loaded.map((l) => [l.path, withSymbolIds(repoId, l.path, symbolsByFile.get(l.path)?.symbols ?? [])]));

    // ---- 3. Modules: folders, split along the import graph when a folder is large ----
    const modPathOf = assignModules([...paths], fileGraph);
    const distinctModPaths = [...new Set(modPathOf.values())];
    const modIds = new Map<string, string>();

    for (const mp of distinctModPaths) {
      const m = await db.module.upsert({
        where: { repoId_path: { repoId, path: mp } },
        update: { name: moduleNameFor(mp) },
        create: { repoId, path: mp, name: moduleNameFor(mp) },
      });
      modIds.set(mp, m.id);
    }
    await db.module.deleteMany({ where: { repoId, path: { notIn: distinctModPaths } } });

    // ---- 4. Controlled database persistence with concurrency 2 (avoids pool timeouts) ----
    await db.file.deleteMany({ where: { repoId, path: { notIn: [...paths] } } });
    const existing = new Map((await db.file.findMany({ where: { repoId } })).map((f) => [f.path, f]));
    const fileIds = new Map<string, string>();

    let processedCount = 0;
    // Concurrency strictly set to 2 so database connection pool limit (3 to 5) is never exhausted
    await pool(loaded, 2, async (l) => {
      const prev = existing.get(l.path);
      const targetModuleId = modIds.get(modPathOf.get(l.path)!)!;
      const data = {
        language: l.lang,
        contentHash: l.hash,
        content: l.content,
        lineCount: l.content.split("\n").length,
        redactions: redactionsByFile.get(l.path) ?? 0,
        moduleId: targetModuleId,
        deletedAt: null,
      };

      const row = prev
        ? await db.file.update({ where: { id: prev.id }, data })
        : await db.file.create({ data: { repoId, path: l.path, ...data } });
      fileIds.set(l.path, row.id);

      await db.symbol.deleteMany({ where: { fileId: row.id } });
      const withIds = symIdsByFile.get(l.path) ?? [];
      if (withIds.length) {
        await db.symbol.createMany({
          data: withIds.map((s) => ({
            id: s.id,
            fileId: row.id,
            kind: s.kind,
            name: s.name,
            signature: s.signature,
            doc: s.doc,
            startLine: s.startLine,
            endLine: s.endLine,
          })),
        });
      }

      processedCount++;
      if (processedCount % 35 === 0 || processedCount === loaded.length) {
        await progress(`Parsed ${processedCount}/${loaded.length} files`, { filesParsed: parsed });
      }
    });

    // ---- 5. Generate learning chunks with deep conceptual summaries ----
    await progress("Synthesizing learning modules and concept chunks");
    const allChunks: {
      id: string;
      moduleId: string;
      repoId: string;
      title: string;
      filePath: string;
      startLine: number;
      endLine: number;
      estMinutes: number;
      difficulty: string;
      contentHash: string;
      summary: string;
      status: string;
      sha: string;
    }[] = [];
    const seenChunkIds = new Set<string>();

    for (const l of loaded) {
      const syms = symbolsByFile.get(l.path)?.symbols ?? [];
      const lines = l.content.split("\n");
      const chunks = buildChunks(repoId, l.path, l.content, syms);

      for (const d of chunks) {
        seenChunkIds.add(d.id);
        const inside = syms.filter((s) => s.startLine >= d.startLine && s.endLine <= d.endLine);
        const doc = inside.find((s) => s.doc)?.doc ?? "";
        const codeSnippet = lines.slice(d.startLine - 1, d.endLine).join("\n");
        const conceptualSummary = heuristicChunk(
          l.path,
          d.title,
          doc,
          inside.map((s) => s.kind),
          d.endLine - d.startLine + 1,
          l.lang,
          inside,
          codeSnippet
        );

        allChunks.push({
          id: d.id,
          moduleId: modIds.get(modPathOf.get(l.path)!)!,
          repoId,
          title: d.title,
          filePath: l.path,
          startLine: d.startLine,
          endLine: d.endLine,
          estMinutes: d.estMinutes,
          difficulty: d.difficulty,
          contentHash: d.contentHash,
          summary: conceptualSummary,
          status: "ACTIVE",
          sha,
        });
      }
    }

    // Chunk ids are stable. New chunks are batch-inserted; a chunk that already exists is UPDATED when its code, lines, title or module
    // changed (skipDuplicates alone would leave stale line numbers behind, and the chat cites those lines).
    const prevChunks = new Map(
      (await db.chunk.findMany({ where: { repoId }, select: { id: true, contentHash: true, status: true, moduleId: true, title: true, startLine: true, endLine: true } })).map((c) => [c.id, c]),
    );
    await db.chunk.deleteMany({ where: { repoId, id: { notIn: [...seenChunkIds] } } });
    const fresh = allChunks.filter((c) => !prevChunks.has(c.id));
    for (let i = 0; i < fresh.length; i += 40) {
      await db.chunk.createMany({ data: fresh.slice(i, i + 40), skipDuplicates: true });
    }
    const moved = allChunks.filter((c) => {
      const p = prevChunks.get(c.id);
      return !!p && (p.contentHash !== c.contentHash || p.moduleId !== c.moduleId || p.title !== c.title || p.startLine !== c.startLine || p.endLine !== c.endLine);
    });
    await pool(moved, 2, async (c) => {
      const p = prevChunks.get(c.id)!;
      await db.chunk.update({
        where: { id: c.id },
        data: {
          moduleId: c.moduleId, title: c.title, startLine: c.startLine, endLine: c.endLine, estMinutes: c.estMinutes, difficulty: c.difficulty,
          contentHash: c.contentHash, summary: c.summary, sha: c.sha, status: p.contentHash !== c.contentHash ? "UPDATED" : p.status,
        },
      });
    });

    // ---- 6. Build Dependency Graph ----
    await db.graphEdge.deleteMany({ where: { repoId } });
    const fileEdges: { repoId: string; fromId: string; toId: string; type: string; fromKind: string; toKind: string }[] = [];
    const modEdges = new Set<string>();

    for (const [from, tos] of fileGraph) {
      for (const to of tos) {
        const fromFileId = fileIds.get(from);
        const toFileId = fileIds.get(to);
        if (fromFileId && toFileId) {
          fileEdges.push({ repoId, fromId: fromFileId, toId: toFileId, type: "IMPORTS", fromKind: "file", toKind: "file" });
        }
        const a = modIds.get(modPathOf.get(from)!);
        const b = modIds.get(modPathOf.get(to)!);
        if (a && b && a !== b) modEdges.add(`${a}|${b}`);
      }
    }

    if (fileEdges.length) await db.graphEdge.createMany({ data: fileEdges });
    if (modEdges.size) {
      await db.graphEdge.createMany({
        data: [...modEdges].map((k) => {
          const [fromId, toId] = k.split("|");
          return { repoId, fromId, toId, type: "DEPENDS_ON", fromKind: "module", toKind: "module" };
        }),
      });
    }

    // ---- 6b. Symbol edges (calls / JSX / new / extends / implements), JS/TS only; EXACT or heuristic NAME_MATCH ----
    await progress("Linking symbols (calls, references)");
    const facts: FileFacts[] = loaded.map((l) => ({
      path: l.path, lang: l.lang, fileId: fileIds.get(l.path)!,
      symbols: symIdsByFile.get(l.path) ?? [], refs: symbolsByFile.get(l.path)?.refs,
    }));
    const symEdges = buildSymbolEdges(facts, resolve).map((e) => ({ repoId, ...e }));
    for (let i = 0; i < symEdges.length; i += 2000) await db.graphEdge.createMany({ data: symEdges.slice(i, i + 2000) });

    // ---- 7. Synthesize Module & Repository Architectural Profiles with AI support ----
    await progress("Generating architectural blueprint");
    const stats = newStats();
    const modules = await db.module.findMany({ where: { repoId }, include: { files: true } });
    const modSummaries: string[] = [];

    for (const m of modules) {
      const topFiles = m.files.slice(0, 5).map((f) => f.path.split("/").pop()).join(", ");
      const modSummary = buildConceptualModuleSummary(m.name, m.path, m.files.length, topFiles);
      await db.module.update({
        where: { id: m.id },
        data: {
          summary: modSummary,
          description: modSummary.split("—")[0].trim(),
        },
      });
      modSummaries.push(modSummary);
    }

    // If an AI provider (NVIDIA, Groq, Gemini) is configured, enrich the top modules with AI summaries
    if (llmEnabled()) {
      for (const m of modules.slice(0, 3)) {
        try {
          const aiResult = await callAi({
            task: "summary",
            messages: [
              {
                role: "system",
                content:
                  "Explain this module's architectural role and problem solved to a new engineer in 2 concise sentences.",
              },
              {
                role: "user",
                content: `Module: ${m.name}\nPath: ${m.path}\nFiles: ${m.files.slice(0, 8).map((f) => f.path).join(", ")}`,
              },
            ],
            maxTokens: 140,
            timeoutMs: 6000,
          });
          if (aiResult.text) {
            stats.calls++;
            await db.module.update({ where: { id: m.id }, data: { summary: aiResult.text } });
          }
        } catch {
          // Keep rich heuristic if AI call times out
        }
      }
    }

    const langCount: Record<string, number> = {};
    for (const l of loaded) langCount[l.lang] = (langCount[l.lang] ?? 0) + 1;

    let repoSummary = `${repo.name}: Architecture spanning ${modules.length} modules (${distinctModPaths.slice(0, 5).join(", ")}) across ${loaded.length} indexed files.`;
    if (llmEnabled()) {
      repoSummary = await summariseRollup(
        {
          kind: "repo",
          name: repo.name,
          parts: modSummaries,
          heuristic: repoSummary,
        },
        stats
      );
    }

    // ---- 8. Complete and mark HEALTHY ----
    await db.repository.update({
      where: { id: repoId },
      data: {
        syncStatus: "HEALTHY",
        lastSyncedSha: sha,
        lastSyncedAt: new Date(),
        summary: repoSummary,
        languages: JSON.stringify(langCount),
        graphCoverage: JSON.stringify({ callEdges: CALL_EDGE_LANGS }), // which languages have call/reference edges
      },
    });

    await db.syncRun.update({
      where: { id: run.id },
      data: {
        status: "SUCCESS",
        finishedAt: new Date(),
        sha,
        filesParsed: parsed,
        progress: `Done. Imports: ${importStats.internal} internal resolved, ${importStats.unresolved} unresolved, ${importStats.external} external`,
        summariesGenerated: stats.calls,
        importsResolved: importStats.internal,
        importsUnresolved: importStats.unresolved,
      },
    });

    return run.id;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[pipeline] Repository sync failed:", msg);
    try {
      await db.repository.update({ where: { id: repoId }, data: { syncStatus: "FAILED" } });
      await db.syncRun.update({
        where: { id: run.id },
        data: {
          status: "FAILED",
          finishedAt: new Date(),
          error: msg,
          progress: "Failed",
          filesParsed: parsed,
        },
      });
    } catch (err) {
      console.error("[pipeline] Failed to record error state:", err);
    }
    return run.id;
  } finally {
    await cleanup();
  }
}
