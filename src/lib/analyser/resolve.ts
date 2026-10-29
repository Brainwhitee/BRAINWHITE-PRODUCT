import ts from "typescript";

// Import resolution for the dependency graph (CBA-08).
// JS/TS goes through the TypeScript module resolver over an in-memory copy of the repo, so tsconfig/jsconfig
// `paths`, `baseUrl`, `extends`, index files and .js->.ts mapping behave like the real compiler.
// Every import ends up as internal (has a target file), unresolved (looks internal but no file found) or external.

export type Resolution = { kind: "internal"; target: string } | { kind: "unresolved" } | { kind: "external" };
export type Resolver = (fromFile: string, spec: string, lang: string) => Resolution;

const JS_LANGS = new Set(["javascript", "typescript", "tsx"]);
const JAVA_EXTERNAL = /^(java|javax|jakarta|sun|jdk|org\.w3c|org\.xml|org\.junit)\./;
const CONFIG_NAME = /(^|\/)(tsconfig|jsconfig)\.json$/;
const PY_CONTAINERS = new Set(["src", "lib", "app"]);

const dirOf = (p: string) => (p.includes("/") ? p.slice(0, p.lastIndexOf("/")) : "");
const join = (...parts: string[]) => parts.filter(Boolean).join("/");

function normalise(path: string) {
  const out: string[] = [];
  for (const seg of path.split("/")) {
    if (seg === "..") out.pop();
    else if (seg !== "." && seg !== "") out.push(seg);
  }
  return out.join("/");
}

