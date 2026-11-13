"use client";
// Node canvas for the code graph (n8n / CodeSee style). Modules are cards laid out left to right by dependency; a card
// expands in place to list its files; connections are smooth lines between ports with arrowheads. Drag cards, pan, zoom,
// hover or select to follow a connection, search, filter by connection type. With `assignmentId` (candidate view) files
// carry learning status: green = understood, blue = still to learn.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { GraphData, MapData, MapNode } from "@/lib/graph";
import { connectorPath, connectorPoint, flowLayout } from "@/lib/flowlayout";
import { nextToLearn } from "@/lib/learning-order";

const EDGE: Record<string, { color: string; label: string }> = {
  IMPORTS: { color: "#64748b", label: "Imports" },
  CALLS: { color: "#ea580c", label: "Calls" },
  REFERENCES: { color: "#9333ea", label: "References" },
  EXTENDS: { color: "#0d9488", label: "Extends" },
  IMPLEMENTS: { color: "#0891b2", label: "Implements" },
};
const TYPES = Object.keys(EDGE);
const PRIORITY = ["CALLS", "REFERENCES", "EXTENDS", "IMPLEMENTS", "IMPORTS"]; // line colour = the most telling type present
const modColor = (i: number) => `hsl(${(i * 137.5) % 360} 55% 50%)`;

const W_COLLAPSED = 240, W_EXPANDED = 320, H_HEAD = 58, ROW_H = 26, PAD = 8, MAX_ROWS = 12;
const base = (p: string) => p.split("/").pop() ?? p;
const trunc = (s: string, n: number) => (s.length > n ? s.slice(0, n - 1) + "…" : s);

type Mod = { id: string; name: string; parentName: string | null; files: MapNode[]; color: string };
type Anchor = { key: string; modId: string; fileId: string | null; xl: number; xr: number; y: number };
type Agg = { a: Anchor; b: Anchor; counts: Record<string, number>; total: number; heuristic: number; files: Set<string> };
type Drag = { kind: "pan" | "card"; id?: string; sx: number; sy: number; ox: number; oy: number; moved: boolean; hit: { kind: "toggle" | "row" | "card" | null; mod?: string; file?: string } };

