"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";

type Citation = { n: number; kind: string; repoId?: string; path: string; start: number; end: number; title: string };
type Msg = { id: string; role: "user" | "assistant"; content: string; citations: Citation[]; feedback: number };

export type WorkspaceProps = {
  assignmentId: string;
  itemId: string;
  preview: boolean;
  done: boolean;
  level: string;
  item: { type: string; title: string; body: string };
  chunk: {
    repoId: string; path: string; start: number; end: number; summary: string; difficulty: string; status: string;
    moduleName: string; moduleSummary: string; content: string; language: string;
    symbols: { name: string; kind: string; line: number; signature: string; doc: string }[];
    deps: string[]; dependents: string[]; moduleDeps: string[]; docs: { path: string; text: string }[];
  } | null;
  handouts: { id: string; filename: string; mime: string; mustRead: boolean }[];
  note: string;
  history: Msg[];
};

type CodeView = { repoId: string; path: string; content: string; start: number; end: number };

const handle = "w-1.5 bg-slate-200 hover:bg-indigo-300 transition-colors";

export function Workspace(p: WorkspaceProps) {
  const [code, setCode] = useState<CodeView | null>(
    p.chunk ? { repoId: p.chunk.repoId, path: p.chunk.path, content: p.chunk.content, start: p.chunk.start, end: p.chunk.end } : null,
  );
  const [tab, setTab] = useState<"explain" | "handouts" | "notes">("explain");
  const [selection, setSelection] = useState<{ text: string; start: number; end: number } | null>(null);
  const codeRef = useRef<HTMLDivElement>(null);

  // jump to a line/range in the code pane
  const reveal = useCallback((start: number, end: number) => {
    setCode((c) => (c ? { ...c, start, end } : c));
    requestAnimationFrame(() => codeRef.current?.querySelector(`[data-line="${start}"]`)?.scrollIntoView({ block: "center", behavior: "smooth" }));
  }, []);

  useEffect(() => {
    if (code) codeRef.current?.querySelector(`[data-line="${code.start}"]`)?.scrollIntoView({ block: "center" });
    // only on first mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // active-time tracking: heartbeat only while visible and recently active (idle > 2 min excluded)
  useEffect(() => {
    if (p.preview) return;
    let last = Date.now();
    const bump = () => (last = Date.now());
    window.addEventListener("mousemove", bump);
    window.addEventListener("keydown", bump);
    window.addEventListener("scroll", bump, true);
    const t = setInterval(() => {
      if (document.visibilityState === "visible" && Date.now() - last < 120_000)
        fetch("/api/progress", { method: "POST", body: JSON.stringify({ assignmentId: p.assignmentId, itemId: p.itemId, type: "TIME", value: 30 }) });
    }, 30_000);
    return () => {
      clearInterval(t);
      window.removeEventListener("mousemove", bump);
      window.removeEventListener("keydown", bump);
      window.removeEventListener("scroll", bump, true);
    };
  }, [p.preview, p.assignmentId, p.itemId]);

  async function openCitation(c: Citation) {
    if (c.kind !== "code" || !c.repoId) return;
    if (code && code.repoId === c.repoId && code.path === c.path) return reveal(c.start, c.end);
    const r = await fetch(`/api/code?repoId=${c.repoId}&path=${encodeURIComponent(c.path)}`);
    if (!r.ok) return;
    const f = await r.json();
    setCode({ repoId: c.repoId, path: c.path, content: f.content, start: c.start, end: c.end });
    requestAnimationFrame(() => codeRef.current?.querySelector(`[data-line="${c.start}"]`)?.scrollIntoView({ block: "center" }));
  }

  function onMouseUp() {
    const sel = window.getSelection();
    const text = sel?.toString().trim();
    if (!sel || !text || !code) return setSelection(null);
    const lineOf = (n: Node | null) => Number((n instanceof Element ? n : n?.parentElement)?.closest("[data-line]")?.getAttribute("data-line")) || null;
    const a = lineOf(sel.anchorNode);
    const b = lineOf(sel.focusNode);
    if (a && b) setSelection({ text, start: Math.min(a, b), end: Math.max(a, b) });
  }

  // chat state lives here so code-pane actions can drive it
  const [msgs, setMsgs] = useState<Msg[]>(p.history);
  const [busy, setBusy] = useState(false);
  const [input, setInput] = useState("");
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs, busy]);

  async function ask(question: string, sel?: typeof selection) {
    if (!question.trim() || busy) return;
    setBusy(true);
    setMsgs((m) => [...m, { id: `tmp${Date.now()}`, role: "user", content: question, citations: [], feedback: 0 }]);
    setInput("");
    try {
      const r = await fetch("/api/chat", {
        method: "POST",
        body: JSON.stringify({ itemId: p.itemId, question, selection: sel && code ? { ...sel, path: code.path } : undefined }),
      });
      const d = await r.json();
      setMsgs((m) => [...m, { id: d.id ?? `a${Date.now()}`, role: "assistant", content: d.answer ?? "Something went wrong.", citations: d.citations ?? [], feedback: 0 }]);
    } finally {
      setBusy(false);
    }
  }

  const starters = p.chunk
    ? [`What does ${p.item.title.split(",")[0]} do?`, "What are the edge cases here?", "Which other files depend on this?"]
    : ["Where can I find the coding conventions?"];

  const lines = code?.content.split("\n") ?? [];

  return (
    <div className="h-[calc(100vh-110px)] rounded-lg border bg-white">
      <PanelGroup direction="horizontal" autoSaveId="pedagon-workspace-v1">
        {/* LEFT: code */}
        <Panel defaultSize={38} minSize={15} collapsible>
          <div className="flex h-full flex-col">
            <div className="flex items-center justify-between border-b px-3 py-1.5 text-xs text-slate-600">
              <span className="truncate font-mono">{code ? `${code.path}:${code.start}-${code.end}` : "No code for this item"}</span>
            </div>
            {selection && (
              <div className="flex flex-wrap gap-2 border-b bg-indigo-50 px-3 py-1.5 text-xs">
                <span className="text-slate-600">Lines {selection.start}-{selection.end}:</span>
                {["Explain this", "Why is this here?", "What calls this?"].map((q) => (
                  <button key={q} className="text-indigo-700 underline" onClick={() => ask(q, selection)}>{q}</button>
                ))}
              </div>
            )}
            <div ref={codeRef} onMouseUp={onMouseUp} className="flex-1 overflow-auto bg-slate-50 py-2 font-mono text-xs leading-5">
              {lines.map((l, i) => {
                const n = i + 1;
                const hi = code && n >= code.start && n <= code.end;
                return (
                  <div key={n} data-line={n} className={`flex ${hi ? "bg-yellow-100" : ""}`}>
                    <span className="w-10 shrink-0 select-none pr-2 text-right text-slate-400">{n}</span>
                    <pre className="whitespace-pre pr-4">{l || " "}</pre>
                  </div>
                );
              })}
              {!code && <p className="p-4 text-slate-500">This item has no code. See the middle pane.</p>}
            </div>
          </div>
        </Panel>
        <PanelResizeHandle className={handle} />

        {/* MIDDLE */}
        <Panel defaultSize={34} minSize={20} collapsible>
          <div className="flex h-full flex-col">
            <div className="flex gap-1 border-b px-2 pt-1 text-sm">
              {(["explain", "handouts", "notes"] as const).map((t) => (
                <button key={t} onClick={() => setTab(t)} className={`rounded-t px-3 py-1 ${tab === t ? "border-b-2 border-indigo-600 font-medium" : "text-slate-500"}`}>
                  {t === "explain" ? "Explanation" : t === "handouts" ? `Handouts (${p.handouts.length})` : "Notes"}
                </button>
              ))}
            </div>
            <div className="flex-1 space-y-4 overflow-auto p-4 text-sm">
              {tab === "explain" && <Explanation p={p} onJump={reveal} />}
              {tab === "handouts" && <Handouts p={p} />}
              {tab === "notes" && <Notes p={p} />}
            </div>
          </div>
        </Panel>
        <PanelResizeHandle className={handle} />

        {/* RIGHT: chat */}
        <Panel defaultSize={28} minSize={18} collapsible>
          <div className="flex h-full flex-col">
            <div className="border-b px-3 py-1.5 text-sm font-medium">AI assistant <span className="text-xs font-normal text-slate-500">· answers from your codebase</span></div>
            <div className="flex-1 space-y-3 overflow-auto p-3 text-sm">
              {msgs.length === 0 && (
                <div className="space-y-1">
                  <p className="text-xs text-slate-500">Try asking:</p>
                  {starters.map((s) => (
                    <button key={s} onClick={() => ask(s)} className="block rounded border px-2 py-1 text-left text-xs hover:bg-slate-50">{s}</button>
                  ))}
                </div>
              )}
              {msgs.map((m) => (
                <div key={m.id} className={m.role === "user" ? "text-right" : ""}>
                  <div className={`inline-block max-w-full whitespace-pre-wrap rounded-lg px-3 py-2 text-left ${m.role === "user" ? "bg-indigo-600 text-white" : "bg-slate-100"}`}>{m.content}</div>
                  {m.citations.length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-1">
                      {m.citations.map((c) => (
                        <button key={c.n} onClick={() => openCitation(c)} className="rounded border px-1.5 py-0.5 text-xs text-indigo-700 hover:bg-indigo-50" title={c.title}>
                          [{c.n}] {c.path.split("/").pop()}{c.kind === "code" ? `:${c.start}` : ""}
                        </button>
                      ))}
                    </div>
                  )}
                  {m.role === "assistant" && !m.id.startsWith("tmp") && (
                    <div className="mt-1 flex gap-2 text-xs text-slate-400">
                      {[1, -1].map((v) => (
                        <button key={v} className={m.feedback === v ? "text-indigo-700" : ""} onClick={() => {
                          fetch("/api/chat", { method: "POST", body: JSON.stringify({ action: "feedback", id: m.id, value: v }) });
                          setMsgs((all) => all.map((x) => (x.id === m.id ? { ...x, feedback: v } : x)));
                        }}>{v === 1 ? "👍" : "👎"}</button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              {busy && <div className="text-xs text-slate-500">Thinking…</div>}
              <div ref={endRef} />
            </div>
            <form className="flex gap-2 border-t p-2" onSubmit={(e) => { e.preventDefault(); ask(input); }}>
              <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask about this code…" className="flex-1 rounded border px-2 py-1.5 text-sm" />
              <button disabled={busy} className="rounded bg-indigo-600 px-3 text-sm text-white disabled:opacity-50">Ask</button>
            </form>
          </div>
        </Panel>
      </PanelGroup>
    </div>
  );
}

function Explanation({ p, onJump }: { p: WorkspaceProps; onJump: (s: number, e: number) => void }) {
  const c = p.chunk;
  if (!c)
    return (
      <div>
        <h2 className="mb-2 text-base font-semibold">{p.item.title}</h2>
        <div className="whitespace-pre-wrap">{p.item.body || "No content."}</div>
      </div>
    );
  return (
    <>
      {c.status === "UPDATED" && <p className="rounded bg-amber-50 p-2 text-xs text-amber-800">This code changed since the path was created.</p>}
      {c.docs.length > 0 && (
        <section>
          <h3 className="mb-1 font-semibold">From company docs</h3>
          {c.docs.map((d) => (
            <div key={d.path} className="mb-2 rounded border-l-4 border-green-500 bg-green-50 p-2">
              <div className="text-xs text-slate-500">{d.path}</div>
              <div className="whitespace-pre-wrap text-xs">{d.text}</div>
            </div>
          ))}
        </section>
      )}
      <section>
        <h3 className="mb-1 font-semibold">Overview <span className="ml-1 rounded bg-slate-100 px-1.5 text-xs font-normal text-slate-500">AI-generated · {c.difficulty.toLowerCase()}</span></h3>
        <p>{c.summary}</p>
      </section>
      <section>
        <h3 className="mb-1 font-semibold">How it fits</h3>
        <p className="mb-1"><b>{c.moduleName}</b>: {c.moduleSummary}</p>
        {c.moduleDeps.length > 0 && <p className="text-xs text-slate-600">Module depends on: {c.moduleDeps.join(", ")}</p>}
        {c.deps.length > 0 && <p className="text-xs text-slate-600">This file imports: {c.deps.join(", ")}</p>}
        {c.dependents.length > 0 && <p className="text-xs text-slate-600">Imported by: {c.dependents.join(", ")}</p>}
      </section>
      {c.symbols.length > 0 && (
        <section>
          <h3 className="mb-1 font-semibold">Breakdown</h3>
          <ul className="space-y-2">
            {c.symbols.map((s) => (
              <li key={`${s.name}${s.line}`}>
                <button className="font-mono text-indigo-700 underline" onClick={() => onJump(s.line, s.line)}>{s.name}</button>
                <span className="ml-2 text-xs text-slate-500">{s.kind} · line {s.line}</span>
                <div className="font-mono text-xs text-slate-600">{s.signature}</div>
                {s.doc && <div className="text-xs">{s.doc}</div>}
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}

function Handouts({ p }: { p: WorkspaceProps }) {
  const [open, setOpen] = useState<string | null>(p.handouts[0]?.id ?? null);
  if (!p.handouts.length) return <p className="text-slate-500">No handouts for this item.</p>;
  const cur = p.handouts.find((h) => h.id === open);
  return (
    <div className="flex h-full flex-col gap-2">
      <ul className="space-y-1">
        {p.handouts.map((h) => (
          <li key={h.id}>
            <button className="text-indigo-700 underline" onClick={() => setOpen(h.id)}>{h.filename}</button>
            {h.mustRead && <span className="ml-2 rounded bg-red-100 px-1.5 text-xs text-red-800">must read</span>}
            <a className="ml-2 text-xs text-slate-500 underline" href={`/api/handouts/${h.id}`} download>download</a>
          </li>
        ))}
      </ul>
      {cur && (cur.mime === "application/pdf" || cur.mime.startsWith("image/") || cur.mime.startsWith("text/")) ? (
        <iframe key={cur.id} src={`/api/handouts/${cur.id}`} className="min-h-[420px] w-full flex-1 rounded border" />
      ) : (
        cur && <p className="text-xs text-slate-500">Preview isn&apos;t available for this file type. Use download.</p>
      )}
    </div>
  );
}

function Notes({ p }: { p: WorkspaceProps }) {
  const [v, setV] = useState(p.note);
  const [saved, setSaved] = useState(true);
  const t = useRef<ReturnType<typeof setTimeout> | null>(null);
  return (
    <div>
      <textarea
        value={v}
        onChange={(e) => {
          setV(e.target.value);
          setSaved(false);
          if (t.current) clearTimeout(t.current);
          t.current = setTimeout(async () => {
            await fetch("/api/progress", { method: "POST", body: JSON.stringify({ assignmentId: p.assignmentId, itemId: p.itemId, type: "NOTE", body: e.target.value }) });
            setSaved(true);
          }, 700);
        }}
        placeholder="Private notes (markdown). Autosaved."
        className="h-72 w-full rounded border p-2 text-sm"
        disabled={p.preview}
      />
      <p className="text-xs text-slate-500">{saved ? "Saved" : "Saving…"} · only you can see these.</p>
    </div>
  );
}
