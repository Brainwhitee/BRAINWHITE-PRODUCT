// Hierarchy for the tree explorer (pure: no DOM, no React). Tested in scripts/tree.test.ts.
// repo -> folders -> files (-> functions, added by the UI when a file is opened). Chains of folders that contain nothing
// else are merged ("src/app/api" is one node, like VS Code's compact folders) so the tree stays shallow and readable.

export type TNode = {
  id: string; // "root", "d:<path>", "f:<fileId>"
  kind: "root" | "dir" | "file" | "symbol"; // symbols (functions/classes of an opened file) are added by the UI
  label: string; // shown on the node (merged folder chains read "app/api/auth")
  path: string; // full path of the deepest folder, or of the file
  fileId?: string;
  children: TNode[];
  files: number; // files below (1 for a file)
  parent: string | null;
  depth: number;
};
export type Tree = { root: TNode; byId: Map<string, TNode> };

type Trie = { name: string; dirs: Map<string, Trie>; files: { id: string; name: string; path: string }[] };

export function buildTree(files: { id: string; path: string }[], rootLabel: string): Tree {
  const top: Trie = { name: "", dirs: new Map(), files: [] };
  for (const f of files) {
    const parts = f.path.split("/");
    let cur = top;
    for (const d of parts.slice(0, -1)) {
      if (!cur.dirs.has(d)) cur.dirs.set(d, { name: d, dirs: new Map(), files: [] });
      cur = cur.dirs.get(d)!;
    }
    cur.files.push({ id: f.id, name: parts[parts.length - 1], path: f.path });
  }

  const byId = new Map<string, TNode>();
  const make = (t: Trie, path: string, parent: string, depth: number): TNode => {
    // merge folder chains: a folder whose only content is one folder
    let label = t.name, p = path, cur = t;
    while (cur.files.length === 0 && cur.dirs.size === 1) {
      const [, child] = [...cur.dirs][0];
      label += "/" + child.name; p += "/" + child.name; cur = child;
    }
    const node: TNode = { id: `d:${p}`, kind: "dir", label, path: p, children: [], files: 0, parent, depth };
    byId.set(node.id, node);
    const dirs = [...cur.dirs.values()].sort((a, b) => a.name.localeCompare(b.name));
    for (const d of dirs) node.children.push(make(d, p ? `${p}/${d.name}` : d.name, node.id, depth + 1));
    for (const f of [...cur.files].sort((a, b) => a.name.localeCompare(b.name))) {
      const fn: TNode = { id: `f:${f.id}`, kind: "file", label: f.name, path: f.path, fileId: f.id, children: [], files: 1, parent: node.id, depth: depth + 1 };
      byId.set(fn.id, fn);
      node.children.push(fn);
    }
    node.files = node.children.reduce((n, c) => n + c.files, 0);
    return node;
  };

  const root: TNode = { id: "root", kind: "root", label: rootLabel, path: "", children: [], files: files.length, parent: null, depth: 0 };
  byId.set("root", root);
  for (const d of [...top.dirs.values()].sort((a, b) => a.name.localeCompare(b.name))) root.children.push(make(d, d.name, "root", 1));
  for (const f of [...top.files].sort((a, b) => a.name.localeCompare(b.name))) {
    const fn: TNode = { id: `f:${f.id}`, kind: "file", label: f.name, path: f.path, fileId: f.id, children: [], files: 1, parent: "root", depth: 1 };
    byId.set(fn.id, fn);
    root.children.push(fn);
  }
  return { root, byId };
}

// Tidy left-to-right layout of what is visible. Leaves (and collapsed nodes) take one row each; a parent sits in the
// middle of its children. `childrenOf` lets the UI add children (functions of an opened file) without touching the tree.
export type Placed = { id: string; depth: number; row: number };
export function layoutTree(root: TNode, expanded: Set<string>, childrenOf: (n: TNode) => TNode[] = (n) => n.children): { placed: Map<string, Placed>; rows: number; order: string[] } {
  const placed = new Map<string, Placed>();
  const order: string[] = [];
  let next = 0;
  const place = (n: TNode, depth: number): number => {
    const kids = childrenOf(n);
    order.push(n.id);
    if (n.kind === "root" || (expanded.has(n.id) && kids.length)) {
      const rows = kids.map((k) => place(k, depth + 1));
      const row = rows.length ? (rows[0] + rows[rows.length - 1]) / 2 : next++;
      placed.set(n.id, { id: n.id, depth, row });
      return row;
    }
    const row = next++;
    placed.set(n.id, { id: n.id, depth, row });
    return row;
  };
  place(root, 0);
  return { placed, rows: next, order };
}

export function ancestors(byId: Map<string, TNode>, id: string): string[] {
  const out: string[] = [];
  let cur = byId.get(id)?.parent ?? null;
  while (cur) { out.push(cur); cur = byId.get(cur)?.parent ?? null; }
  return out;
}

// The nearest node on screen for a file: the file itself when its folders are open, otherwise the closest closed folder above it.
export function nearestVisible(byId: Map<string, TNode>, fileId: string, visible: Set<string>): string | null {
  let cur: string | null = `f:${fileId}`;
  while (cur) { if (visible.has(cur)) return cur; cur = byId.get(cur)?.parent ?? null; }
  return null;
}

export function descendantFileIds(n: TNode): string[] {
  if (n.kind === "file") return n.fileId ? [n.fileId] : [];
  return n.children.flatMap(descendantFileIds);
}

// Folder ids that must be open for these files to be visible (used by "reveal", search and the candidate's path view).
export function foldersToOpen(byId: Map<string, TNode>, fileIds: string[]): Set<string> {
  const s = new Set<string>();
  for (const id of fileIds) for (const a of ancestors(byId, `f:${id}`)) s.add(a);
  return s;
}

// Open every folder down to `depth` (root = 0).
export function openToDepth(tree: Tree, depth: number): Set<string> {
  const s = new Set<string>(["root"]);
  for (const n of tree.byId.values()) if (n.kind === "dir" && n.depth < depth) s.add(n.id);
  return s;
}
