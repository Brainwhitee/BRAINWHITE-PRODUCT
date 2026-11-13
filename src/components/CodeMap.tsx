"use client";
// Interactive code map: every file of a repo as a node, every import / call / reference / extends link as an edge.
// Pan (drag background), zoom (wheel), drag nodes, hover or click to highlight a node's connections, filter by
// connection type or module, search, jump through neighbours in the side panel, export as Mermaid.
// With `assignmentId` (candidate view) files are tinted by learning status: done / still to learn / not in my path.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { GraphData, MapData, MapNode } from "@/lib/graph";
import { bounds, groupCentres, initNodes, settle, tick, toMermaid, type FNode } from "@/lib/forcelayout";

const EDGE_STYLE: Record<string, { color: string; label: string; hint: string }> = {
  IMPORTS: { color: "#64748b", label: "Imports", hint: "file imports file" },
  CALLS: { color: "#ea580c", label: "Calls", hint: "a function here calls a function there" },
  REFERENCES: { color: "#9333ea", label: "References", hint: "uses a symbol (e.g. a component or constant)" },
  EXTENDS: { color: "#0d9488", label: "Extends", hint: "class inheritance" },
  IMPLEMENTS: { color: "#0891b2", label: "Implements", hint: "interface implementation" },
};
const TYPES = Object.keys(EDGE_STYLE);
const modColor = (i: number) => (i < 0 ? "#94a3b8" : `hsl(${(i * 137.5) % 360} 60% 50%)`);
const radius = (n: MapNode) => Math.min(18, 5 + Math.sqrt(n.inCount + n.outCount) * 2);

type Drag = { kind: "pan" | "node"; id?: string; sx: number; sy: number; ox: number; oy: number; moved: boolean };

