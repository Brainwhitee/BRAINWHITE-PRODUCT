// Folder-structure heuristic for module detection (CBA-08). Every file lands in exactly one module.
const CONTAINER_DIRS = new Set(["src", "app", "lib", "packages", "apps", "services", "server", "client", "internal", "pkg", "main", "java", "com"]);

export function modulePathFor(filePath: string): string {
  const dirs = filePath.split("/").slice(0, -1);
  if (dirs.length === 0) return ".";
  let depth = 1;
  // descend through generic container folders (src/lib/auth -> src/lib/auth)
  while (depth < dirs.length && depth < 3 && CONTAINER_DIRS.has(dirs[depth - 1].toLowerCase())) depth++;
  return dirs.slice(0, depth).join("/");
}

const titleCase = (s: string) => s.replace(/[-_]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

// Graph clusters inside a big folder are named "<folder>~<anchor file>" (see cluster.ts): "Ui · Button"
export function moduleNameFor(modPath: string): string {
  if (modPath === ".") return "Root";
  const [base, anchor] = modPath.split("~");
  const name = titleCase(base.split("/").pop()!);
  return anchor ? `${name} · ${anchor === "misc" ? "Other" : titleCase(anchor)}` : name;
}

// Resolve a relative import specifier to a repo file path
export function resolveImport(fromFile: string, spec: string, lang: string, allFiles: Set<string>): string | null {
  const dir = fromFile.split("/").slice(0, -1);
  if (lang === "python") {
    let base: string[];
    let rest = spec;
    if (spec.startsWith(".")) {
      const dots = spec.match(/^\.+/)![0].length;
      base = dir.slice(0, Math.max(0, dir.length - (dots - 1)));
      rest = spec.slice(dots);
    } else base = [];
    const cand = [...base, ...rest.split(".").filter(Boolean)].join("/");
    for (const c of [`${cand}.py`, `${cand}/__init__.py`]) if (allFiles.has(c)) return c;
    return null;
  }
  if (lang === "java") {
    const cand = spec.replace(/\./g, "/") + ".java";
    for (const f of allFiles) if (f.endsWith(cand)) return f;
    return null;
  }
  if (!spec.startsWith(".") && !spec.startsWith("@/")) return null;
  const parts = spec.startsWith("@/") ? ["src", ...spec.slice(2).split("/")] : [...dir];
  if (!spec.startsWith("@/")) for (const seg of spec.split("/")) {
      if (seg === "..") parts.pop();
      else if (seg !== ".") parts.push(seg);
    }
  const base = parts.join("/");
  for (const ext of ["", ".ts", ".tsx", ".js", ".jsx", ".mjs", "/index.ts", "/index.tsx", "/index.js"])
    if (allFiles.has(base + ext)) return base + ext;
  return null;
}
