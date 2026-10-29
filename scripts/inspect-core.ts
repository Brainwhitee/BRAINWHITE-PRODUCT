// Core inspector: runs the analyser stages on a folder or GitHub repo WITHOUT a database and prints what the
// knowledge graph would contain. Use it to check parsing, import resolution, modules and chunks in isolation.
//
//   npm run inspect -- .                       (local folder)
//   npm run inspect -- owner/name              (GitHub repo; set GITHUB_TOKEN in .env for private repos)
//   npm run inspect -- . --json out.json --mermaid graph.md --samples 30 --branch main
//
// Stages mirror src/lib/analyser/pipeline.ts (read, filter, redact, parse, resolve, modules, chunks).
import fs from "fs";
import path from "path";
import { createHash } from "crypto";
import { loadSource } from "../src/lib/analyser/source";
import { languageOf, makeFilter } from "../src/lib/analyser/filter";
import { redactSecrets } from "../src/lib/analyser/secrets";
import { isParsable, parseSource } from "../src/lib/analyser/parse";
import { modulePathFor, moduleNameFor, resolveImport as legacyResolve } from "../src/lib/analyser/modules";
import { buildChunks } from "../src/lib/analyser/chunk";
import { assignModules } from "../src/lib/analyser/cluster";
import { createResolver, emptyImportStats } from "../src/lib/analyser/resolve";

try { (process as unknown as { loadEnvFile?: (p?: string) => void }).loadEnvFile?.(); } catch { /* no .env is fine */ }
process.env.ALLOW_LOCAL_REPOS = "true"; // this tool only reads; local folders are the point

function args() {
  const a = process.argv.slice(2);
  const opt = (name: string) => { const i = a.indexOf(name); return i >= 0 ? a[i + 1] : undefined; };
  const target = a.find((x, i) => !x.startsWith("--") && !(i > 0 && a[i - 1].startsWith("--")));
  return { target, branch: opt("--branch") ?? "main", json: opt("--json"), mermaid: opt("--mermaid"), samples: Number(opt("--samples") ?? 15) };
}

const sha1 = (s: string) => createHash("sha1").update(s).digest("hex");
const pct = (a: number, b: number) => (b ? `${((a / b) * 100).toFixed(1)}%` : "n/a");
const row = (...c: (string | number)[]) => c.map((x, i) => (i === 0 ? String(x).padEnd(34) : String(x).padStart(8))).join(" ");

