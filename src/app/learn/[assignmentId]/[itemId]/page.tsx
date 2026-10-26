import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { can } from "@/lib/rbac";
import { Shell } from "@/components/Shell";
import { Workspace, type WorkspaceProps } from "@/components/Workspace";
import { markComplete } from "../../actions";

export default async function WorkspacePage({ params }: { params: Promise<{ assignmentId: string; itemId: string }> }) {
  const me = await requireUser();
  const { assignmentId, itemId } = await params;
  const isStaff = can(me.role, "paths:manage");
  const a = await db.assignment.findFirst({
    where: { id: assignmentId, orgId: me.orgId, ...(isStaff ? {} : { userId: me.id }) },
    include: { path: { include: { sections: { orderBy: { order: "asc" }, include: { items: { orderBy: { order: "asc" } } } } } } },
  });
  if (!a) notFound();
  const preview = a.userId !== me.id; // staff can preview a candidate's view without emitting progress
  const flat = a.path.sections.flatMap((s) => s.items.map((i) => ({ ...i, section: s.title })));
  const idx = flat.findIndex((i) => i.id === itemId);
  if (idx < 0) notFound();
  const item = flat[idx];
  const prev = flat[idx - 1];
  const next = flat[idx + 1];

  const chunk = item.refId ? await db.chunk.findUnique({ where: { id: item.refId }, include: { module: true } }) : null;
  const file = chunk ? await db.file.findFirst({ where: { repoId: chunk.repoId, path: chunk.filePath }, include: { symbols: { orderBy: { startLine: "asc" } } } }) : null;

  let deps: string[] = [], dependents: string[] = [], docs: { path: string; text: string }[] = [], moduleDeps: string[] = [];
  if (chunk && file) {
    const edges = await db.graphEdge.findMany({ where: { repoId: chunk.repoId, OR: [{ fromId: file.id }, { toId: file.id }], type: "IMPORTS" } });
    const ids = [...new Set(edges.flatMap((e) => [e.fromId, e.toId]).filter((x) => x !== file.id))];
    const fmap = new Map((await db.file.findMany({ where: { id: { in: ids } }, select: { id: true, path: true } })).map((f) => [f.id, f.path]));
    deps = edges.filter((e) => e.fromId === file.id).map((e) => fmap.get(e.toId)!).filter(Boolean);
    dependents = edges.filter((e) => e.toId === file.id).map((e) => fmap.get(e.fromId)!).filter(Boolean);
    const medges = await db.graphEdge.findMany({ where: { repoId: chunk.repoId, type: "DEPENDS_ON", fromId: chunk.moduleId } });
    moduleDeps = (await db.module.findMany({ where: { id: { in: medges.map((e) => e.toId) } } })).map((m) => m.name);
    const base = chunk.filePath.split("/").pop()!;
    const md = await db.file.findMany({ where: { repoId: chunk.repoId, language: "markdown" } });
    docs = md.filter((f) => f.content.includes(base) || f.content.toLowerCase().includes(chunk.module.name.toLowerCase())).slice(0, 3)
      .map((f) => ({ path: f.path, text: f.content.slice(0, 700) }));
  }

  const handouts = await db.handout.findMany({ where: { pathId: a.pathId, OR: [{ itemId }, { itemId: null }] } });
  const note = await db.note.findUnique({ where: { userId_itemId: { userId: me.id, itemId } } });
  const history = await db.chatMessage.findMany({ where: { userId: me.id, itemId }, orderBy: { ts: "asc" }, take: 50 });
  const done = !!(await db.progressEvent.findFirst({ where: { assignmentId, itemId, type: "COMPLETED" } }));
  if (!preview) {
    const recent = await db.progressEvent.findFirst({ where: { assignmentId, itemId, type: "OPENED", ts: { gt: new Date(Date.now() - 3600_000) } } });
    if (!recent) await db.progressEvent.create({ data: { assignmentId, userId: me.id, itemId, type: "OPENED" } });
  }

  const props: WorkspaceProps = {
    assignmentId, itemId, preview, done,
    item: { type: item.type, title: item.title, body: item.body },
    chunk: chunk && file ? {
      repoId: chunk.repoId, path: chunk.filePath, start: chunk.startLine, end: chunk.endLine, summary: chunk.summary,
      difficulty: chunk.difficulty, status: chunk.status, moduleName: chunk.module.name, moduleSummary: chunk.module.summary,
      content: file.content, language: file.language,
      symbols: file.symbols.filter((s) => s.startLine >= chunk.startLine && s.endLine <= chunk.endLine).map((s) => ({ name: s.name, kind: s.kind, line: s.startLine, signature: s.signature, doc: s.doc })),
      deps, dependents, moduleDeps, docs,
    } : null,
    handouts: handouts.map((h) => ({ id: h.id, filename: h.filename, mime: h.mime, mustRead: h.mustRead })),
    note: note?.body ?? "",
    history: history.map((m) => ({ id: m.id, role: m.role as "user" | "assistant", content: m.content, citations: JSON.parse(m.citations), feedback: m.feedback })),
    level: me.experienceLevel,
  };

  return (
    <Shell user={me} wide>
      <div className="mb-2 flex items-center justify-between text-sm">
        <div className="text-slate-600">
          <Link className="underline" href={`/learn/${a.id}`}>{a.path.title}</Link> › {item.section} › <b>{item.title}</b>
          {chunk && <span className="ml-2 text-xs text-slate-500">~{chunk.estMinutes} min</span>}
          {preview && <span className="ml-2 rounded bg-amber-100 px-1.5 text-xs text-amber-800">preview (no progress recorded)</span>}
        </div>
        <div className="flex items-center gap-3">
          {prev && <Link className="underline" href={`/learn/${a.id}/${prev.id}`}>← Prev</Link>}
          {next && <Link className="underline" href={`/learn/${a.id}/${next.id}`}>Next →</Link>}
          {!preview && (
            <form action={markComplete}>
              <input type="hidden" name="assignmentId" value={a.id} />
              <input type="hidden" name="itemId" value={itemId} />
              <input type="hidden" name="nextId" value={next?.id ?? ""} />
              <button className="rounded bg-indigo-600 px-3 py-1 text-white">{done ? "Completed ✓ (continue)" : "Mark complete"}</button>
            </form>
          )}
        </div>
      </div>
      <Workspace {...props} />
    </Shell>
  );
}
