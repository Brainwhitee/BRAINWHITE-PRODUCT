"use client";
// Tree explorer for a codebase: repo -> folders -> files -> functions, as a left-to-right tree (mind-map / n8n style).
// Click a node to open or close what is inside it. Select any node to see what it connects to: dependency lines are drawn
// only for the selection, so the picture never turns into a hairball. With `assignmentId` (candidate) the tree can be limited
// to "my path": only the files the learning path reads, numbered in reading order, green = understood, blue = still to learn.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { GraphData, MapData } from "@/lib/graph";
import { connectorPath, connectorPoint } from "@/lib/connector";
import { nextToLearn } from "@/lib/learning-order";
import { ancestors, buildTree, descendantFileIds, foldersToOpen, layoutTree, nearestVisible, openToDepth, type TNode } from "@/lib/tree";

const EDGE: Record<string, { color: string; label: string }> = {
  IMPORTS: { color: "#64748b", label: "Imports" },
  CALLS: { color: "#ea580c", label: "Calls" },
  REFERENCES: { color: "#9333ea", label: "References" },
  EXTENDS: { color: "#0d9488", label: "Extends" },
  IMPLEMENTS: { color: "#0891b2", label: "Implements" },
};
const TYPES = Object.keys(EDGE);
const PRIORITY = ["CALLS", "REFERENCES", "EXTENDS", "IMPLEMENTS", "IMPORTS"];
const COL = 286, NODE_W = 244, SYM_W = 224, ROW = 48, NODE_H = 38;
const MIN_FIT = 0.7; // smallest zoom that "Fit" will pick, so labels stay readable
const trunc = (s: string, n: number) => (s.length > n ? s.slice(0, n - 1) + "…" : s);
const topColor = (i: number) => `hsl(${(i * 137.5) % 360} 55% 52%)`;

type Sym = { id: string; name: string; sub: string; start?: number; end?: number };
type Drag = { sx: number; sy: number; ox: number; oy: number; moved: boolean; node: string | null };
type Link = { from: string; to: string; counts: Record<string, number>; total: number };