export function FlowMap({ repoId, assignmentId, height = 640, compact = false }: { repoId: string; assignmentId?: string; height?: number; compact?: boolean }) {
  const [data, setData] = useState<MapData | null>(null);
  const [err, setErr] = useState("");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [off, setOff] = useState<Map<string, { dx: number; dy: number }>>(new Map());
  const [selMod, setSelMod] = useState<string | null>(null);
  const [selFile, setSelFile] = useState<string | null>(null);
  const [hover, setHover] = useState<string | null>(null); // module id
  const [types, setTypes] = useState<Set<string>>(new Set(TYPES));
  const [q, setQ] = useState("");
  const [view, setView] = useState({ x: 20, y: 20, k: 1 });
  const [size, setSize] = useState({ w: 900, h: height });
  const [code, setCode] = useState<{ path: string; lines: string[] } | null>(null);
  const [symLinks, setSymLinks] = useState<{ id: string; lines: string[] } | null>(null);
  const wrap = useRef<HTMLDivElement>(null);
  const svg = useRef<SVGSVGElement>(null);
  const drag = useRef<Drag | null>(null);
  const lastClick = useRef<{ id: string; t: number } | null>(null);
  const pendingCenter = useRef<string | null>(null);
  const keepOnScreen = useRef<{ id: string; sx: number; sy: number } | null>(null);

  // ---------- load ----------
  useEffect(() => {
    let live = true;
    setData(null); setErr(""); setExpanded(new Set()); setOff(new Map()); setSelMod(null); setSelFile(null);
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

  // ---------- model ----------
  const learning = data?.learning;
  const order = data?.learningOrder; // file id -> position in the candidate's path
  const needle = q.trim().toLowerCase().length >= 2 ? q.trim().toLowerCase() : "";
  const mods: Mod[] = useMemo(() => {
    if (!data) return [];
    const byMod = new Map<string, MapNode[]>();
    for (const n of data.nodes) (byMod.get(n.moduleId) ?? byMod.set(n.moduleId, []).get(n.moduleId)!).push(n);
    const list: Mod[] = data.modules.filter((m) => byMod.has(m.id)).map((m, i) => ({ id: m.id, name: m.name, parentName: m.parentName ?? null, files: byMod.get(m.id)!, color: modColor(i) }));
    const known = new Set(list.map((m) => m.id));
    for (const [id, files] of byMod) if (!known.has(id)) list.push({ id, name: "Other", parentName: null, files, color: "#94a3b8" });
    return list;
  }, [data]);
  const modById = useMemo(() => new Map(mods.map((m) => [m.id, m])), [mods]);
  const fileMod = useMemo(() => new Map((data?.nodes ?? []).map((n) => [n.id, n.moduleId])), [data]);
  const fileById = useMemo(() => new Map((data?.nodes ?? []).map((n) => [n.id, n])), [data]);

  const matchedFiles = useMemo(() => new Set(needle ? (data?.nodes ?? []).filter((n) => n.path.toLowerCase().includes(needle)).map((n) => n.id) : []), [data, needle]);
  const matchedMods = useMemo(() => new Set([...matchedFiles].map((f) => fileMod.get(f)!)), [matchedFiles, fileMod]);

  // rows shown inside an expanded card: matches, the selection and files still to learn first, then the most imported
  const rowsOf = useCallback((m: Mod): { rows: MapNode[]; more: number } => {
    const score = (n: MapNode) => (matchedFiles.has(n.id) ? 4 : 0) + (n.id === selFile ? 4 : 0) + (learning?.[n.id] === "todo" ? 2 : 0) + (learning?.[n.id] ? 1 : 0);
    const sorted = [...m.files].sort((a, b) => score(b) - score(a) || b.inCount - a.inCount || a.path.localeCompare(b.path));
    return { rows: sorted.slice(0, MAX_ROWS), more: Math.max(0, sorted.length - MAX_ROWS) };
  }, [matchedFiles, selFile, learning]);

  const dims = useMemo(() => {
    const d = new Map<string, { w: number; h: number; rows: MapNode[]; more: number }>();
    for (const m of mods) {
      if (!expanded.has(m.id)) { d.set(m.id, { w: W_COLLAPSED, h: H_HEAD, rows: [], more: 0 }); continue; }
      const { rows, more } = rowsOf(m);
      d.set(m.id, { w: W_EXPANDED, h: H_HEAD + PAD * 2 + rows.length * ROW_H + (more ? ROW_H : 0), rows, more });
    }
    return d;
  }, [mods, expanded, rowsOf]);

  // module-to-module dependency edges drive the layout (all types, so toggling a filter never moves the cards)
  const modEdges = useMemo(() => {
    const s = new Set<string>();
    for (const e of data?.edges ?? []) { const a = fileMod.get(e.from), b = fileMod.get(e.to); if (a && b && a !== b) s.add(`${a}|${b}`); }
    return [...s].map((k) => { const [from, to] = k.split("|"); return { from, to }; });
  }, [data, fileMod]);
  const layout = useMemo(() => flowLayout(mods.map((m) => ({ id: m.id, w: dims.get(m.id)!.w, h: dims.get(m.id)!.h })), modEdges, { gapX: 90 }), [mods, dims, modEdges]);

  const box = useCallback((id: string) => {
    const p = layout.placed.get(id);
    if (!p) return null;
    const o = off.get(id);
    return { x: p.x + (o?.dx ?? 0), y: p.y + (o?.dy ?? 0), w: p.w, h: p.h };
  }, [layout, off]);

  const modOut = useMemo(() => { const m = new Map<string, number>(); for (const e of modEdges) m.set(e.from, (m.get(e.from) ?? 0) + 1); return m; }, [modEdges]);
  const modIn = useMemo(() => { const m = new Map<string, number>(); for (const e of modEdges) m.set(e.to, (m.get(e.to) ?? 0) + 1); return m; }, [modEdges]);

  // ---------- connections, drawn between the ports of whatever is visible (a card or one of its file rows) ----------
  const anchorOf = useCallback((fileId: string): Anchor | null => {
    const modId = fileMod.get(fileId);
    if (!modId) return null;
    const b = box(modId);
    if (!b) return null;
    const dm = dims.get(modId)!;
    const i = dm.rows.findIndex((r) => r.id === fileId);
    if (expanded.has(modId) && i >= 0) return { key: `f:${fileId}`, modId, fileId, xl: b.x, xr: b.x + b.w, y: b.y + H_HEAD + PAD + i * ROW_H + ROW_H / 2 };
    return { key: `m:${modId}`, modId, fileId: null, xl: b.x, xr: b.x + b.w, y: b.y + H_HEAD / 2 };
  }, [fileMod, box, dims, expanded]);

  const conns = useMemo(() => {
    const agg = new Map<string, Agg>();
    for (const e of data?.edges ?? []) {
      if (!types.has(e.type)) continue;
      const a = anchorOf(e.from), b = anchorOf(e.to);
      if (!a || !b || a.modId === b.modId) continue; // links inside one module are listed in the panel, not drawn
      const k = `${a.key}>${b.key}`;
      const cur = agg.get(k) ?? { a, b, counts: {}, total: 0, heuristic: 0, files: new Set<string>() };
      cur.counts[e.type] = (cur.counts[e.type] ?? 0) + 1;
      cur.total += 1; cur.heuristic += e.heuristic === e.count ? 1 : 0;
      cur.files.add(e.from); cur.files.add(e.to);
      agg.set(k, cur);
    }
    return [...agg.values()];
  }, [data, types, anchorOf]);

  const counts = useMemo(() => { const c: Record<string, number> = {}; for (const e of data?.edges ?? []) c[e.type] = (c[e.type] ?? 0) + 1; return c; }, [data]);

  // ---------- highlight ----------
  const activeMod = hover ?? selMod;
  const isHot = (c: Agg) => (selFile ? c.files.has(selFile) : activeMod ? c.a.modId === activeMod || c.b.modId === activeMod : false);
  const hasActive = !!(selFile || activeMod);
  const connected = useMemo(() => {
    const s = new Set<string>();
    if (selFile) { const m = fileMod.get(selFile); if (m) s.add(m); }
    else if (activeMod) s.add(activeMod);
    for (const c of conns) if (isHot(c)) { s.add(c.a.modId); s.add(c.b.modId); }
    return s;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conns, selFile, activeMod, fileMod]);

  // ---------- view helpers ----------
  const fit = useCallback((readable = false) => {
    const ids = mods.map((m) => box(m.id)).filter(Boolean) as { x: number; y: number; w: number; h: number }[];
    if (!ids.length) return;
    const minX = Math.min(...ids.map((b) => b.x)), minY = Math.min(...ids.map((b) => b.y));
    const maxX = Math.max(...ids.map((b) => b.x + b.w)), maxY = Math.max(...ids.map((b) => b.y + b.h));
    const fitK = Math.min(size.w / (maxX - minX + 80), size.h / (maxY - minY + 80), 1.2);
    const k = readable ? Math.max(fitK, 0.65) : fitK; // first view is readable; the Fit button shows everything
    setView({ k, x: readable && k > fitK ? 24 - minX * k : size.w / 2 - ((minX + maxX) / 2) * k, y: size.h / 2 - ((minY + maxY) / 2) * k });
  }, [mods, box, size.w, size.h]);

  const firstFit = useRef(false);
  useEffect(() => { if (mods.length && !firstFit.current) { firstFit.current = true; fit(true); } }, [mods, fit]);
  useEffect(() => { firstFit.current = false; }, [repoId, assignmentId]);

  useEffect(() => {
    if (!pendingCenter.current) return;
    const b = box(pendingCenter.current);
    if (!b) return;
    pendingCenter.current = null;
    setView((v) => { const k = Math.max(v.k, 0.9); return { k, x: size.w / 2 - (b.x + b.w / 2) * k, y: size.h / 2 - (b.y + b.h / 2) * k }; });
  }, [layout, box, size.w, size.h]);

  useEffect(() => {
    const keep = keepOnScreen.current;
    if (!keep || pendingCenter.current) return;
    const b = box(keep.id);
    if (!b) return;
    keepOnScreen.current = null;
    setView((v) => ({ ...v, x: keep.sx - b.x * v.k, y: keep.sy - b.y * v.k }));
  }, [layout, box]);

  useEffect(() => {
    const el = svg.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const r = el.getBoundingClientRect();
      const px = e.clientX - r.left, py = e.clientY - r.top;
      setView((v) => { const k = Math.min(3, Math.max(0.12, v.k * Math.exp(-e.deltaY * 0.0015))); return { k, x: px - ((px - v.x) / v.k) * k, y: py - ((py - v.y) / v.k) * k }; });
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [data]);

  // ---------- actions ----------
  // Opening or closing a card keeps THAT card where it is on screen (the others make room around it), so the view does not jump.
  const toggle = (id: string) => {
    const b = box(id);
    if (b) keepOnScreen.current = { id, sx: b.x * view.k + view.x, sy: b.y * view.k + view.y };
    setExpanded((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };
  const openFile = useCallback((fileId: string) => {
    const m = fileMod.get(fileId);
    if (!m) return;
    setExpanded((s) => (s.has(m) ? s : new Set(s).add(m)));
    setSelFile(fileId); setSelMod(m); setCode(null); setSymLinks(null);
    pendingCenter.current = m;
  }, [fileMod]);
  const openMod = useCallback((id: string, center = false) => {
    setSelMod(id); setSelFile(null); setCode(null); setSymLinks(null);
    if (center) pendingCenter.current = id;
  }, []);
  // Candidate view: start at the first lesson of the path ("start here"), its module opened and centred.
  const started = useRef(false);
  useEffect(() => { started.current = false; }, [repoId, assignmentId]);
  useEffect(() => {
    if (started.current || !order || !mods.length) return;
    started.current = true;
    const first = Object.entries(order).sort((a, b) => a[1] - b[1])[0];
    if (first) openFile(first[0]);
  }, [order, mods, openFile]);
  const expandAll = () => setExpanded(new Set(mods.map((m) => m.id)));
  const collapseAll = () => setExpanded(new Set());
  const autoLayout = () => { setOff(new Map()); setTimeout(() => fit(true), 0); };
  const toggleType = (t: string) => setTypes((s) => { const n = new Set(s); n.has(t) ? n.delete(t) : n.add(t); return n; });

  // ---------- pointer ----------
  const onDown = (e: React.PointerEvent) => {
    const t = e.target as Element;
    svg.current?.setPointerCapture(e.pointerId);
    const tog = t.closest("[data-toggle]"), row = t.closest("[data-row]"), card = t.closest("[data-card]");
    if (card) {
      const id = card.getAttribute("data-card")!;
      const o = off.get(id) ?? { dx: 0, dy: 0 };
      drag.current = {
        kind: "card", id, sx: e.clientX, sy: e.clientY, ox: o.dx, oy: o.dy, moved: false,
        hit: tog ? { kind: "toggle", mod: id } : row ? { kind: "row", mod: id, file: row.getAttribute("data-row")! } : { kind: "card", mod: id },
      };
    } else drag.current = { kind: "pan", sx: e.clientX, sy: e.clientY, ox: view.x, oy: view.y, moved: false, hit: { kind: null } };
  };
  const onMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    if (Math.hypot(e.clientX - d.sx, e.clientY - d.sy) > 4) d.moved = true;
    if (!d.moved) return;
    if (d.kind === "pan") setView((v) => ({ ...v, x: d.ox + e.clientX - d.sx, y: d.oy + e.clientY - d.sy }));
    else if (d.id) setOff((m) => new Map(m).set(d.id!, { dx: d.ox + (e.clientX - d.sx) / view.k, dy: d.oy + (e.clientY - d.sy) / view.k }));
  };
  const onUp = (e: React.PointerEvent) => {
    const d = drag.current;
    drag.current = null;
    svg.current?.releasePointerCapture(e.pointerId);
    if (!d || d.moved) return;
    const { hit } = d;
    if (hit.kind === "toggle") toggle(hit.mod!);
    else if (hit.kind === "row") { setSelFile(hit.file!); setSelMod(hit.mod!); setCode(null); setSymLinks(null); }
    else if (hit.kind === "card") {
      const now = Date.now();
      if (lastClick.current && lastClick.current.id === hit.mod && now - lastClick.current.t < 350) { toggle(hit.mod!); lastClick.current = null; }
      else { lastClick.current = { id: hit.mod!, t: now }; openMod(hit.mod!); }
    } else { setSelMod(null); setSelFile(null); }
  };

  // ---------- side panel ----------
  const file = selFile ? fileById.get(selFile) : undefined;
  const mod = selMod ? modById.get(selMod) : undefined;
  const rel = useMemo(() => {
    const r = { imports: [] as string[], importedBy: [] as string[], uses: [] as { id: string; type: string; n: number }[], usedBy: [] as { id: string; type: string; n: number }[] };
    if (!selFile) return r;
    for (const e of data?.edges ?? []) {
      if (!types.has(e.type)) continue;
      if (e.from === selFile) (e.type === "IMPORTS" ? r.imports.push(e.to) : r.uses.push({ id: e.to, type: e.type, n: e.count }));
      if (e.to === selFile) (e.type === "IMPORTS" ? r.importedBy.push(e.from) : r.usedBy.push({ id: e.from, type: e.type, n: e.count }));
    }
    return r;
  }, [data, selFile, types]);
  const modLinks = useMemo(() => {
    if (!selMod || selFile) return { out: [] as [string, number][], inn: [] as [string, number][] };
    const out = new Map<string, number>(), inn = new Map<string, number>();
    for (const e of data?.edges ?? []) {
      if (!types.has(e.type)) continue;
      const a = fileMod.get(e.from), b = fileMod.get(e.to);
      if (!a || !b || a === b) continue;
      if (a === selMod) out.set(b, (out.get(b) ?? 0) + 1);
      if (b === selMod) inn.set(a, (inn.get(a) ?? 0) + 1);
    }
    const sort = (m: Map<string, number>) => [...m].sort((x, y) => y[1] - x[1]);
    return { out: sort(out), inn: sort(inn) };
  }, [data, selMod, selFile, types, fileMod]);

  const openCode = async () => {
    if (!file) return;
    const r = await fetch(`/api/code?${new URLSearchParams({ repoId, path: file.path })}`);
    if (!r.ok) return;
    setCode({ path: file.path, lines: ((await r.json()) as { content: string }).content.split("\n").slice(0, 120) });
  };
  const loadSymbolLinks = async () => {
    if (!file) return;
    const r = await fetch(`/api/graph?${new URLSearchParams({ repoId, level: "symbol", focus: file.id })}`);
    if (!r.ok) return;
    const g = (await r.json()) as GraphData;
    const label = new Map(g.nodes.map((n) => [n.id, n.outside ? `${n.label} (${(n.sub ?? "").split("/").pop()})` : n.label]));
    const lines = g.edges.map((e) => `${label.get(e.from) ?? "?"}  —${e.type.toLowerCase()}→  ${label.get(e.to) ?? "?"}${e.confidence === "NAME_MATCH" ? "  (heuristic)" : ""}`);
    setSymLinks({ id: file.id, lines: lines.length ? lines : g.notes.length ? g.notes : ["No symbol-level links for this file."] });
  };

  // ---------- render ----------
  if (err) return <p className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">Could not load the code map: {err}</p>;
  if (!data) return <div className="grid place-items-center rounded-xl border bg-white text-sm text-slate-500" style={{ height }}>Loading code map…</div>;
  if (!data.nodes.length) return <p className="rounded-xl border bg-white p-4 text-sm text-slate-500">{data.notes[0] ?? "Nothing to show yet."}</p>;

  const firstLesson = (m: Mod) => { if (!order) return 0; const xs = m.files.map((f) => order[f.id]).filter((x): x is number => !!x); return xs.length ? Math.min(...xs) : 0; };
  const nextId = order && learning ? nextToLearn(order, learning) : null;
  const pathFiles = order ? Object.entries(order).sort((a, b) => a[1] - b[1]).map(([id, n]) => ({ id, n })).filter((x) => fileById.has(x.id)) : [];
  const chip = (on: boolean) => `rounded-full border px-2.5 py-1 text-xs transition-colors ${on ? "pill-on" : "bg-white text-slate-600 hover:bg-slate-100"}`;
  const label = (id: string) => fileById.get(id)?.path ?? id;
  const statusColor = (id: string) => (learning?.[id] === "done" ? "#10b981" : learning?.[id] === "todo" ? "#4d82ff" : null);

  return (
    <div>
      {data.notes.map((n) => <p key={n} className="mb-2 rounded border border-amber-200 bg-amber-50 p-2 text-xs text-amber-800">{n}</p>)}

      <div className="mb-2 flex flex-wrap items-center gap-2">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search a file…" aria-label="Search files"
          onKeyDown={(e) => { if (e.key === "Enter" && matchedFiles.size) { const ms = [...matchedMods].slice(0, 6); setExpanded((s) => new Set([...s, ...ms])); openFile([...matchedFiles][0]); } }}
          className="w-52 rounded-full border bg-white px-3 py-1 text-sm outline-none focus:border-indigo-500" />
        {TYPES.filter((t) => counts[t]).map((t) => (
          <button key={t} onClick={() => toggleType(t)} className={chip(types.has(t))} aria-pressed={types.has(t)}>
            <span className="mr-1.5 inline-block h-2 w-2 rounded-full" style={{ background: EDGE[t].color }} />{EDGE[t].label} {counts[t]}
          </button>
        ))}
        {nextId && <button onClick={() => openFile(nextId)} className="rounded-full bg-indigo-600 px-3 py-1 text-xs text-white">Next lesson on the map</button>}
        <button onClick={expandAll} className={chip(false)}>Expand all</button>
        <button onClick={collapseAll} className={chip(false)}>Collapse all</button>
        <button onClick={autoLayout} className={chip(false)}>Auto layout</button>
        <button onClick={() => fit()} className={chip(false)}>Fit</button>
        <span className="ml-auto text-xs text-slate-500">{mods.length} modules · {data.nodes.length} files · {conns.length} connections shown</span>
      </div>
      {learning && (
        <div className="mb-2 flex flex-wrap items-center gap-3 text-xs text-slate-600">
          <span className="font-medium text-slate-800">Your learning:</span>
          <span><span className="mr-1 inline-block h-2.5 w-2.5 rounded-full ring-2 ring-emerald-500" />understood</span>
          <span><span className="mr-1 inline-block h-2.5 w-2.5 rounded-full ring-2 ring-indigo-600" />still to learn</span>
          <span className="text-slate-400">Expand a module to see which of its files are in your path.</span>
        </div>
      )}

      <div className={compact ? "grid gap-3" : "grid gap-3 lg:grid-cols-[1fr_340px]"}>
        <div ref={wrap} className="relative overflow-hidden rounded-xl border bg-white" style={{ height }}>
          <svg ref={svg} width={size.w} height={size.h} className="touch-none select-none" style={{ cursor: drag.current?.kind === "pan" ? "grabbing" : "grab" }}
            role="img" aria-label="Node map of the modules and files of this codebase and how they connect"
            onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}>
            <defs>
              {TYPES.map((t) => (
                <marker key={t} id={`fm-${t}`} viewBox="0 0 10 10" refX="9" refY="5" markerUnits="userSpaceOnUse" markerWidth="10" markerHeight="10" orient="auto">
                  <path d="M0 1L10 5L0 9z" fill={EDGE[t].color} />
                </marker>
              ))}
              <pattern id="fm-dots" width="22" height="22" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r="1" style={{ fill: "var(--app-border, #e3e6ec)" }} /></pattern>
            </defs>
            <rect width={size.w} height={size.h} fill="url(#fm-dots)" pointerEvents="none" />
            <g transform={`translate(${view.x} ${view.y}) scale(${view.k})`}>
              {conns.map((c) => {
                const dom = PRIORITY.find((t) => c.counts[t]) ?? "IMPORTS";
                const hot = isHot(c);
                const x1 = c.a.xr, y1 = c.a.y, x2 = c.b.xl, y2 = c.b.y;
                const mid = connectorPoint(x1, y1, x2, y2);
                const tip = Object.entries(c.counts).map(([t, n]) => `${n} ${EDGE[t].label.toLowerCase()}`).join(", ");
                return (
                  <g key={`${c.a.key}>${c.b.key}`} opacity={hasActive ? (hot ? 1 : 0.07) : 0.55}>
                    <path d={connectorPath(x1, y1, x2 - 2, y2)} fill="none" stroke={EDGE[dom].color} strokeWidth={(hot ? 2.2 : Math.min(1 + Math.log2(c.total) * 0.6, 2.4)) / Math.max(view.k, 0.7)}
                      strokeDasharray={c.heuristic === c.total ? "5 4" : undefined} markerEnd={`url(#fm-${dom})`}>
                      <title>{`${label(c.a.fileId ?? [...c.files][0])?.split("/").slice(0, -1).join("/") || modById.get(c.a.modId)?.name} → ${modById.get(c.b.modId)?.name}: ${tip}`}</title>
                    </path>
                    {hot && c.total > 1 && (
                      <g transform={`translate(${mid.x} ${mid.y})`}>
                        <rect x={-12} y={-9} width={24} height={18} rx={9} style={{ fill: "var(--map-bg)", stroke: EDGE[dom].color }} />
                        <text textAnchor="middle" y={4} fontSize={10} style={{ fill: "var(--map-text)" }}>{c.total}</text>
                      </g>
                    )}
                  </g>
                );
              })}

              {mods.map((m) => {
                const b = box(m.id), dm = dims.get(m.id)!;
                if (!b) return null;
                const open = expanded.has(m.id);
                const matched = needle ? matchedMods.has(m.id) : false;
                const todo = m.files.filter((f) => learning?.[f.id] === "todo").length;
                const inPath = m.files.some((f) => learning?.[f.id]);
                const dim = (hasActive && !connected.has(m.id)) || (needle && !matched) || (learning && !inPath && !hasActive);
                const selected = selMod === m.id && !selFile;
                return (
                  <g key={m.id} data-card={m.id} transform={`translate(${b.x} ${b.y})`} opacity={dim ? 0.4 : 1} className="cursor-pointer"
                    onPointerEnter={() => setHover(m.id)} onPointerLeave={() => setHover(null)}>
                    <rect width={b.w} height={b.h} rx={10} style={{ fill: "var(--map-bg)", stroke: selected || matched ? "#4d82ff" : "var(--app-border-strong, #c8cfdb)" }} strokeWidth={selected || matched ? 2 : 1} />
                    <rect width={5} height={H_HEAD} rx={2.5} x={0} fill={m.color} />
                    {m.parentName && <text x={16} y={17} fontSize={10} style={{ fill: "var(--app-muted, #5b6678)" }}>{trunc(m.parentName, 30)}</text>}
                    <text x={16} y={m.parentName ? 34 : 27} fontSize={14} fontWeight={600} style={{ fill: "var(--map-text)" }}>{trunc(m.name, 24)}</text>
                    <text x={16} y={H_HEAD - 9} fontSize={11} style={{ fill: "var(--app-muted, #5b6678)" }}>
                      {m.files.length} files · {modIn.get(m.id) ?? 0} in · {modOut.get(m.id) ?? 0} out{todo ? ` · ${todo} to learn` : ""}
                    </text>
                    {/* ports: where connections attach */}
                    <circle cx={0} cy={H_HEAD / 2} r={4.5} style={{ fill: "var(--map-bg)", stroke: "var(--app-border-strong, #c8cfdb)" }} strokeWidth={1.5} />
                    <circle cx={b.w} cy={H_HEAD / 2} r={4.5} style={{ fill: "var(--map-bg)", stroke: "var(--app-border-strong, #c8cfdb)" }} strokeWidth={1.5} />
                    {firstLesson(m) > 0 && (
                      <g transform={`translate(${b.w - 50} ${H_HEAD / 2})`}>
                        <circle r={9} style={{ fill: "var(--map-bg)" }} stroke={todo ? "#4d82ff" : "#10b981"} strokeWidth={2} />
                        <text y={3} fontSize={10} fontWeight={600} textAnchor="middle" style={{ fill: "var(--map-text)" }}>{firstLesson(m)}</text>
                        <title>{`Your path first reaches this module at lesson ${firstLesson(m)}`}</title>
                      </g>
                    )}
                    <g data-toggle={m.id} transform={`translate(${b.w - 30} ${H_HEAD / 2 - 11})`}>
                      <rect width={22} height={22} rx={6} fill="transparent" />
                      <path d={open ? "M6 9l5 5 5-5" : "M9 6l5 5-5 5"} fill="none" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" style={{ stroke: "var(--app-muted, #5b6678)" }} />
                      <title>{open ? "Collapse" : "Show files"}</title>
                    </g>
                    {open && (
                      <g>
                        <line x1={10} x2={b.w - 10} y1={H_HEAD} y2={H_HEAD} style={{ stroke: "var(--app-border, #e3e6ec)" }} />
                        {dm.rows.map((f, i) => {
                          const y = H_HEAD + PAD + i * ROW_H, st = statusColor(f.id), isSel = selFile === f.id, isMatch = matchedFiles.has(f.id);
                          return (
                            <g key={f.id} data-row={f.id} transform={`translate(0 ${y})`}>
                              <rect x={6} width={b.w - 12} height={ROW_H - 2} rx={6} style={{ fill: isSel ? "rgba(77,130,255,0.18)" : isMatch ? "rgba(246,196,83,0.18)" : "transparent" }} />
                              {order?.[f.id] ? (
                                <g>
                                  <circle cx={18} cy={ROW_H / 2 - 1} r={8} style={{ fill: "var(--map-bg)" }} stroke={st ?? "#94a3b8"} strokeWidth={2} />
                                  <text x={18} y={ROW_H / 2 + 2} fontSize={9} fontWeight={600} textAnchor="middle" style={{ fill: "var(--map-text)" }}>{order[f.id]}</text>
                                </g>
                              ) : (
                                <circle cx={19} cy={ROW_H / 2 - 1} r={4} fill={st ? "transparent" : m.color} stroke={st ?? "none"} strokeWidth={st ? 2 : 0} opacity={learning && !st ? 0.35 : 1} />
                              )}
                              <text x={30} y={ROW_H / 2 + 3} fontSize={12} style={{ fill: "var(--map-text)", fontFamily: "ui-monospace, Consolas, monospace" }} opacity={learning && !st ? 0.55 : 1}>{trunc(base(f.path), 28)}</text>
                              <text x={b.w - 14} y={ROW_H / 2 + 3} fontSize={10} textAnchor="end" style={{ fill: "var(--app-muted, #5b6678)" }}>{f.inCount ? `←${f.inCount}` : ""}</text>
                              <title>{f.path}</title>
                            </g>
                          );
                        })}
                        {dm.more > 0 && <text x={30} y={H_HEAD + PAD + dm.rows.length * ROW_H + ROW_H / 2 + 3} fontSize={11} style={{ fill: "var(--app-muted, #5b6678)" }}>+ {dm.more} more files (search to find them)</text>}
                      </g>
                    )}
                    <title>{`${m.name}: ${m.files.length} files. Click to select, double-click or use the arrow to show files, drag to move.`}</title>
                  </g>
                );
              })}
            </g>
          </svg>
          <div className="pointer-events-none absolute bottom-2 left-3 text-[11px] text-slate-400">Drag cards to move · drag the background to pan · scroll to zoom · arrow or double-click a card to show its files</div>
        </div>

        <aside className="overflow-auto rounded-xl border bg-white p-3 text-sm" style={{ maxHeight: compact ? 380 : height }}>
          {!mod && (
            <div>
              <p className="text-slate-500">Each card is a module (a folder or a group of closely linked files). Lines show what depends on what, left to right. Click a card for its dependencies, open it to see its files, click a file for its code.</p>
              {pathFiles.length > 0 && (
                <div className="mt-3">
                  <p className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-500">Your path, in reading order</p>
                  <ol className="space-y-0.5">
                    {pathFiles.slice(0, 14).map(({ id, n }) => (
                      <li key={id}><button onClick={() => openFile(id)} className="flex w-full items-center gap-2 rounded px-1 py-0.5 text-left text-xs hover:bg-slate-100">
                        <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full border-2 text-[10px] font-semibold" style={{ borderColor: statusColor(id) ?? "#94a3b8" }}>{n}</span>
                        <span className="break-all">{label(id)}</span>
                      </button></li>
                    ))}
                  </ol>
                </div>
              )}
            </div>
          )}

          {mod && !file && (
            <div>
              <p className="text-xs text-slate-500">{mod.parentName ? `${mod.parentName} › ` : ""}module</p>
              <p className="mb-1 text-base font-semibold">{mod.name}</p>
              <p className="mb-2 text-xs text-slate-500">{mod.files.length} files{learning ? ` · ${mod.files.filter((f) => learning[f.id] === "done").length} understood, ${mod.files.filter((f) => learning[f.id] === "todo").length} to learn` : ""}</p>
              <button onClick={() => toggle(mod.id)} className="mb-3 rounded-full bg-indigo-600 px-3 py-1 text-xs text-white">{expanded.has(mod.id) ? "Hide files" : "Show files"}</button>
              {([["Depends on", modLinks.out], ["Used by", modLinks.inn]] as [string, [string, number][]][]).map(([title, list]) => list.length ? (
                <div key={title} className="mb-3">
                  <p className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-500">{title} ({list.length})</p>
                  <ul>{list.map(([id, n]) => (
                    <li key={id}><button onClick={() => openMod(id, true)} className="flex w-full items-center justify-between rounded px-1 py-0.5 text-left text-xs hover:bg-slate-100"><span>{modById.get(id)?.name}</span><span className="text-slate-400">{n}</span></button></li>
                  ))}</ul>
                </div>
              ) : null)}
              <p className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-500">Most imported files</p>
              <ul>{[...mod.files].sort((a, b) => b.inCount - a.inCount).slice(0, 10).map((f) => (
                <li key={f.id}><button onClick={() => openFile(f.id)} className="block w-full break-all rounded px-1 py-0.5 text-left text-xs hover:bg-slate-100">{f.path}</button></li>
              ))}</ul>
            </div>
          )}

          {file && (
            <div>
              <p className="break-all font-semibold">{file.path}</p>
              <p className="mb-2 text-xs text-slate-500"><button className="underline" onClick={() => openMod(file.moduleId, true)}>{modById.get(file.moduleId)?.name}</button> · {file.lineCount} lines · imported by {file.inCount}</p>
              {learning && <p className={`mb-2 inline-block rounded-full px-2 py-0.5 text-xs ${learning[file.id] === "done" ? "bg-emerald-50 text-emerald-700" : learning[file.id] === "todo" ? "bg-indigo-50 text-indigo-700" : "bg-slate-100 text-slate-500"}`}>
                {learning[file.id] === "done" ? "You have completed this" : learning[file.id] === "todo" ? "In your path: still to learn" : "Not in your path"}</p>}
              {file.summary && <p className="mb-2 text-slate-700">{file.summary}</p>}
              <div className="mb-3 flex gap-2">
                <button onClick={openCode} className="rounded-full bg-indigo-600 px-3 py-1 text-xs text-white">View code</button>
                <button onClick={loadSymbolLinks} className="rounded-full border px-3 py-1 text-xs hover:bg-slate-100">Function-level links</button>
              </div>
              {([["Imports", rel.imports.map((id) => ({ id, type: "IMPORTS", n: 1 }))], ["Imported by", rel.importedBy.map((id) => ({ id, type: "IMPORTS", n: 1 }))], ["Uses / calls", rel.uses], ["Used / called by", rel.usedBy]] as [string, { id: string; type: string; n: number }[]][]).map(([title, list]) => list.length ? (
                <div key={title} className="mb-3">
                  <p className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-500">{title} ({list.length})</p>
                  <ul className="space-y-0.5">{list.map((x, i) => (
                    <li key={x.id + x.type + i}><button onClick={() => openFile(x.id)} className="flex w-full items-start gap-1.5 rounded px-1 py-0.5 text-left text-xs hover:bg-slate-100">
                      <span className="mt-1 inline-block h-2 w-2 shrink-0 rounded-full" style={{ background: EDGE[x.type].color }} /><span className="break-all">{label(x.id)}{x.n > 1 ? ` ×${x.n}` : ""}</span>
                    </button></li>
                  ))}</ul>
                </div>
              ) : null)}
              {!rel.imports.length && !rel.importedBy.length && !rel.uses.length && !rel.usedBy.length && <p className="text-xs text-slate-500">No connections with the current filters.</p>}
              {symLinks?.id === file.id && <pre className="mb-3 max-h-48 overflow-auto whitespace-pre-wrap rounded bg-slate-50 p-2 text-[11px] leading-4">{symLinks.lines.join("\n")}</pre>}
              {code?.path === file.path && <pre className="max-h-80 overflow-auto rounded bg-slate-900 p-2 text-[11px] leading-4 text-slate-100">{code.lines.map((l, i) => `${String(i + 1).padStart(4)}  ${l}`).join("\n")}</pre>}
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
