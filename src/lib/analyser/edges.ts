import { createHash } from "crypto";
import type { ParsedSymbol } from "./parse";
import type { Refs } from "./refs";
import type { Resolver } from "./resolve";

// Symbol-level graph edges (CBA-09): who calls / renders / extends what.
// EXACT      = reached through an import binding or a name defined in the same file.
// NAME_MATCH = heuristic: the name is unique among the files this file imports. Never shown as certain.
// Only JS/TS/TSX have these edges; other languages stay import-only, and the coverage record says so.

export type SymbolWithId = ParsedSymbol & { id: string };
export type FileFacts = { path: string; lang: string; fileId: string; symbols: SymbolWithId[]; refs?: Refs };
export type EdgeType = "CALLS" | "REFERENCES" | "EXTENDS" | "IMPLEMENTS";
export type Confidence = "EXACT" | "NAME_MATCH";
export type SymbolEdge = {
  fromKind: "symbol" | "file"; fromId: string; toKind: "symbol"; toId: string;
  type: EdgeType; confidence: Confidence; weight: number;
};

export const CALL_EDGE_LANGS = ["javascript", "typescript", "tsx"];

// Stable across syncs while the same name stays in the same file (nth = occurrence of the same kind+name in the file).
export function withSymbolIds(repoId: string, path: string, symbols: ParsedSymbol[]): SymbolWithId[] {
  const seen = new Map<string, number>();
  return symbols.map((s) => {
    const k = `${s.kind}|${s.name}`;
    const nth = seen.get(k) ?? 0;
    seen.set(k, nth + 1);
    return { ...s, id: "sy_" + createHash("sha1").update(`${repoId}|${path}|${k}|${nth}`).digest("hex").slice(0, 20) };
  });
}

export function buildSymbolEdges(files: FileFacts[], resolve: Resolver): SymbolEdge[] {
  const byPath = new Map(files.map((f) => [f.path, f]));
  const named = (f: FileFacts | undefined, name: string) => (f ? f.symbols.filter((s) => s.name === name) : []);
  const agg = new Map<string, SymbolEdge>();
  const add = (e: SymbolEdge) => {
    if (e.fromId === e.toId) return;
    const key = `${e.fromId}|${e.toId}|${e.type}`;
    const prev = agg.get(key);
    if (!prev) agg.set(key, e);
    else { prev.weight += e.weight; if (e.confidence === "EXACT") prev.confidence = "EXACT"; }
  };

  for (const f of files) {
    if (!f.refs) continue;
    const bindings = new Map<string, { target: FileFacts; imported: string }>();
    const imported = new Set<FileFacts>();
    for (const b of f.refs.bindings) {
      const r = resolve(f.path, b.spec, f.lang);
      const target = r.kind === "internal" ? byPath.get(r.target) : undefined;
      if (!target) continue;
      bindings.set(b.local, { target, imported: b.imported });
      imported.add(target);
    }
    const callable = (s: SymbolWithId) => s.kind !== "interface";
    const enclosing = (line: number) =>
      f.symbols.filter((s) => callable(s) && s.startLine <= line && line <= s.endLine).sort((a, b) => a.endLine - a.startLine - (b.endLine - b.startLine) || b.depth - a.depth)[0]; // innermost: smallest range, then deepest
    const from = (line: number): Pick<SymbolEdge, "fromKind" | "fromId"> => {
      const s = enclosing(line);
      return s ? { fromKind: "symbol", fromId: s.id } : { fromKind: "file", fromId: f.fileId };
    };
    // a name that exists exactly once across the files this file imports
    const uniqueInImports = (name: string) => {
      const hits = [...imported].flatMap((t) => named(t, name));
      return hits.length === 1 ? hits[0] : null;
    };
    const pick = (hits: SymbolWithId[], preferKind?: ParsedSymbol["kind"]) =>
      (preferKind && hits.find((h) => h.kind === preferKind)) || hits.find((h) => h.depth === 0) || hits[0];

    for (const c of f.refs.calls) {
      const type: EdgeType = c.kind === "jsx" ? "REFERENCES" : "CALLS";
      let target: SymbolWithId | undefined;
      let confidence: Confidence = "EXACT";
      const wantKind = c.kind === "new" || c.kind === "jsx" ? "class" : undefined;

      if (c.receiver === null) {
        const b = bindings.get(c.name);
        if (b) {
          const name = b.imported === "default" || b.imported === "*" ? c.name : b.imported;
          target = pick(named(b.target, name).filter((s) => s.depth === 0), wantKind);
        } else target = pick(named(f, c.name), wantKind); // same-file function / class / component
      } else if (c.receiver === "this") {
        const hits = named(f, c.name).filter((s) => s.kind === "method");
        if (hits.length === 1) { target = hits[0]; confidence = "NAME_MATCH"; }
      } else {
        const b = bindings.get(c.receiver);
        if (b && b.imported === "*") target = pick(named(b.target, c.name).filter((s) => s.depth === 0)); // ns.fn()
        else if (b) { target = pick(named(b.target, c.name)); confidence = "NAME_MATCH"; } // defaultExport.method()
        else { const u = uniqueInImports(c.name); if (u) { target = u; confidence = "NAME_MATCH"; } } // obj.method()
      }
      if (target) add({ ...from(c.line), toKind: "symbol", toId: target.id, type, confidence, weight: 1 });
    }

    for (const h of f.refs.heritage) {
      const cls = f.symbols.find((s) => s.kind === "class" && s.name === h.cls);
      if (!cls) continue;
      const b = bindings.get(h.sup);
      let target: SymbolWithId | undefined;
      let confidence: Confidence = "EXACT";
      if (b) target = pick(named(b.target, b.imported === "default" || b.imported === "*" ? h.sup : b.imported));
      else target = pick(named(f, h.sup).filter((s) => s.kind === "class" || s.kind === "interface"));
      if (!target) { const u = uniqueInImports(h.sup); if (u) { target = u; confidence = "NAME_MATCH"; } }
      if (target) add({ fromKind: "symbol", fromId: cls.id, toKind: "symbol", toId: target.id, type: h.kind === "extends" ? "EXTENDS" : "IMPLEMENTS", confidence, weight: 1 });
    }
  }
  return [...agg.values()];
}