export function TreeMap({ repoId, repoName = "repository", assignmentId, height = 660, compact = false }: { repoId: string; repoName?: string; assignmentId?: string; height?: number; compact?: boolean }) {
  const [data, setData] = useState<MapData | null>(null);
  const [err, setErr] = useState("");
  const [scope, setScope] = useState<"all" | "path">("all");
  const [expanded, setExpanded] = useState<Set<string>>(new Set(["root"]));
  const [sel, setSel] = useState<string | null>(null);
  const [hover, setHover] = useState<string | null>(null);
  const [symbols, setSymbols] = useState<Map<string, Sym[]>>(new Map());
  const [types, setTypes] = useState<Set<string>>(new Set(TYPES));
  const [q, setQ] = useState("");
  const [view, setView] = useState({ x: 24, y: 24, k: 1 });
  const [size, setSize] = useState({ w: 900, h: height });
  const [code, setCode] = useState<{ id: string; lines: string[]; from: number } | null>(null);
  const wrap = useRef<HTMLDivElement>(null);
  const svg = useRef<SVGSVGElement>(null);
  const drag = useRef<Drag | null>(null);
  const keepOnScreen = useRef<{ id: string; sx: number; sy: number } | null>(null);
  const pendingCenter = useRef<string | null>(null);
  const initFor = useRef("");
  const viewPending = useRef<"fit" | "root" | null>(null);
  const [tick, setTick] = useState(0);

  // ---------- load ----------
  useEffect(() => {
    let live = true;
    setData(null); setErr(""); setSel(null); setSymbols(new Map()); setCode(null);
    const qs = new URLSearchParams({ repoId, level: "full", ...(assignmentId ? { assignmentId } : {}) });
    fetch(`/api/graph?${qs}`)
      .then(async (r) => (r.ok ? r.json() : Promise.reject(new Error((await r.json().catch(() => ({}))).error ?? r.statusText))))
      .then((d: MapData) => live && setData(d))
      .catch((e: Error) => live && setErr(e.message));
    return () => { live = false; };
  }, [repoId, assignmentId]);

  useEffect(() => {
    if (!wrap.current) return;
    const ro = new ResizeObserver(([e]) => setSize({ w: Math.max(320, e.contentRect.width), h: height }));
    ro.observe(wrap.current);
    return () => ro.disconnect();
  }, [height, data]);

  const learning = data?.learning;
  const order = data?.learningOrder;
  const hasPath = !!order && Object.keys(order).length > 0;

  // ---------- model ----------
  const fileInfo = useMemo(() => new Map((data?.nodes ?? []).map((n) => [n.id, n])), [data]);
  const usedFiles = useMemo(() => {
    const all = data?.nodes ?? [];
    return scope === "path" && hasPath ? all.filter((n) => order![n.id]) : all;
  }, [data, scope, hasPath, order]);
  const tree = useMemo(() => buildTree(usedFiles.map((n) => ({ id: n.id, path: n.path })), repoName), [usedFiles, repoName]);

  // first view of a tree: candidates start in "my path" with everything open, managers see two levels
  useEffect(() => {
    if (!data) return;
    const key = `${repoId}|${assignmentId ?? ""}`;
    if (initFor.current === key) return;
    initFor.current = key;
    if (hasPath) setScope("path");
  }, [data, hasPath, repoId, assignmentId]);
  const treeKey = `${scope}|${usedFiles.length}`;
  const openedFor = useRef("");
  useEffect(() => {
    if (!data || openedFor.current === treeKey) return;
    openedFor.current = treeKey;
    setExpanded(scope === "path" ? openToDepth(tree, 99) : openToDepth(tree, 2));
    setSel(null);
    setTimeout(() => { viewPending.current = scope === "path" ? "fit" : "root"; setTick((t) => t + 1); }, 0); // applied once the new layout exists
  }, [data, tree, treeKey, scope]);

  // functions of an opened file become its children
  const symNodes = useCallback((n: TNode): TNode[] => {
    if (n.kind !== "file" || !n.fileId) return [];
    return (symbols.get(n.fileId) ?? []).map((s) => ({ id: `s:${s.id}`, kind: "symbol" as const, label: s.name, path: n.path, fileId: n.fileId, children: [], files: 0, parent: n.id, depth: n.depth + 1 }));
  }, [symbols]);
  const childrenOf = useCallback((n: TNode) => (n.kind === "file" ? (expanded.has(n.id) ? symNodes(n) : []) : n.children), [expanded, symNodes]);
  const symById = useMemo(() => { const m = new Map<string, { sym: Sym; file: string }>(); for (const [f, list] of symbols) for (const s of list) m.set(`s:${s.id}`, { sym: s, file: f }); return m; }, [symbols]);
  const nodeOf = useCallback((id: string): TNode | undefined => {
    const t = tree.byId.get(id);
    if (t) return t;
    const s = symById.get(id);
    const f = s ? tree.byId.get(`f:${s.file}`) : undefined;
    return s && f ? { id, kind: "symbol", label: s.sym.name, path: f.path, fileId: s.file, children: [], files: 0, parent: f.id, depth: f.depth + 1 } : undefined;
  }, [tree, symById]);

  const layout = useMemo(() => layoutTree(tree.root, expanded, childrenOf), [tree, expanded, childrenOf]);
  const visible = useMemo(() => new Set(layout.placed.keys()), [layout]);
  const topIndex = useMemo(() => new Map(tree.root.children.filter((c) => c.kind === "dir").map((c, i) => [c.id, i])), [tree]);
  const colorOf = useCallback((id: string) => {
    let cur: string | null = id, last = id;
    while (cur && cur !== "root") {
      last = cur;
      const t: TNode | undefined = tree.byId.get(cur);
      cur = t ? t.parent : symById.has(cur) ? `f:${symById.get(cur)!.file}` : null;
    }
    const i = topIndex.get(last);
    return i === undefined ? "#94a3b8" : topColor(i);
  }, [tree, topIndex, symById]);

  const pos = useCallback((id: string) => {
    const p = layout.placed.get(id);
    return p ? { x: p.depth * COL, y: p.row * ROW } : null;
  }, [layout]);
  const widthOf = (n?: TNode) => (n?.kind === "symbol" ? SYM_W : NODE_W);

  // ---------- search ----------
  const needle = q.trim().toLowerCase().length >= 2 ? q.trim().toLowerCase() : "";
  const matches = useMemo(() => {
    if (!needle) return [] as TNode[];
    return [...tree.byId.values()].filter((n) => n.kind !== "root" && (n.kind === "file" ? n.path : n.label).toLowerCase().includes(needle)).slice(0, 60);
  }, [tree, needle]);
  const matchSet = useMemo(() => new Set(matches.map((m) => m.id)), [matches]);
  useEffect(() => {
    if (!matches.length) return;
    const open = new Set<string>();
    for (const m of matches) for (const a of ancestors(tree.byId, m.id)) open.add(a);
    setExpanded((s) => (open.size && [...open].some((x) => !s.has(x)) ? new Set([...s, ...open]) : s));
  }, [matches, tree]);

  // ---------- dependency lines for the selection ----------
  const selNode = sel ? nodeOf(sel) : undefined;
  const focusFiles = useMemo(() => {
    if (!selNode || selNode.kind === "root") return new Set<string>();
    if (selNode.kind === "dir") return new Set(descendantFileIds(selNode));
    return new Set(selNode.fileId ? [selNode.fileId] : []);
  }, [selNode]);
  const selAnchor = useMemo(() => {
    if (!selNode || !focusFiles.size) return null;
    if (selNode.kind === "symbol") return visible.has(`f:${selNode.fileId}`) ? `f:${selNode.fileId}` : null;
    return visible.has(selNode.id) ? selNode.id : null;
  }, [selNode, focusFiles, visible]);

  const links = useMemo(() => {
    const out: Link[] = [];
    if (!selAnchor) return out;
    const agg = new Map<string, Link>();
    for (const e of data?.edges ?? []) {
      if (!types.has(e.type)) continue;
      const fromIn = focusFiles.has(e.from), toIn = focusFiles.has(e.to);
      if (fromIn === toIn) continue; // keep only edges crossing the selection boundary
      const other = nearestVisible(tree.byId, fromIn ? e.to : e.from, visible);
      if (!other || other === selAnchor) continue;
      const from = fromIn ? selAnchor : other, to = fromIn ? other : selAnchor;
      const k = `${from}>${to}`;
      const cur = agg.get(k) ?? { from, to, counts: {}, total: 0 };
      cur.counts[e.type] = (cur.counts[e.type] ?? 0) + 1; cur.total += 1;
      agg.set(k, cur);
    }
    return [...agg.values()].sort((a, b) => b.total - a.total);
  }, [data, types, selAnchor, focusFiles, tree, visible]);
  const shownLinks = links.slice(0, 16); // a hub file can have dozens: draw the strongest, list the rest in the panel
  const moreLinks = links.length - shownLinks.length;

  const counts = useMemo(() => { const c: Record<string, number> = {}; for (const e of data?.edges ?? []) c[e.type] = (c[e.type] ?? 0) + 1; return c; }, [data]);
  const hoverPath = useMemo(() => new Set(hover ? [hover, ...ancestors(tree.byId, hover), ...(symById.has(hover) ? ancestors(tree.byId, `f:${symById.get(hover)!.file}`) : [])] : []), [hover, tree, symById]);

  // ---------- view ----------
  const fit = useCallback(() => {
    const rows = Math.max(1, layout.rows), maxDepth = Math.max(0, ...[...layout.placed.values()].map((p) => p.depth));
    const w = (maxDepth + 1) * COL, h = rows * ROW;
    // Never shrink below a readable size. A deep tree in a narrow panel is wider than the panel: keep the deepest
    // column (the files) on screen and let the user pan to the folders on the left.
    const k = Math.max(Math.min(size.w / (w + 60), size.h / (h + 40), 1), MIN_FIT);
    const x = w * k + 48 > size.w ? Math.min(24, size.w - w * k - 24 + (COL - NODE_W) * k) : 24;
    setView({ k, x, y: size.h > h * k ? (size.h - h * k) / 2 : 24 });
  }, [layout, size.w, size.h]);

  useEffect(() => {
    const mode = viewPending.current;
    if (!mode) return;
    viewPending.current = null;
    if (mode === "fit") fit();
    else { const p = pos("root"); if (p) setView({ k: 1, x: 24, y: size.h / 2 - (p.y + NODE_H / 2) }); } // keep the repository node in sight
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick]);

  useEffect(() => {
    const keep = keepOnScreen.current;
    if (keep && !pendingCenter.current) {
      const p = pos(keep.id);
      if (p) { keepOnScreen.current = null; setView((v) => ({ ...v, x: keep.sx - p.x * v.k, y: keep.sy - p.y * v.k })); }
    }
    if (pendingCenter.current) {
      const p = pos(pendingCenter.current);
      if (p) {
        pendingCenter.current = null;
        setView((v) => { const k = Math.max(v.k, 0.9); return { k, x: size.w * 0.35 - p.x * k, y: size.h / 2 - (p.y + NODE_H / 2) * k }; });
      }
    }
  }, [layout, pos, size.w, size.h]);

  useEffect(() => {
    const el = svg.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const r = el.getBoundingClientRect();
      const px = e.clientX - r.left, py = e.clientY - r.top;
      setView((v) => { const k = Math.min(2.5, Math.max(0.15, v.k * Math.exp(-e.deltaY * 0.0015))); return { k, x: px - ((px - v.x) / v.k) * k, y: py - ((py - v.y) / v.k) * k }; });
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [data]);

  // ---------- actions ----------
  const loadSymbols = useCallback(async (fileId: string) => {
    if (symbols.has(fileId)) return;
    const r = await fetch(`/api/graph?${new URLSearchParams({ repoId, level: "symbol", focus: fileId })}`);
    if (!r.ok) { setSymbols((m) => new Map(m).set(fileId, [])); return; }
    const g = (await r.json()) as GraphData;
    const list = g.nodes.filter((n) => n.kind === "symbol" && !n.outside).map((n) => ({ id: n.id, name: n.label, sub: n.sub ?? "", start: n.startLine, end: n.endLine }));
    setSymbols((m) => new Map(m).set(fileId, list));
  }, [repoId, symbols]);

  const toggle = (id: string) => {
    const p = pos(id);
    if (p) keepOnScreen.current = { id, sx: p.x * view.k + view.x, sy: p.y * view.k + view.y };
    const n = nodeOf(id);
    if (n?.kind === "file" && n.fileId) void loadSymbols(n.fileId);
    setExpanded((s) => { const x = new Set(s); if (x.has(id)) x.delete(id); else x.add(id); return x; });
  };
  const select = (id: string) => { setSel(id); setCode(null); };
  const reveal = useCallback((fileId: string) => {
    const id = `f:${fileId}`;
    if (!tree.byId.has(id)) {
      if (hasPath && scope === "path") setScope("all"); // the file is outside the path view
      return;
    }
    setExpanded((s) => new Set([...s, ...foldersToOpen(tree.byId, [fileId])]));
    setSel(id); setCode(null);
    pendingCenter.current = id;
  }, [tree, hasPath, scope]);
  const expandAllFolders = () => setExpanded(openToDepth(tree, 99));
  const collapseAll = () => setExpanded(new Set(["root"]));
  const toggleType = (t: string) => setTypes((s) => { const n = new Set(s); if (n.has(t)) n.delete(t); else n.add(t); return n; });

  // ---------- pointer ----------
  const onDown = (e: React.PointerEvent) => {
    svg.current?.setPointerCapture(e.pointerId);
    const node = (e.target as Element).closest("[data-node]")?.getAttribute("data-node") ?? null;
    drag.current = { sx: e.clientX, sy: e.clientY, ox: view.x, oy: view.y, moved: false, node };
  };
  const onMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    if (Math.hypot(e.clientX - d.sx, e.clientY - d.sy) > 4) d.moved = true;
    if (d.moved) setView((v) => ({ ...v, x: d.ox + e.clientX - d.sx, y: d.oy + e.clientY - d.sy }));
  };
  const onUp = (e: React.PointerEvent) => {
    const d = drag.current;
    drag.current = null;
    svg.current?.releasePointerCapture(e.pointerId);
    if (!d || d.moved) return;
    if (!d.node) { setSel(null); return; }
    const n = nodeOf(d.node);
    select(d.node);
    if (n && (n.kind === "dir" || n.kind === "file")) toggle(d.node);
  };

  // ---------- details ----------
  const rel = useMemo(() => {
    const r = { imports: [] as string[], importedBy: [] as string[], uses: [] as { id: string; type: string; n: number }[], usedBy: [] as { id: string; type: string; n: number }[] };
    if (!selNode || selNode.kind === "dir" || selNode.kind === "root" || !selNode.fileId) return r;
    const f = selNode.fileId;
    for (const e of data?.edges ?? []) {
      if (!types.has(e.type)) continue;
      if (e.from === f) { if (e.type === "IMPORTS") r.imports.push(e.to); else r.uses.push({ id: e.to, type: e.type, n: e.count }); }
      if (e.to === f) { if (e.type === "IMPORTS") r.importedBy.push(e.from); else r.usedBy.push({ id: e.from, type: e.type, n: e.count }); }
    }
    return r;
  }, [data, selNode, types]);
  const dirLinks = useMemo(() => {
    if (!selNode || selNode.kind !== "dir") return { out: [] as [string, string, number][], inn: [] as [string, string, number][] };
    const out = new Map<string, [string, number]>(), inn = new Map<string, [string, number]>();
    const dirOf = (id: string) => (fileInfo.get(id)?.path ?? "").split("/").slice(0, -1).join("/") || "(root)";
    for (const e of data?.edges ?? []) {
      if (!types.has(e.type)) continue;
      const a = focusFiles.has(e.from), b = focusFiles.has(e.to);
      if (a === b) continue;
      const other = a ? e.to : e.from, bucket = a ? out : inn, k = dirOf(other);
      const cur = bucket.get(k) ?? [other, 0];
      bucket.set(k, [cur[0], cur[1] + 1]);
    }
    const flat = (m: Map<string, [string, number]>) => [...m].map(([k, [id, n]]) => [k, id, n] as [string, string, number]).sort((x, y) => y[2] - x[2]).slice(0, 8);
    return { out: flat(out), inn: flat(inn) };
  }, [data, selNode, focusFiles, types, fileInfo]);

  const openCode = async () => {
    if (!selNode?.fileId) return;
    const r = await fetch(`/api/code?${new URLSearchParams({ repoId, path: selNode.path })}`);
    if (!r.ok) return;
    const all = ((await r.json()) as { content: string }).content.split("\n");
    const s = symById.get(selNode.id)?.sym;
    const from = s?.start ? Math.max(1, s.start) : 1, to = s?.end ? Math.min(all.length, s.end, from + 119) : Math.min(all.length, 120);
    setCode({ id: selNode.id, lines: all.slice(from - 1, to), from });
  };

  // ---------- render ----------
  if (err) return <p className="text-sm text-slate-950">Could not load the code map: {err}</p>;
  if (!data) return <div className="grid place-items-center rounded-xl border bg-white text-sm text-slate-500" style={{ height }}>Loading code map…</div>;
  if (!data.nodes.length) return <p className="rounded-xl border bg-white p-4 text-sm text-slate-500">{data.notes[0] ?? "Nothing to show yet."}</p>;

  const chip = (on: boolean) => `rounded-full border px-2.5 py-1 text-xs transition-colors ${on ? "pill-on" : "bg-white text-slate-600 hover:bg-slate-100"}`;
  const statusColor = (fileId?: string) => (fileId && learning?.[fileId] === "done" ? "#10b981" : fileId && learning?.[fileId] === "todo" ? "#4d82ff" : null);
  const nextId = order && learning ? nextToLearn(order, learning) : null;
  const pathList = hasPath ? Object.entries(order!).sort((a, b) => a[1] - b[1]).filter(([id]) => fileInfo.has(id)) : [];
  const label = (fileId: string) => fileInfo.get(fileId)?.path ?? fileId;
  const todoIn = (n: TNode) => (learning ? descendantFileIds(n).filter((f) => learning[f] === "todo").length : 0);

  const placedList = layout.order.filter((id) => layout.placed.has(id));
  const edgesDrawn: { a: string; b: string }[] = [];
  for (const id of placedList) {
    const n = nodeOf(id);
    if (!n) continue;
    for (const k of childrenOf(n)) if (layout.placed.has(k.id)) edgesDrawn.push({ a: id, b: k.id });
  }

  return (
    <div>
      {data.notes.map((n) => <p key={n} className="mb-2 text-sm text-slate-500">{n}</p>)}
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search a file or folder…" aria-label="Search"
          onKeyDown={(e) => { if (e.key === "Enter" && matches[0]) { const m = matches[0]; if (m.kind === "file" && m.fileId) reveal(m.fileId); else { setSel(m.id); pendingCenter.current = m.id; } } }}
          className="w-56 rounded-full border bg-white px-3 py-1 text-sm outline-none focus:border-slate-950" />
        {hasPath && (
          <>
            <button onClick={() => setScope("path")} className={chip(scope === "path")}>My path</button>
            <button onClick={() => setScope("all")} className={chip(scope === "all")}>Whole codebase</button>
            {nextId && <button onClick={() => reveal(nextId)} className="rounded-full bg-slate-950 px-3 py-1 text-xs text-white">Next lesson</button>}
          </>
        )}
        <button onClick={expandAllFolders} className={chip(false)}>Open all folders</button>
        <button onClick={collapseAll} className={chip(false)}>Close all</button>
        <button onClick={fit} className={chip(false)}>Fit</button>
        <span className="mx-1 text-slate-300">|</span>
        {TYPES.filter((t) => counts[t]).map((t) => (
          <button key={t} onClick={() => toggleType(t)} className={chip(types.has(t))} aria-pressed={types.has(t)} title={`Show ${EDGE[t].label.toLowerCase()} lines for the selected node`}>
            <span className="mr-1.5 inline-block h-2 w-2 rounded-full" style={{ background: EDGE[t].color }} />{EDGE[t].label}
          </button>
        ))}
        <span className="ml-auto text-xs text-slate-500">{usedFiles.length} files{scope === "path" ? " in your path" : ""}</span>
      </div>
      {learning && (
        <div className="mb-2 flex flex-wrap items-center gap-3 text-xs text-slate-600">
          <span className="font-medium text-slate-800">Your learning:</span>
          <span><span className="mr-1 inline-block h-2.5 w-2.5 rounded-full ring-2 ring-emerald-500" />understood</span>
          <span><span className="mr-1 inline-block h-2.5 w-2.5 rounded-full ring-2 ring-indigo-600" />still to learn</span>
          <span className="text-slate-400">The number is the order your path reads each file.</span>
        </div>
      )}

      <div className={compact ? "grid gap-3" : "grid gap-3 lg:grid-cols-[1fr_340px]"}>
        <div ref={wrap} className="relative overflow-hidden rounded-xl border bg-white" style={{ height }}>
          <svg ref={svg} width={size.w} height={size.h} className="touch-none select-none" style={{ cursor: "grab" }}
            role="img" aria-label="Tree of the folders, files and functions of this codebase"
            onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}>
            <defs>
              {TYPES.map((t) => (
                <marker key={t} id={`tm-${t}`} viewBox="0 0 10 10" refX="9" refY="5" markerUnits="userSpaceOnUse" markerWidth="11" markerHeight="11" orient="auto">
                  <path d="M0 1L10 5L0 9z" fill={EDGE[t].color} />
                </marker>
              ))}
              <pattern id="tm-dots" width="22" height="22" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r="1" style={{ fill: "var(--app-border, #e3e6ec)" }} /></pattern>
            </defs>
            <rect width={size.w} height={size.h} fill="url(#tm-dots)" pointerEvents="none" />
            <g transform={`translate(${view.x} ${view.y}) scale(${view.k})`}>
              {/* the hierarchy: parent -> child */}
              {edgesDrawn.map(({ a, b }) => {
                const pa = pos(a)!, pb = pos(b)!, na = nodeOf(a);
                const onPath = hoverPath.has(b) && hoverPath.has(a);
                return <path key={a + ">" + b} d={connectorPath(pa.x + widthOf(na), pa.y + NODE_H / 2, pb.x, pb.y + NODE_H / 2)} fill="none" strokeWidth={(onPath ? 2.2 : 1.4) / Math.max(view.k, 0.8)} style={{ stroke: onPath ? "#4d82ff" : "var(--app-border-strong, #c8cfdb)" }} />;
              })}

              {/* dependency lines of the selection */}
              {shownLinks.map((l) => {
                const pa = pos(l.from), pb = pos(l.to);
                if (!pa || !pb) return null;
                const na = nodeOf(l.from), nb = nodeOf(l.to);
                const dom = PRIORITY.find((t) => l.counts[t]) ?? "IMPORTS";
                const goesRight = pb.x > pa.x;
                const x1 = goesRight ? pa.x + widthOf(na) : pa.x, x2 = goesRight ? pb.x : pb.x + widthOf(nb);
                const y1 = pa.y + NODE_H / 2, y2 = pb.y + NODE_H / 2;
                const d = Math.abs(pb.x - pa.x) < 4 ? `M${pa.x + widthOf(na)} ${y1} C${pa.x + widthOf(na) + 70} ${y1} ${pb.x + widthOf(nb) + 70} ${y2} ${pb.x + widthOf(nb)} ${y2}`
                  : goesRight ? connectorPath(x1, y1, x2 - 3, y2) : `M${x1} ${y1} C${x1 - Math.max(48, Math.abs(x2 - x1) * 0.5)} ${y1} ${x2 + Math.max(48, Math.abs(x2 - x1) * 0.5)} ${y2} ${x2 + 3} ${y2}`;
                const mid = connectorPoint(x1, y1, x2, y2);
                const tip = Object.entries(l.counts).map(([t, n]) => `${n} ${EDGE[t].label.toLowerCase()}`).join(", ");
                return (
                  <g key={l.from + ">" + l.to}>
                    <path d={d} fill="none" stroke={EDGE[dom].color} strokeWidth={Math.min(1.1 + Math.log2(l.total) * 0.35, 2.2) / Math.max(view.k, 0.8)} strokeDasharray="6 4" markerEnd={`url(#tm-${dom})`} opacity={0.85}>
                      <title>{`${nodeOf(l.from)?.label} → ${nodeOf(l.to)?.label}: ${tip}`}</title>
                    </path>
                    {l.total > 1 && Math.abs(pb.x - pa.x) >= 4 && (
                      <g transform={`translate(${mid.x} ${mid.y})`}>
                        <rect x={-12} y={-9} width={24} height={18} rx={9} style={{ fill: "var(--map-bg)", stroke: EDGE[dom].color }} />
                        <text textAnchor="middle" y={4} fontSize={10} style={{ fill: "var(--map-text)" }}>{l.total}</text>
                      </g>
                    )}
                  </g>
                );
              })}

              {placedList.map((id) => {
                const n = nodeOf(id), p = pos(id);
                if (!n || !p) return null;
                const w = widthOf(n);
                const open = expanded.has(id) && childrenOf(n).length > 0;
                const isSel = sel === id, isMatch = matchSet.has(id);
                const dim = needle ? !isMatch && !matches.some((m) => ancestors(tree.byId, m.id).includes(id)) : false;
                const st = n.kind === "file" ? statusColor(n.fileId) : null;
                const num = n.kind === "file" && n.fileId && order ? order[n.fileId] : undefined;
                const canOpen = n.kind === "dir" || (n.kind === "file" && !(n.fileId && symbols.get(n.fileId)?.length === 0));
                const info = n.kind === "file" && n.fileId ? fileInfo.get(n.fileId) : undefined;
                const sym = n.kind === "symbol" ? symById.get(id)?.sym : undefined;
                const todo = n.kind === "dir" ? todoIn(n) : 0;
                const sub = n.kind === "root" ? `${n.files} files` : n.kind === "dir" ? `${n.files} files${todo ? ` · ${todo} to learn` : ""}` : n.kind === "file" ? `${info?.lineCount ?? ""} lines${info?.inCount ? ` · ←${info.inCount}` : ""}` : (sym?.sub ?? "");
                return (
                  <g key={id} data-node={id} transform={`translate(${p.x} ${p.y})`} opacity={dim ? 0.35 : 1} className="cursor-pointer"
                    onPointerEnter={() => setHover(id)} onPointerLeave={() => setHover(null)}>
                    <rect width={w} height={NODE_H} rx={9} style={{ fill: "var(--map-bg)", stroke: isSel ? "#4d82ff" : isMatch ? "#f6c453" : "var(--app-border-strong, #c8cfdb)" }} strokeWidth={isSel || isMatch ? 2 : 1} />
                    {n.kind === "dir" && <rect width={5} height={NODE_H} rx={2.5} fill={colorOf(id)} />}
                    {n.kind === "root" && <rect width={5} height={NODE_H} rx={2.5} fill="#4d82ff" />}
                    {num ? (
                      <g>
                        <circle cx={19} cy={NODE_H / 2} r={9} style={{ fill: "var(--map-bg)" }} stroke={st ?? "#94a3b8"} strokeWidth={2} />
                        <text x={19} y={NODE_H / 2 + 3.5} fontSize={10} fontWeight={600} textAnchor="middle" style={{ fill: "var(--map-text)" }}>{num}</text>
                      </g>
                    ) : st ? <circle cx={19} cy={NODE_H / 2} r={5} fill="transparent" stroke={st} strokeWidth={2} /> : null}
                    {n.kind === "symbol" && <text x={12} y={NODE_H / 2 + 4} fontSize={11} style={{ fill: "var(--app-muted, #5b6678)", fontFamily: "ui-monospace, Consolas, monospace" }}>{sym?.sub.startsWith("class") ? "C" : "ƒ"}</text>}
                    <text x={n.kind === "symbol" ? 28 : num || st ? 36 : 16} y={sub ? 16 : NODE_H / 2 + 4} fontSize={n.kind === "dir" || n.kind === "root" ? 13 : 12} fontWeight={n.kind === "dir" || n.kind === "root" ? 600 : 500}
                      style={{ fill: "var(--map-text)", fontFamily: n.kind === "file" || n.kind === "symbol" ? "ui-monospace, Consolas, monospace" : undefined }}>{trunc(n.label, n.kind === "symbol" ? 24 : 27)}</text>
                    {sub && <text x={n.kind === "symbol" ? 28 : num || st ? 36 : 16} y={30} fontSize={10} style={{ fill: "var(--app-muted, #5b6678)" }}>{trunc(sub, 34)}</text>}
                    {canOpen && (
                      <path d={open ? `M${w - 24} ${NODE_H / 2 - 3}l5 5 5-5` : `M${w - 22} ${NODE_H / 2 - 5}l5 5-5 5`} fill="none" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" style={{ stroke: "var(--app-muted, #5b6678)" }} />
                    )}
                    <title>{n.kind === "dir" ? `${n.path} (${n.files} files)` : n.kind === "symbol" ? `${n.label} in ${n.path}` : n.path || n.label}</title>
                  </g>
                );
              })}
            </g>
          </svg>
          <div className="pointer-events-none absolute bottom-2 left-3 text-xs text-slate-400">Click a node to open or close it · the selected node shows what it connects to{moreLinks > 0 ? ` (strongest 16 drawn, +${moreLinks} in the panel)` : ""} · drag to pan · scroll to zoom</div>
        </div>

        <aside className="overflow-auto rounded-xl border bg-white p-3 text-sm" style={{ maxHeight: compact ? 380 : height }}>
          {!selNode && (
            <div>
              <p className="text-slate-500">This is the codebase as a tree: the repository contains folders, folders contain files, and a file contains functions. Click a node to open it. Select a node and dashed lines show what it depends on and what depends on it.</p>
              {pathList.length > 0 && (
                <div className="mt-3">
                  <p className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-500">Your path, in reading order</p>
                  <ol className="space-y-0.5">{pathList.slice(0, 14).map(([id, n]) => (
                    <li key={id}><button onClick={() => reveal(id)} className="flex w-full items-center gap-2 rounded px-1 py-0.5 text-left text-xs hover:bg-slate-100">
                      <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full border-2 text-xs font-semibold" style={{ borderColor: statusColor(id) ?? "#94a3b8" }}>{n}</span>
                      <span className="break-all">{label(id)}</span>
                    </button></li>
                  ))}</ol>
                </div>
              )}
            </div>
          )}

          {selNode && (selNode.kind === "dir" || selNode.kind === "root") && (
            <div>
              <p className="text-xs text-slate-500">{selNode.kind === "root" ? "repository" : "folder"}</p>
              <p className="mb-1 break-all text-base font-semibold">{selNode.kind === "root" ? repoName : selNode.path}</p>
              <p className="mb-2 text-xs text-slate-500">{selNode.files} files{selNode.kind === "dir" && learning ? ` · ${descendantFileIds(selNode).filter((f) => learning[f] === "done").length} understood, ${todoIn(selNode)} to learn` : ""}</p>
              {selNode.kind === "dir" && ([["Depends on", dirLinks.out], ["Used by", dirLinks.inn]] as [string, [string, string, number][]][]).map(([title, list]) => list.length ? (
                <div key={title} className="mb-3">
                  <p className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-500">{title}</p>
                  <ul>{list.map(([dir, id, n]) => (
                    <li key={dir}><button onClick={() => reveal(id)} className="flex w-full items-center justify-between gap-2 rounded px-1 py-0.5 text-left text-xs hover:bg-slate-100"><span className="break-all">{dir}</span><span className="text-slate-400">{n}</span></button></li>
                  ))}</ul>
                </div>
              ) : null)}
              {selNode.kind === "dir" && !dirLinks.out.length && !dirLinks.inn.length && <p className="text-xs text-slate-500">No connections to other folders with the current filters.</p>}
            </div>
          )}

          {selNode && (selNode.kind === "file" || selNode.kind === "symbol") && selNode.fileId && (() => {
            const f = fileInfo.get(selNode.fileId!);
            const sym = selNode.kind === "symbol" ? symById.get(selNode.id)?.sym : undefined;
            return (
              <div>
                {sym && <p className="text-xs text-slate-500">function in</p>}
                <p className="break-all font-semibold">{sym ? sym.name : selNode.path}</p>
                <p className="mb-2 text-xs text-slate-500">{sym ? `${selNode.path} · ${sym.sub}` : `${f?.lineCount ?? ""} lines · imported by ${f?.inCount ?? 0}`}</p>
                {learning && !sym && <p className="mb-2 text-sm text-slate-500">
                  {learning[selNode.fileId!] === "done" ? "You have completed this" : learning[selNode.fileId!] === "todo" ? "In your path: still to learn" : "Not in your path"}</p>}
                {f?.summary && !sym && <p className="mb-2 text-slate-700">{f.summary}</p>}
                <button onClick={openCode} className="mb-3 rounded-full bg-slate-950 px-3 py-1 text-xs text-white">{sym ? "View function" : "View code"}</button>
                {([["Imports", rel.imports.map((id) => ({ id, type: "IMPORTS", n: 1 }))], ["Imported by", rel.importedBy.map((id) => ({ id, type: "IMPORTS", n: 1 }))], ["Uses / calls", rel.uses], ["Used / called by", rel.usedBy]] as [string, { id: string; type: string; n: number }[]][]).map(([title, list]) => list.length ? (
                  <div key={title} className="mb-3">
                    <p className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-500">{title} ({list.length})</p>
                    <ul className="space-y-0.5">{list.map((x, i) => (
                      <li key={x.id + x.type + i}><button onClick={() => reveal(x.id)} className="flex w-full items-start gap-1.5 rounded px-1 py-0.5 text-left text-xs hover:bg-slate-100">
                        <span className="mt-1 inline-block h-2 w-2 shrink-0 rounded-full" style={{ background: EDGE[x.type].color }} /><span className="break-all">{label(x.id)}{x.n > 1 ? ` ×${x.n}` : ""}</span>
                      </button></li>
                    ))}</ul>
                  </div>
                ) : null)}
                {!rel.imports.length && !rel.importedBy.length && !rel.uses.length && !rel.usedBy.length && <p className="text-xs text-slate-500">No connections with the current filters.</p>}
                {code?.id === selNode.id && <pre className="max-h-80 overflow-auto rounded bg-slate-900 p-2 text-xs leading-4 text-slate-100">{code.lines.map((l, i) => `${String(code.from + i).padStart(4)}  ${l}`).join("\n")}</pre>}
              </div>
            );
          })()}
        </aside>
      </div>
    </div>
  );
}