export function createResolver(paths: Set<string>, readText: (path: string) => string | undefined): Resolver {
  // ---------- shared indexes ----------
  const dirs = new Set<string>(["/"]);
  for (const p of paths) {
    const parts = p.split("/").slice(0, -1);
    for (let i = 1; i <= parts.length; i++) dirs.add("/" + parts.slice(0, i).join("/"));
  }

  // ---------- JS/TS ----------
  const host: ts.ModuleResolutionHost = {
    fileExists: (f) => paths.has(f.replace(/^\//, "")),
    readFile: (f) => readText(f.replace(/^\//, "")),
    directoryExists: (d) => dirs.has(d === "" ? "/" : d),
    realpath: (f) => f,
    getCurrentDirectory: () => "/",
    useCaseSensitiveFileNames: true,
  } as ts.ModuleResolutionHost;

  // monorepo workspaces: package name -> folder
  const workspace = new Map<string, string>();
  for (const p of paths) {
    if (p === "package.json" || !p.endsWith("/package.json")) continue;
    if (p.includes("node_modules/")) continue;
    const name = (() => { try { return JSON.parse(readText(p) ?? "{}").name as string | undefined; } catch { return undefined; } })();
    if (name) workspace.set(name, dirOf(p));
  }
  const configPaths = [...paths].filter((p) => CONFIG_NAME.test(p));
  const optionsCache = new Map<string, { options: ts.CompilerOptions; patterns: string[] }>();

  // `extends` can be a relative file or a workspace package ("@acme/tsconfig/base.json")
  function findExtended(fromCfg: string, ext: string): string | null {
    if (ext.startsWith(".")) {
      let target = normalise(join(dirOf(fromCfg), ext));
      if (!paths.has(target)) target += ".json";
      return paths.has(target) ? target : null;
    }
    for (const [name, dir] of workspace) {
      if (ext !== name && !ext.startsWith(name + "/")) continue;
      const sub = ext.slice(name.length + 1) || "tsconfig.json";
      for (const c of [join(dir, sub), join(dir, sub + ".json")]) if (paths.has(c)) return c;
    }
    return null;
  }

  function loadConfig(cfgPath: string, depth = 0): { options: ts.CompilerOptions; patterns: string[] } {
    const hit = optionsCache.get(cfgPath);
    if (hit) return hit;
    let merged: ts.CompilerOptions = {};
    let patterns: string[] = [];
    const text = readText(cfgPath);
    if (text) {
      const parsed = ts.parseConfigFileTextToJson(cfgPath, text).config ?? {};
      const exts: unknown[] = Array.isArray(parsed.extends) ? parsed.extends : parsed.extends ? [parsed.extends] : [];
      for (const ext of exts) {
        if (typeof ext !== "string" || depth >= 5) continue;
        const target = findExtended(cfgPath, ext);
        if (!target) continue;
        const base = loadConfig(target, depth + 1);
        merged = { ...merged, ...base.options };
        if (base.patterns.length) patterns = base.patterns;
      }
      const raw = { ...(parsed.compilerOptions ?? {}) };
      delete raw.moduleResolution; // always resolve with bundler rules: superset of node/classic behaviour we need
      delete raw.module;
      delete raw.plugins;
      const { options } = ts.convertCompilerOptionsFromJson(raw, "/" + dirOf(cfgPath));
      merged = { ...merged, ...options };
      // `paths` without `baseUrl` is relative to the config file that declares it (TS >= 4.1)
      if (raw.paths) {
        (merged as Record<string, unknown>).pathsBasePath = "/" + dirOf(cfgPath);
        patterns = Object.keys(raw.paths);
      }
    }
    const res = { options: merged, patterns };
    optionsCache.set(cfgPath, res);
    return res;
  }

  const DEFAULTS: ts.CompilerOptions = {
    allowJs: true, resolveJsonModule: true, jsx: ts.JsxEmit.Preserve, target: ts.ScriptTarget.ES2020,
    module: ts.ModuleKind.ESNext, moduleResolution: ts.ModuleResolutionKind.Bundler, noEmit: true,
  };

  function configFor(fromFile: string) {
    let dir = dirOf(fromFile);
    for (;;) {
      for (const name of ["tsconfig.json", "jsconfig.json"]) {
        const c = join(dir, name);
        if (configPaths.includes(c)) return loadConfig(c);
      }
      if (!dir) return { options: {}, patterns: [] as string[] };
      dir = dirOf(dir);
    }
  }

  const ENTRY = ["src/index.ts", "src/index.tsx", "src/index.js", "index.ts", "index.tsx", "index.js"];

  function viaWorkspace(spec: string): string | null {
    for (const [name, dir] of workspace) {
      if (spec !== name && !spec.startsWith(name + "/")) continue;
      const sub = spec.slice(name.length + 1);
      const bases = sub ? [join(dir, sub), join(dir, "src", sub)] : [];
      for (const b of bases)
        for (const ext of ["", ".ts", ".tsx", ".js", ".jsx", "/index.ts", "/index.tsx", "/index.js"]) if (paths.has(b + ext)) return b + ext;
      if (!sub) for (const e of ENTRY) if (paths.has(join(dir, e))) return join(dir, e);
    }
    return null;
  }

  // Assets behind a tsconfig alias ("~/app/styles.css"): TS ignores them, so map the alias by hand and look for the exact file.
  function viaPathsExact(spec: string, options: ts.CompilerOptions): string | null {
    const map = options.paths as Record<string, string[]> | undefined;
    if (!map) return null;
    const baseDir = String((options as Record<string, unknown>).pathsBasePath ?? options.baseUrl ?? "/").replace(/^\//, "");
    for (const [pat, targets] of Object.entries(map)) {
      const star = pat.indexOf("*");
      const rest = star < 0 ? (spec === pat ? "" : null) : spec.startsWith(pat.slice(0, star)) && spec.endsWith(pat.slice(star + 1)) ? spec.slice(star, spec.length - (pat.length - star - 1)) : null;
      if (rest === null) continue;
      for (const t of targets) {
        const cand = normalise(join(baseDir, t.replace("*", rest)));
        if (paths.has(cand)) return cand;
      }
    }
    return null;
  }

  function resolveJs(fromFile: string, rawSpec: string): Resolution {
    if (rawSpec.startsWith("node:")) return { kind: "external" };
    const spec = rawSpec.split("?")[0]; // "./styles.css?url" style bundler suffixes
    const cfg = configFor(fromFile);
    const options = { ...DEFAULTS, ...cfg.options };
    const r = ts.resolveModuleName(spec, "/" + fromFile, options, host).resolvedModule;
    if (r && !r.isExternalLibraryImport) {
      const target = r.resolvedFileName.replace(/^\//, "");
      if (paths.has(target) && target !== fromFile) return { kind: "internal", target };
    }
    if (spec.startsWith(".")) {
      // assets the TS resolver ignores (./globals.css, ./logo.svg): link them when the exact file exists
      const exact = normalise(join(dirOf(fromFile), spec));
      if (paths.has(exact) && exact !== fromFile) return { kind: "internal", target: exact };
    }
    const aliased = viaPathsExact(spec, cfg.options);
    if (aliased && aliased !== fromFile) return { kind: "internal", target: aliased };
    const ws = viaWorkspace(spec);
    if (ws && ws !== fromFile) return { kind: "internal", target: ws };
    const aliasLike =
      spec.startsWith(".") || spec.startsWith("/") || spec.startsWith("@/") || spec.startsWith("~/") || spec.startsWith("#") ||
      cfg.patterns.some((pat) => (pat.endsWith("*") ? spec.startsWith(pat.slice(0, -1)) : spec === pat));
    return aliasLike ? { kind: "unresolved" } : { kind: "external" };
  }

  // ---------- Python ----------
  const pyFiles = [...paths].filter((p) => p.endsWith(".py"));
  const pyTop = new Set<string>();
  for (const p of pyFiles) {
    const parts = p.replace(/\.py$/, "").split("/");
    pyTop.add(parts[0]);
    if (parts.length > 1 && PY_CONTAINERS.has(parts[0])) pyTop.add(parts[1]);
  }

  function resolvePython(fromFile: string, spec: string): Resolution {
    const dir = dirOf(fromFile).split("/").filter(Boolean);
    if (spec.startsWith(".")) {
      const dots = spec.match(/^\.+/)![0].length;
      const base = dir.slice(0, Math.max(0, dir.length - (dots - 1)));
      const cand = [...base, ...spec.slice(dots).split(".").filter(Boolean)].join("/");
      for (const c of [`${cand}.py`, `${cand}/__init__.py`]) if (paths.has(c) && c !== fromFile) return { kind: "internal", target: c };
      return { kind: "unresolved" };
    }
    const rel = spec.split(".").filter(Boolean).join("/");
    // try the repo root, then each ancestor of the importing file (covers src/ layouts and nested projects)
    for (let k = 0; k <= dir.length; k++) {
      const root = dir.slice(0, k).join("/");
      for (const c of [join(root, `${rel}.py`), join(root, rel, "__init__.py")]) if (paths.has(c) && c !== fromFile) return { kind: "internal", target: c };
    }
    for (const container of PY_CONTAINERS)
      for (const c of [`${container}/${rel}.py`, `${container}/${rel}/__init__.py`]) if (paths.has(c) && c !== fromFile) return { kind: "internal", target: c };
    return pyTop.has(spec.split(".")[0]) ? { kind: "unresolved" } : { kind: "external" };
  }

  // ---------- Java ----------
  const javaSuffix = new Map<string, string>();
  const javaDirSuffix = new Set<string>();
  for (const p of paths) {
    if (!p.endsWith(".java")) continue;
    const parts = p.split("/");
    for (let i = 0; i < parts.length; i++) {
      const key = parts.slice(i).join("/");
      if (!javaSuffix.has(key)) javaSuffix.set(key, p);
      if (i < parts.length - 1) javaDirSuffix.add(parts.slice(i, -1).join("/"));
    }
  }

  function resolveJava(fromFile: string, spec: string): Resolution {
    if (JAVA_EXTERNAL.test(spec)) return { kind: "external" };
    const segs = spec.replace(/\.\*$/, "").split(".");
    // drop trailing segments to handle static members and inner classes: a.b.C.method -> a/b/C.java
    for (let n = segs.length; n >= 2; n--) {
      const hit = javaSuffix.get(segs.slice(0, n).join("/") + ".java");
      if (hit && hit !== fromFile) return { kind: "internal", target: hit };
    }
    const pkg = segs.slice(0, Math.min(2, segs.length)).join("/");
    return javaDirSuffix.has(pkg) ? { kind: "unresolved" } : { kind: "external" };
  }

  return (fromFile, spec, lang) => {
    if (JS_LANGS.has(lang)) return resolveJs(fromFile, spec);
    if (lang === "python") return resolvePython(fromFile, spec);
    if (lang === "java") return resolveJava(fromFile, spec);
    return { kind: "external" };
  };
}

export type ImportStats = { internal: number; unresolved: number; external: number };
export const emptyImportStats = (): ImportStats => ({ internal: 0, unresolved: 0, external: 0 });
