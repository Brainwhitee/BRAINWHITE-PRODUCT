// Module hierarchy (Phase 3). Pure: tested in scripts/module-tree.test.ts.
// Module paths come from assignModules(): "src/lib/domain" (FOLDER), "src/components/ui~button" (CLUSTER: a graph split of a
// big folder) and "." (root). Hierarchy rules:
//  - a CLUSTER's parent is its base folder ("src/components/ui~button" -> "src/components/ui"). When no module lives at that
//    base (every file of the folder was split into clusters) a GROUP module is created there: a parent with no files.
//  - a FOLDER's / GROUP's parent is its nearest ancestor module by path prefix ("src/components/ui" -> "src/components").
//  - the root module "." has no parent and is nobody's parent.
export type ModuleKind = "FOLDER" | "CLUSTER" | "GROUP";
export type ModuleNode = { path: string; kind: ModuleKind; parent: string | null };

export function buildModuleTree(paths: string[]): ModuleNode[] {
  const real = new Set(paths);
  const all = new Set(paths);
  for (const p of paths) {
    const i = p.indexOf("~");
    if (i > 0) all.add(p.slice(0, i)); // base folder of a cluster
  }
  const ancestorOf = (p: string): string | null => {
    const parts = p.split("/");
    for (let n = parts.length - 1; n >= 1; n--) {
      const a = parts.slice(0, n).join("/");
      if (all.has(a)) return a;
    }
    return null;
  };
  const out: ModuleNode[] = [];
  for (const p of [...all].sort()) {
    if (p === ".") { out.push({ path: p, kind: "FOLDER", parent: null }); continue; }
    const tilde = p.indexOf("~");
    if (tilde > 0) { out.push({ path: p, kind: "CLUSTER", parent: p.slice(0, tilde) }); continue; }
    out.push({ path: p, kind: real.has(p) ? "FOLDER" : "GROUP", parent: ancestorOf(p) });
  }
  return out;
}

// Hierarchy is derived from module paths when it is needed (graph, repo page): nothing is stored, so there is no schema change.
// Label of the parent for FOLDER modules ("Ui" -> "Components"). Clusters already carry their folder in their name ("Ui · Button").
export function parentLabels(paths: string[], nameFor: (path: string) => string): Map<string, string> {
  const out = new Map<string, string>();
  for (const n of buildModuleTree(paths)) if (n.kind === "FOLDER" && n.parent) out.set(n.path, nameFor(n.parent));
  return out;
}