export function CodeMap({ repoId, assignmentId, height = 620, compact = false }: { repoId: string; assignmentId?: string; height?: number; compact?: boolean }) {
  const [data, setData] = useState<MapData | null>(null);
  const [err, setErr] = useState("");
  const sim = useRef<FNode[]>([]);
  const alpha = useRef(0);
  const [, setFrame] = useState(0);
  const [view, setView] = useState({ x: 0, y: 0, k: 1 });
  const [size, setSize] = useState({ w: 900, h: height });
  const wrap = useRef<HTMLDivElement>(null);
  const svg = useRef<SVGSVGElement>(null);
  const drag = useRef<Drag | null>(null);

  const [types, setTypes] = useState<Set<string>>(new Set(TYPES));
  const [sel, setSel] = useState<string | null>(null);
  const [hover, setHover] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [mod, setMod] = useState<string | null>(null);
  const [labels, setLabels] = useState(false);
  const [mermaid, setMermaid] = useState(false);
  const [copied, setCopied] = useState(false);
  const [code, setCode] = useState<{ path: string; lines: string[] } | null>(null);
  const [symLinks, setSymLinks] = useState<{ id: string; lines: string[] } | null>(null);

  // ---------- load ----------
  useEffect(() => {
    let live = true;
    setData(null); setErr(""); setSel(null);
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

  const nodeById = useMemo(() => new Map((data?.nodes ?? []).map((n) => [n.id, n])), [data]);
  const modIndex = useMemo(() => new Map((data?.modules ?? []).map((m, i) => [m.id, i])), [data]);
  const modName = useMemo(() => new Map((data?.modules ?? []).map((m) => [m.id, m.name])), [data]);
  const simEdges = useMemo(() => (data?.edges ?? []).map((e) => ({ from: e.from, to: e.to })), [data]);
  // bigger graphs need more room: stronger repulsion, longer springs, weaker module pull (avoids a central hairball)
  const forceOpt = useMemo(() => { const n = data?.nodes.length ?? 0; return { repulsion: 1800 * (1 + n / 250), springLen: 70 + Math.min(70, n / 3), groupPull: n > 120 ? 0.018 : 0.03 }; }, [data]);

  const fit = useCallback((nodes?: { x: number; y: number; r: number }[]) => {
    // fit the core of the graph: ignore stray outliers (beyond 1.6x the 90th-percentile distance from the median centre)
    const pts = nodes ?? sim.current;
    const med = (v: number[]) => [...v].sort((x, y) => x - y)[Math.floor(v.length / 2)] ?? 0;
    const cx = med(pts.map((p) => p.x)), cy = med(pts.map((p) => p.y));
    const ds = pts.map((p) => Math.hypot(p.x - cx, p.y - cy)).sort((x, y) => x - y);
    const lim = (ds[Math.floor(ds.length * 0.9)] ?? 0) * 1.6 + 40;
    const core = pts.filter((p) => Math.hypot(p.x - cx, p.y - cy) <= lim);
    const b = bounds(core.length ? core : pts);
    const bw = Math.max(1, b.maxX - b.minX), bh = Math.max(1, b.maxY - b.minY);
    const k = Math.min(size.w / (bw + 80), size.h / (bh + 80), 2.2);
    setView({ k, x: size.w / 2 - ((b.minX + b.maxX) / 2) * k, y: size.h / 2 - ((b.minY + b.maxY) / 2) * k });
  }, [size.w, size.h]);

  const layout = useCallback(() => {
    if (!data) return;
    sim.current = initNodes(data.nodes.map((n) => ({ id: n.id, group: n.moduleId, r: radius(n) })));
    settle(sim.current, simEdges, 320, forceOpt);
    alpha.current = 0;
    fit();
    setFrame((f) => f + 1);
  }, [data, simEdges, fit, forceOpt]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { layout(); }, [data]);

  // animation loop: only runs while the simulation is warm (after a node drag or reset)
  useEffect(() => {
    let raf = 0;
    const loop = () => {
      if (alpha.current > 0.03) {
        tick(sim.current, simEdges, alpha.current, forceOpt);
        alpha.current *= 0.97;
        setFrame((f) => f + 1);
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [simEdges, forceOpt]);

  // wheel zoom around the pointer (needs a non-passive listener to stop the page scrolling)
  useEffect(() => {
    const el = svg.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const r = el.getBoundingClientRect();
      const px = e.clientX - r.left, py = e.clientY - r.top;
      setView((v) => {
        const k = Math.min(6, Math.max(0.15, v.k * Math.exp(-e.deltaY * 0.0015)));
        return { k, x: px - ((px - v.x) / v.k) * k, y: py - ((py - v.y) / v.k) * k };
      });
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [data]);

  // ---------- derived ----------
  const pos = useMemo(() => new Map(sim.current.map((n) => [n.id, n])), [data, sim.current.length]); // eslint-disable-line react-hooks/exhaustive-deps
  const edges = useMemo(() => (data?.edges ?? []).filter((e) => types.has(e.type)), [data, types]);
  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const e of data?.edges ?? []) c[e.type] = (c[e.type] ?? 0) + 1;
    return c;
  }, [data]);

  const active = hover ?? sel;
  const neighbours = useMemo(() => {
    const s = new Set<string>();
    if (!active) return s;
    s.add(active);
    for (const e of edges) { if (e.from === active) s.add(e.to); if (e.to === active) s.add(e.from); }
    return s;
  }, [active, edges]);

  const needle = q.trim().toLowerCase();
  const focusSet = useMemo(() => {
    if (active) return neighbours;
    if (mod) return new Set((data?.nodes ?? []).filter((n) => n.moduleId === mod).map((n) => n.id));
    if (needle) return new Set((data?.nodes ?? []).filter((n) => n.path.toLowerCase().includes(needle)).map((n) => n.id));
    return null;
  }, [active, neighbours, mod, needle, data]);

  const learning = data?.learning;
  const learnCounts = useMemo(() => {
    const v = Object.values(learning ?? {});
    return { done: v.filter((x) => x === "done").length, todo: v.filter((x) => x === "todo").length };
  }, [learning]);

  const select = useCallback((id: string, centre = false) => {
    setSel(id); setCode(null); setSymLinks(null);
    if (centre) {
      const n = sim.current.find((x) => x.id === id);
      if (n) setView((v) => { const k = Math.max(v.k, 1.4); return { k, x: size.w / 2 - n.x * k, y: size.h / 2 - n.y * k }; });
    }
  }, [size.w, size.h]);

  // ---------- pointer ----------
  const toWorld = (cx: number, cy: number) => {
    const r = svg.current!.getBoundingClientRect();
    return { x: (cx - r.left - view.x) / view.k, y: (cy - r.top - view.y) / view.k };
  };
  const onDown = (e: React.PointerEvent) => {
    const el = (e.target as Element).closest("[data-node]");
    svg.current?.setPointerCapture(e.pointerId);
    if (el) {
      const id = el.getAttribute("data-node")!;
      const n = sim.current.find((x) => x.id === id);
      if (n) n.fixed = true;
      drag.current = { kind: "node", id, sx: e.clientX, sy: e.clientY, ox: 0, oy: 0, moved: false };
    } else drag.current = { kind: "pan", sx: e.clientX, sy: e.clientY, ox: view.x, oy: view.y, moved: false };
  };
  const onMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    if (Math.hypot(e.clientX - d.sx, e.clientY - d.sy) > 3) d.moved = true;
    if (d.kind === "pan") setView((v) => ({ ...v, x: d.ox + e.clientX - d.sx, y: d.oy + e.clientY - d.sy }));
    else if (d.moved) {
      const n = sim.current.find((x) => x.id === d.id);
      if (n) { const w = toWorld(e.clientX, e.clientY); n.x = w.x; n.y = w.y; alpha.current = Math.max(alpha.current, 0.25); setFrame((f) => f + 1); }
    }
  };
  const onUp = (e: React.PointerEvent) => {
    const d = drag.current;
    drag.current = null;
    svg.current?.releasePointerCapture(e.pointerId);
    if (!d) return;
    if (d.kind === "node") {
      const n = sim.current.find((x) => x.id === d.id);
      if (n) n.fixed = false;
      if (!d.moved && d.id) select(d.id);
    } else if (!d.moved) setSel(null);
  };

  // ---------- panel data ----------
  const selNode = sel ? nodeById.get(sel) : undefined;
  const rel = useMemo(() => {
    const out = { imports: [] as string[], importedBy: [] as string[], uses: [] as { id: string; type: string; n: number }[], usedBy: [] as { id: string; type: string; n: number }[] };
    if (!sel) return out;
    for (const e of edges) {
      if (e.from === sel) (e.type === "IMPORTS" ? out.imports.push(e.to) : out.uses.push({ id: e.to, type: e.type, n: e.count }));
      if (e.to === sel) (e.type === "IMPORTS" ? out.importedBy.push(e.from) : out.usedBy.push({ id: e.from, type: e.type, n: e.count }));
    }
    return out;
  }, [sel, edges]);

  const openCode = async () => {
    if (!selNode) return;
    const r = await fetch(`/api/code?${new URLSearchParams({ repoId, path: selNode.path })}`);
    if (!r.ok) return;
    const f = (await r.json()) as { content: string };
    setCode({ path: selNode.path, lines: f.content.split("\n").slice(0, 120) });
  };
  const loadSymbolLinks = async () => {
    if (!selNode) return;
    const r = await fetch(`/api/graph?${new URLSearchParams({ repoId, level: "symbol", focus: selNode.id })}`);
    if (!r.ok) return;
    const g = (await r.json()) as GraphData;
    const label = new Map(g.nodes.map((n) => [n.id, n.outside ? `${n.label} (${(n.sub ?? "").split("/").pop()})` : n.label]));
    const lines = g.edges.map((e) => `${label.get(e.from) ?? "?"}  —${e.type.toLowerCase()}→  ${label.get(e.to) ?? "?"}${e.confidence === "NAME_MATCH" ? "  (heuristic)" : ""}`);
    setSymLinks({ id: selNode.id, lines: lines.length ? lines : g.notes.length ? g.notes : ["No symbol-level links for this file."] });
  };

  const mermaidText = useMemo(() => {
    if (!data || !mermaid) return "";
    const ids = focusSet ?? new Set(edges.flatMap((e) => [e.from, e.to]));
    const ns = data.nodes.filter((n) => ids.has(n.id)).map((n) => ({ id: n.id, label: n.path, group: n.moduleId }));
    const es = edges.filter((e) => ids.has(e.from) && ids.has(e.to));
    return toMermaid(ns, es, (g) => modName.get(g) ?? g);
  }, [data, mermaid, focusSet, edges, modName]);

  // ---------- render ----------
  if (err) return <p className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">Could not load the code map: {err}</p>;
  if (!data) return <div className="grid place-items-center rounded-xl border bg-white text-sm text-slate-500" style={{ height }}>Loading code map…</div>;
  if (!data.nodes.length) return <p className="rounded-xl border bg-white p-4 text-sm text-slate-500">{data.notes[0] ?? "Nothing to show yet."}</p>;

  const centres = groupCentres(sim.current);
  // halo = circle around the core of a module (85th percentile distance), so a few stray files do not blow it up
  const halo = [...centres].filter(([, c]) => c.n >= 3).map(([g, c]) => {
    const d = sim.current.filter((n) => n.group === g).map((n) => Math.hypot(n.x - c.x, n.y - c.y) + n.r).sort((a, b) => a - b);
    return { g, x: c.x, y: c.y, r: d[Math.min(d.length - 1, Math.floor(d.length * 0.85))] + 16 };
  });
  const dimNode = (id: string) => (focusSet ? !focusSet.has(id) : learning ? !learning[id] : false);
  const toggleType = (t: string) => setTypes((s) => { const n = new Set(s); n.has(t) ? n.delete(t) : n.add(t); return n; });
  const nodeLabel = (id: string) => nodeById.get(id)?.path ?? id;
  const showLabel = (n: MapNode) => labels || n.id === active || (!!active && neighbours.has(n.id)) || (!!needle && n.path.toLowerCase().includes(needle)) || (view.k > 1.6 && (!focusSet || focusSet.has(n.id)));

  const chip = (on: boolean) => `rounded-full border px-2.5 py-1 text-xs transition-colors ${on ? "pill-on" : "bg-white text-slate-600 hover:bg-slate-100"}`;

  return (
    <div>
      {data.notes.map((n) => <p key={n} className="mb-2 rounded border border-amber-200 bg-amber-50 p-2 text-xs text-amber-800">{n}</p>)}

      <div className="mb-2 flex flex-wrap items-center gap-2">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search a file…" aria-label="Search files"
          onKeyDown={(e) => { if (e.key === "Enter" && needle) { const f = data.nodes.find((n) => n.path.toLowerCase().includes(needle)); if (f) select(f.id, true); } }}
          className="w-52 rounded-full border bg-white px-3 py-1 text-sm outline-none focus:border-indigo-500" />
        {TYPES.filter((t) => counts[t]).map((t) => (
          <button key={t} onClick={() => toggleType(t)} className={chip(types.has(t))} title={EDGE_STYLE[t].hint} aria-pressed={types.has(t)}>
            <span className="mr-1.5 inline-block h-2 w-2 rounded-full" style={{ background: EDGE_STYLE[t].color }} />
            {EDGE_STYLE[t].label} {counts[t]}
          </button>
        ))}
        <button onClick={() => setLabels((v) => !v)} className={chip(labels)} aria-pressed={labels}>All labels</button>
        <button onClick={() => fit()} className={chip(false)}>Fit</button>
        <button onClick={() => { layout(); alpha.current = 0.6; }} className={chip(false)}>Re-layout</button>
        <button onClick={() => setMermaid(true)} className={chip(false)}>Mermaid</button>
        <span className="ml-auto text-xs text-slate-500">{data.nodes.length} files · {edges.length} connections</span>
      </div>

      {learning && (
        <div className="mb-2 flex flex-wrap items-center gap-3 text-xs text-slate-600">
          <span className="font-medium text-slate-800">Your learning on this map:</span>
          <span><span className="mr-1 inline-block h-2.5 w-2.5 rounded-full ring-2 ring-emerald-500" />{learnCounts.done} files understood</span>
          <span><span className="mr-1 inline-block h-2.5 w-2.5 rounded-full ring-2 ring-indigo-600" />{learnCounts.todo} still to learn</span>
          <span className="text-slate-400">faded = not in your path</span>
        </div>
      )}

      <div className={compact ? "grid gap-3" : "grid gap-3 lg:grid-cols-[1fr_340px]"}>
        <div ref={wrap} className="relative overflow-hidden rounded-xl border bg-white" style={{ height }}>
          <svg ref={svg} width={size.w} height={size.h} className="touch-none select-none" style={{ cursor: drag.current?.kind === "pan" ? "grabbing" : "grab" }}
            role="img" aria-label="Interactive map of how the files in this codebase connect"
            onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}>
            <defs>
              {TYPES.map((t) => (
                <marker key={t} id={`arr-${t}`} viewBox="0 0 10 10" refX="9" refY="5" markerUnits="userSpaceOnUse" markerWidth="9" markerHeight="9" orient="auto-start-reverse">
                  <path d="M0 0L10 5L0 10z" fill={EDGE_STYLE[t].color} />
                </marker>
              ))}
            </defs>
            <g transform={`translate(${view.x} ${view.y}) scale(${view.k})`}>
              {halo.map((h) => {
                const i = modIndex.get(h.g) ?? -1;
                const dim = mod ? mod !== h.g : false;
                return (
                  <g key={h.g} opacity={dim ? 0.25 : 1}>
                    <circle cx={h.x} cy={h.y} r={h.r} fill={modColor(i)} fillOpacity={0.06} stroke={modColor(i)} strokeOpacity={0.35} strokeDasharray="5 5" />
                    <text x={h.x} y={h.y - h.r - 6} textAnchor="middle" fontSize={12 / Math.max(view.k, 0.6)} fontWeight={600} fill={modColor(i)} className="cursor-pointer"
                      onClick={() => setMod((m) => (m === h.g ? null : h.g))}>{modName.get(h.g) ?? "other"}</text>
                  </g>
                );
              })}

              {edges.map((e, i) => {
                const a = pos.get(e.from), b = pos.get(e.to);
                if (!a || !b) return null;
                const hot = !!active && (e.from === active || e.to === active);
                const faded = focusSet ? !(focusSet.has(e.from) && focusSet.has(e.to)) || (!!active && !hot) : !!learning;
                const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 1;
                const x1 = a.x + (dx / d) * a.r, y1 = a.y + (dy / d) * a.r, x2 = b.x - (dx / d) * (b.r + 3), y2 = b.y - (dy / d) * (b.r + 3);
                const st = EDGE_STYLE[e.type];
                return (
                  <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={st.color} strokeWidth={(hot ? 2.2 : Math.min(1 + Math.log2(e.count), 3)) / Math.max(view.k, 0.7)}
                    strokeOpacity={hot ? 0.95 : faded ? (learning && !focusSet ? 0.14 : 0.06) : edges.length > 300 ? 0.3 : 0.45} strokeDasharray={e.heuristic === e.count ? "4 3" : undefined} markerEnd={`url(#arr-${e.type})`}>
                    <title>{`${nodeLabel(e.from)} ${st.label.toLowerCase()} ${nodeLabel(e.to)}${e.count > 1 ? ` (×${e.count})` : ""}${e.heuristic ? " · heuristic match" : ""}`}</title>
                  </line>
                );
              })}

              {data.nodes.map((n) => {
                const p = pos.get(n.id);
                if (!p) return null;
                const st = learning?.[n.id];
                const dim = dimNode(n.id);
                const i = modIndex.get(n.moduleId) ?? -1;
                return (
                  <g key={n.id} data-node={n.id} opacity={dim ? (learning && !focusSet ? 0.38 : 0.18) : 1} className="cursor-pointer"
                    onPointerEnter={() => setHover(n.id)} onPointerLeave={() => setHover(null)}>
                    {n.id === sel && <circle cx={p.x} cy={p.y} r={p.r + 6} fill="none" style={{ stroke: "var(--map-text)" }} strokeWidth={2 / Math.max(view.k, 0.7)} />}
                    <circle cx={p.x} cy={p.y} r={p.r} fill={modColor(i)} stroke={st === "done" ? "#10b981" : st === "todo" ? "#4d82ff" : "var(--map-bg)"} strokeWidth={(st ? 3.5 : 1.5) / Math.max(view.k, 0.7)} />
                    {showLabel(n) && (
                      <text x={p.x} y={p.y + p.r + 11 / Math.max(view.k, 0.8)} textAnchor="middle" fontSize={11 / Math.max(view.k, 0.8)} style={{ fill: "var(--map-text)", stroke: "var(--map-bg)" }} strokeWidth={3 / Math.max(view.k, 0.8)} paintOrder="stroke">{n.label}</text>
                    )}
                    <title>{`${n.path}\n${n.lineCount} lines · imported by ${n.inCount} · links out ${n.outCount}\nClick to open details, drag to move`}</title>
                  </g>
                );
              })}
            </g>
          </svg>
          <div className="pointer-events-none absolute bottom-2 left-3 text-[11px] text-slate-400">Drag to pan · scroll to zoom · drag a dot to move it · click a dot for details · click a module name to focus</div>
        </div>

        <aside className="max-h-[70vh] overflow-auto rounded-xl border bg-white p-3 text-sm" style={{ maxHeight: compact ? 360 : height }}>
          <div className="mb-3 flex flex-wrap gap-1">
            <button onClick={() => setMod(null)} className={chip(!mod)}>All modules</button>
            {data.modules.map((m, i) => (
              <button key={m.id} onClick={() => setMod((x) => (x === m.id ? null : m.id))} className={chip(mod === m.id)} title={`${m.files} files`}>
                <span className="mr-1.5 inline-block h-2 w-2 rounded-full" style={{ background: modColor(i) }} />{m.parentName ? `${m.parentName} › ` : ""}{m.name}
              </button>
            ))}
          </div>

          {!selNode && <p className="text-slate-500">Click any dot to see what the file does, what it imports, who uses it, and its code. Hover a dot to light up its connections.</p>}
          {selNode && (
            <div>
              <p className="break-all font-semibold">{selNode.path}</p>
              <p className="mb-2 text-xs text-slate-500">{modName.get(selNode.moduleId) ?? "other"} · {selNode.lineCount} lines · imported by {selNode.inCount}</p>
              {learning && <p className={`mb-2 inline-block rounded-full px-2 py-0.5 text-xs ${learning[selNode.id] === "done" ? "bg-emerald-50 text-emerald-700" : learning[selNode.id] === "todo" ? "bg-indigo-50 text-indigo-700" : "bg-slate-100 text-slate-500"}`}>
                {learning[selNode.id] === "done" ? "You have completed this" : learning[selNode.id] === "todo" ? "In your path: still to learn" : "Not in your path"}</p>}
              {selNode.summary && <p className="mb-2 text-slate-700">{selNode.summary}</p>}
              <div className="mb-3 flex gap-2">
                <button onClick={openCode} className="rounded-full bg-indigo-600 px-3 py-1 text-xs text-white">View code</button>
                <button onClick={loadSymbolLinks} className="rounded-full border px-3 py-1 text-xs hover:bg-slate-100">Function-level links</button>
              </div>

              {([["Imports", rel.imports.map((id) => ({ id, type: "IMPORTS", n: 1 }))], ["Imported by", rel.importedBy.map((id) => ({ id, type: "IMPORTS", n: 1 }))], ["Uses / calls", rel.uses], ["Used / called by", rel.usedBy]] as [string, { id: string; type: string; n: number }[]][]).map(([title, list]) =>
                list.length ? (
                  <div key={title} className="mb-3">
                    <p className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-500">{title} ({list.length})</p>
                    <ul className="space-y-0.5">
                      {list.map((x, i) => (
                        <li key={x.id + x.type + i}>
                          <button onClick={() => select(x.id, true)} className="flex w-full items-start gap-1.5 rounded px-1 py-0.5 text-left text-xs hover:bg-slate-100">
                            <span className="mt-1 inline-block h-2 w-2 shrink-0 rounded-full" style={{ background: EDGE_STYLE[x.type].color }} />
                            <span className="break-all">{nodeLabel(x.id)}{x.n > 1 ? ` ×${x.n}` : ""}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null,
              )}
              {!rel.imports.length && !rel.importedBy.length && !rel.uses.length && !rel.usedBy.length && <p className="text-xs text-slate-500">No connections with the current filters.</p>}

              {symLinks?.id === selNode.id && (
                <div className="mb-3"><p className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-500">Function-level links</p>
                  <pre className="max-h-48 overflow-auto whitespace-pre-wrap rounded bg-slate-50 p-2 text-[11px] leading-4">{symLinks.lines.join("\n")}</pre></div>
              )}
              {code?.path === selNode.path && (
                <pre className="max-h-80 overflow-auto rounded bg-slate-900 p-2 text-[11px] leading-4 text-slate-100">{code.lines.map((l, i) => `${String(i + 1).padStart(4)}  ${l}`).join("\n")}</pre>
              )}
            </div>
          )}
        </aside>
      </div>

      {mermaid && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" role="dialog" aria-modal="true" aria-label="Mermaid export" onClick={() => setMermaid(false)}>
          <div className="flex max-h-[85vh] w-full max-w-3xl flex-col rounded-xl bg-white p-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-2 flex items-center justify-between">
              <h3 className="font-semibold">Mermaid diagram of what you see now</h3>
              <button onClick={() => setMermaid(false)} className="rounded-full border px-3 py-1 text-sm hover:bg-slate-100">Close</button>
            </div>
            <p className="mb-2 text-xs text-slate-500">Respects your filters (connection types, module focus, search). Paste into mermaid.live or a Markdown file. Dotted arrows = references, thick arrows = calls.
              {mermaidText.split("\n").length > 300 && " This is large: focus a module first for a readable diagram."}</p>
            <textarea readOnly value={mermaidText} className="min-h-64 flex-1 rounded border bg-slate-50 p-2 font-mono text-xs" />
            <div className="mt-2 flex gap-2">
              <button onClick={async () => { try { await navigator.clipboard.writeText(mermaidText); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch { /* clipboard blocked: user can select the text */ } }}
                className="rounded-full bg-indigo-600 px-4 py-1.5 text-sm text-white">{copied ? "Copied" : "Copy"}</button>
              <a href="https://mermaid.live" target="_blank" rel="noreferrer" className="rounded-full border px-4 py-1.5 text-sm hover:bg-slate-100">Open mermaid.live</a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
