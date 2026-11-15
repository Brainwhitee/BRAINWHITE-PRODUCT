"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { layoutGraph, NODE_H, NODE_W, type GraphData, type GraphLevel, type Positioned } from "@/lib/graph";

type Crumb = { level: GraphLevel; focus: string | null; title: string };
const KIND_COLOR: Record<string, string> = { module: "#4f46e5", file: "#0f766e", symbol: "#b45309" };

export function GraphExplorer({ repoId }: { repoId: string }) {
  const [trail, setTrail] = useState<Crumb[]>([{ level: "module", focus: null, title: "Modules" }]);
  const [data, setData] = useState<GraphData | null>(null);
  const [err, setErr] = useState("");
  const [sel, setSel] = useState<Positioned | null>(null);
  const [code, setCode] = useState<{ lines: string[]; from: number } | null>(null);
  const cur = trail[trail.length - 1];

  useEffect(() => {
    let live = true;
    setData(null); setErr(""); setSel(null); setCode(null);
    const q = new URLSearchParams({ repoId, level: cur.level, ...(cur.focus ? { focus: cur.focus } : {}) });
    fetch(`/api/graph?${q}`)
      .then(async (r) => (r.ok ? r.json() : Promise.reject(new Error((await r.json().catch(() => ({}))).error ?? r.statusText))))
      .then((d: GraphData) => live && setData(d))
      .catch((e: Error) => live && setErr(e.message));
    return () => { live = false; };
  }, [repoId, cur.level, cur.focus]);

  const layout = useMemo(() => (data ? layoutGraph(data.nodes, data.edges) : null), [data]);
  const pos = useMemo(() => new Map(layout?.nodes.map((n) => [n.id, n]) ?? []), [layout]);

  const drill = useCallback((n: Positioned) => {
    if (!n.drill) return;
    setTrail((t) => [...t, { level: n.drill!.level, focus: n.drill!.focus, title: n.label }]);
  }, []);

  const select = useCallback(async (n: Positioned) => {
    setSel(n); setCode(null);
    if (!n.filePath) return;
    const r = await fetch(`/api/code?${new URLSearchParams({ repoId, path: n.filePath })}`);
    if (!r.ok) return;
    const f = (await r.json()) as { content: string };
    const all = f.content.split("\n");
    const from = Math.max(1, (n.startLine ?? 1) - 1);
    const to = n.endLine ? Math.min(all.length, n.endLine + 1) : Math.min(all.length, from + 40);
    setCode({ lines: all.slice(from - 1, Math.min(to, from + 80)), from });
  }, [repoId]);

  return (
    <div>
      <nav className="mb-3 flex flex-wrap items-center gap-1 text-sm" aria-label="Graph path">
        {trail.map((c, i) => (
          <span key={i} className="flex items-center gap-1">
            {i > 0 && <span className="text-slate-400">/</span>}
            <button disabled={i === trail.length - 1} onClick={() => setTrail(trail.slice(0, i + 1))} className="rounded px-1.5 py-0.5 text-indigo-700 hover:bg-indigo-50 disabled:font-semibold disabled:text-slate-900 disabled:hover:bg-transparent">
              {c.title}
            </button>
          </span>
        ))}
      </nav>
      {err && <p className="text-sm text-slate-950">Could not load graph: {err}</p>}
      {!data && !err && <p className="text-sm text-slate-500">Loading…</p>}
      {data?.notes.map((n) => <p key={n} className="mb-2 text-sm text-slate-500">{n}</p>)}
      {data && layout && layout.nodes.length === 0 && <p className="text-sm text-slate-500">Nothing to show at this level.</p>}
      {data && layout && layout.nodes.length > 0 && (
        <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
          <div className="overflow-auto rounded-lg border bg-white p-3" style={{ maxHeight: "70vh" }}>
            <svg width={layout.width + 20} height={layout.height + 20} role="img" aria-label={data.title}>
              <defs>
                <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="#94a3b8" /></marker>
              </defs>
              <g transform="translate(10 10)">
                {data.edges.map((e) => {
                  const a = pos.get(e.from), b = pos.get(e.to);
                  if (!a || !b || a === b) return null;
                  const back = b.x <= a.x;
                  const x1 = back ? a.x : a.x + NODE_W, x2 = back ? b.x + NODE_W : b.x;
                  const y1 = a.y + NODE_H / 2, y2 = b.y + NODE_H / 2, mx = (x1 + x2) / 2;
                  const active = sel && (sel.id === e.from || sel.id === e.to);
                  return (
                    <path key={e.id} d={`M${x1} ${y1} C${mx} ${y1} ${mx} ${y2} ${x2} ${y2}`} fill="none" markerEnd="url(#arrow)"
                      stroke={active ? "#4f46e5" : "#cbd5e1"} strokeWidth={active ? 2 : Math.min(1 + e.weight * 0.3, 3)} strokeDasharray={e.confidence === "NAME_MATCH" ? "5 4" : undefined}>
                      <title>{`${e.type}${e.confidence === "NAME_MATCH" ? " (heuristic)" : ""}${e.weight > 1 ? ` ×${e.weight}` : ""}`}</title>
                    </path>
                  );
                })}
                {layout.nodes.map((n) => (
                  <g key={n.id} transform={`translate(${n.x} ${n.y})`} tabIndex={0} role="button" aria-label={`${n.kind} ${n.label}`}
                    className="cursor-pointer outline-none" onClick={() => select(n)} onDoubleClick={() => drill(n)}
                    onKeyDown={(ev) => { if (ev.key === "Enter") select(n); if (ev.key === " ") { ev.preventDefault(); drill(n); } }}>
                    <rect width={NODE_W} height={NODE_H} rx={8} style={{ fill: n.outside ? "var(--app-surface2, #f8fafc)" : "var(--map-bg, #fff)" }} stroke={sel?.id === n.id ? "#4f46e5" : KIND_COLOR[n.kind]} strokeWidth={sel?.id === n.id ? 3 : 1.5} strokeDasharray={n.outside ? "4 3" : undefined} />
                    <text x={10} y={19} fontSize={12} fontWeight={600} style={{ fill: "var(--map-text, #0f172a)" }}>{n.label.length > 26 ? n.label.slice(0, 25) + "…" : n.label}</text>
                    <text x={10} y={35} fontSize={10} fill="#64748b">{(n.sub ?? "").length > 32 ? (n.sub ?? "").slice(0, 31) + "…" : n.sub}</text>
                    <title>{`${n.label}${n.sub ? ` — ${n.sub}` : ""}${n.drill ? "\nDouble-click (or Space) to open" : ""}`}</title>
                  </g>
                ))}
              </g>
            </svg>
          </div>
          <aside className="rounded-lg border bg-white p-3 text-sm">
            {!sel && <p className="text-slate-500">Click a box to see its code. Double-click (or press Space) to drill in: modules → files → symbols. Dashed boxes are context outside the current focus.</p>}
            {sel && (
              <>
                <p className="font-semibold">{sel.label}</p>
                <p className="mb-2 text-xs text-slate-500">{sel.kind}{sel.filePath ? ` · ${sel.filePath}` : ""}{sel.startLine ? ` · lines ${sel.startLine}-${sel.endLine}` : ""}</p>
                {sel.drill && <button onClick={() => drill(sel)} className="mb-2 rounded bg-slate-950 px-2 py-1 text-xs text-white">Open {sel.drill.level === "symbol" ? "symbols" : sel.drill.level === "file" ? "files" : "modules"}</button>}
                {code && (
                  <pre className="max-h-96 overflow-auto rounded bg-slate-900 p-2 text-xs leading-4 text-slate-100">
                    {code.lines.map((l, i) => `${String(code.from + i).padStart(4)}  ${l}`).join("\n")}
                  </pre>
                )}
              </>
            )}
          </aside>
        </div>
      )}
    </div>
  );
}