async function main() {
  const { target, branch, json, mermaid, samples } = args();
  if (!target) {
    console.error("Usage: npm run inspect -- <folder | owner/name> [--branch main] [--json out.json] [--mermaid graph.md] [--samples 15]");
    process.exit(1);
  }
  const isLocal = fs.existsSync(target) && fs.statSync(target).isDirectory();
  const t0 = Date.now();
  console.log(`\nInspecting ${isLocal ? "local folder" : "GitHub repo"}: ${target}${isLocal ? "" : ` @ ${branch}`}`);
  const src = await loadSource(isLocal ? "local" : "github", isLocal ? path.resolve(target) : target, branch);

  try {
    const readText = async (p: string) => fs.promises.readFile(`${src.root}/${p}`, "utf8").catch(() => "");
    const filter = makeFilter(await readText(".gitignore"), await readText(".brainwhiteignore"));

    // ---- read, filter, redact ----
    type Loaded = { path: string; lang: string; content: string };
    const loaded: Loaded[] = [];
    const skipReasons = new Map<string, number>();
    let redactions = 0;
    for (const f of src.files) {
      const why = filter(f.path, f.size);
      if (why) { skipReasons.set(why, (skipReasons.get(why) ?? 0) + 1); continue; }
      const raw = await fs.promises.readFile(f.abs, "utf8").catch(() => "");
      if (!raw || raw.includes("\u0000")) { skipReasons.set("empty-or-binary", (skipReasons.get("empty-or-binary") ?? 0) + 1); continue; }
      const r = redactSecrets(raw);
      redactions += r.count;
      loaded.push({ path: f.path, lang: languageOf(f.path), content: r.text });
    }
    const paths = new Set(loaded.map((l) => l.path));
    const contentOf = new Map(loaded.map((l) => [l.path, l.content]));

    // ---- parse ----
    const langCount = new Map<string, number>();
    const parseFailed: string[] = [];
    let parsedOk = 0, symbols = 0;
    const parsed = new Map<string, Awaited<ReturnType<typeof parseSource>>>();
    for (const l of loaded) {
      langCount.set(l.lang, (langCount.get(l.lang) ?? 0) + 1);
      if (!isParsable(l.lang)) continue;
      try {
        const res = await parseSource(l.lang, l.content);
        if (res) { parsedOk++; symbols += res.symbols.length; parsed.set(l.path, res); } else parseFailed.push(l.path);
      } catch { parseFailed.push(l.path); }
    }
    const parsable = loaded.filter((l) => isParsable(l.lang)).length;

    // ---- imports: new resolver vs the old one ----
    const resolve = createResolver(paths, (p) => contentOf.get(p));
    const stats = emptyImportStats();
    const fileEdges = new Map<string, Set<string>>(); // from -> targets (new)
    const legacyEdges = new Set<string>();
    const unresolved: { from: string; spec: string }[] = [];
    let specTotal = 0;
    for (const l of loaded) {
      const imports = parsed.get(l.path)?.imports ?? [];
      for (const spec of imports) {
        specTotal++;
        const r = resolve(l.path, spec, l.lang);
        stats[r.kind]++;
        if (r.kind === "internal") {
          if (!fileEdges.has(l.path)) fileEdges.set(l.path, new Set());
          fileEdges.get(l.path)!.add(r.target);
        } else if (r.kind === "unresolved") unresolved.push({ from: l.path, spec });
        const old = legacyResolve(l.path, spec, l.lang, paths);
        if (old && old !== l.path) legacyEdges.add(`${l.path}|${old}`);
      }
    }
    const newEdgeCount = [...fileEdges.values()].reduce((n, s) => n + s.size, 0);
    const newEdgeKeys = new Set([...fileEdges].flatMap(([f, ts]) => [...ts].map((t) => `${f}|${t}`)));
    const gained = [...newEdgeKeys].filter((k) => !legacyEdges.has(k));
    const lost = [...legacyEdges].filter((k) => !newEdgeKeys.has(k));

    // ---- modules, module graph ----
    const folderOf = new Map(loaded.map((l) => [l.path, modulePathFor(l.path)]));
    const folderSizes = new Map<string, number>();
    for (const m of folderOf.values()) folderSizes.set(m, (folderSizes.get(m) ?? 0) + 1);
    const modOf = assignModules(loaded.map((l) => l.path), fileEdges);
    const mods = new Map<string, { files: number; chunks: number }>();
    for (const l of loaded) {
      const m = modOf.get(l.path)!;
      mods.set(m, mods.get(m) ?? { files: 0, chunks: 0 });
      mods.get(m)!.files++;
    }
    const modEdges = new Map<string, number>();
    for (const [from, tos] of fileEdges)
      for (const to of tos) {
        const a = modOf.get(from)!, b = modOf.get(to)!;
        if (a !== b) modEdges.set(`${a}|${b}`, (modEdges.get(`${a}|${b}`) ?? 0) + 1);
      }

    // ---- chunks ----
    let chunks = 0;
    for (const l of loaded) {
      const c = buildChunks("inspect", l.path, l.content, parsed.get(l.path)?.symbols ?? []);
      chunks += c.length;
      mods.get(modOf.get(l.path)!)!.chunks += c.length;
    }

    // ---- fan-in ----
    const fanIn = new Map<string, number>();
    for (const tos of fileEdges.values()) for (const t of tos) fanIn.set(t, (fanIn.get(t) ?? 0) + 1);

    // ---- report ----
    console.log(`\n== Source`);
    console.log(row("files seen", src.files.length), "\n" + row("loaded", loaded.length), "\n" + row("skipped", src.files.length - loaded.length),
      "  (" + [...skipReasons].map(([k, v]) => `${k}:${v}`).join(", ") + ")");
    console.log(row("secrets redacted", redactions), "\n" + row("commit sha", src.sha ? src.sha.slice(0, 10) : "n/a"));
    console.log(`\n== Languages`);
    for (const [k, v] of [...langCount].sort((a, b) => b[1] - a[1])) console.log(row(k, v));
    console.log(`\n== Parsing`);
    console.log(row("parsable files", parsable), "\n" + row("parsed ok", parsedOk), "\n" + row("parse failed", parseFailed.length), "\n" + row("symbols", symbols), "\n" + row("chunks", chunks));
    if (parseFailed.length) console.log("  failed: " + parseFailed.slice(0, 10).join(", "));
    console.log(`\n== Imports (new resolver)`);
    console.log(row("import specifiers", specTotal));
    console.log(row("internal (resolved)", stats.internal), "\n" + row("unresolved (look internal)", stats.unresolved), "\n" + row("external (packages)", stats.external));
    console.log(row("internal resolved %", pct(stats.internal, stats.internal + stats.unresolved)));
    console.log(`\n== Before / after`);
    console.log(row("file edges, old resolver", legacyEdges.size), "\n" + row("file edges, new resolver", newEdgeCount));
    console.log(row("edges only new finds", gained.length), "\n" + row("edges only old had", lost.length));
    for (const k of gained.slice(0, 5)) console.log("   + " + k.replace("|", "  ->  "));
    for (const k of lost.slice(0, 5)) console.log("   - " + k.replace("|", "  ->  "));
    if (unresolved.length) {
      console.log(`\n== Unresolved internal-looking imports (first ${Math.min(samples, unresolved.length)} of ${unresolved.length})`);
      for (const u of unresolved.slice(0, samples)) console.log(`   ${u.from}  ->  ${u.spec}`);
    }
    console.log(`\n== Most imported files`);
    for (const [f, n] of [...fanIn].sort((a, b) => b[1] - a[1]).slice(0, 10)) console.log(row(f, n));
    console.log(`\n== Modules: folders only vs folders + graph split`);
    console.log(row("modules, folders only", folderSizes.size), "\n" + row("modules, now", mods.size));
    console.log(row("largest module, folders only", Math.max(...folderSizes.values())), "\n" + row("largest module, now", Math.max(...[...mods.values()].map((v) => v.files))));
    console.log(`\n== Modules (${mods.size}), module edges: ${modEdges.size}`);
    for (const [m, v] of [...mods].sort((a, b) => b[1].files - a[1].files).slice(0, 15)) console.log(row(`${m} [${moduleNameFor(m)}]`, `${v.files}f/${v.chunks}c`));

    const top = [...modEdges].sort((a, b) => b[1] - a[1]).slice(0, 40);
    const id = (m: string) => "m_" + sha1(m).slice(0, 6);
    const mm = ["```mermaid", "graph LR", ...[...new Set(top.flatMap(([k]) => k.split("|")))].map((m) => `  ${id(m)}["${m}"]`),
      ...top.map(([k, w]) => { const [a, b] = k.split("|"); return `  ${id(a)} -->|${w}| ${id(b)}`; }), "```"].join("\n");
    if (mermaid) { fs.writeFileSync(mermaid, mm + "\n"); console.log(`\nMermaid module graph written to ${mermaid} (open in VS Code Markdown preview)`); }
    if (json) {
      fs.writeFileSync(json, JSON.stringify({
        target, stats, specTotal, files: loaded.length, symbols, chunks,
        fileEdges: [...newEdgeKeys].map((k) => k.split("|")), moduleEdges: [...modEdges].map(([k, w]) => ({ from: k.split("|")[0], to: k.split("|")[1], weight: w })),
        modules: Object.fromEntries(mods), unresolved,
      }, null, 2));
      console.log(`Full graph JSON written to ${json}`);
    }
    console.log(`\nDone in ${((Date.now() - t0) / 1000).toFixed(1)}s\n`);
  } finally {
    await src.cleanup();
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
