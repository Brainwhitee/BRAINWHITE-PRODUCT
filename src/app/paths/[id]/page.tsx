import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePermission } from "@/lib/auth";
import { db } from "@/lib/db";
import { can } from "@/lib/rbac";
import { Shell } from "@/components/Shell";
import { ActionForm, inputCls, btnCls } from "@/components/ActionForm";
import {
  addChunkItem, addContentItem, addModuleItems, addSection, assignPath, deleteHandout, deleteSection,
  moveItem, removeItem, setPublished, updateItem, uploadHandout,
} from "../actions";

const mini = "text-xs text-indigo-700 underline";

export default async function PathBuilder({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ s?: string }>;
}) {
  const me = await requirePermission("members:view");
  const { id } = await params;
  const sp = await searchParams;
  const path = await db.learningPath.findFirst({
    where: { id, orgId: me.orgId },
    include: {
      sections: { orderBy: { order: "asc" }, include: { items: { orderBy: { order: "asc" }, include: { handouts: true } } } },
      handouts: true,
      assignments: true,
    },
  });
  if (!path) notFound();
  const manage = can(me.role, "paths:manage");
  const activeSection = path.sections.find((s) => s.id === sp.s) ?? path.sections[0];

  const repos = await db.repository.findMany({
    where: { orgId: me.orgId },
    include: { modules: { orderBy: { path: "asc" }, include: { chunks: { orderBy: [{ filePath: "asc" }, { startLine: "asc" }] } } } },
  });
  const chunkIds = new Set(path.sections.flatMap((s) => s.items.map((i) => i.refId)));
  const staff = await db.user.findMany({ where: { orgId: me.orgId, role: { in: ["OWNER", "MANAGER", "MENTOR"] }, status: "ACTIVE" } });
  const totalMin = await db.chunk.findMany({ where: { id: { in: [...chunkIds].filter(Boolean) as string[] } }, select: { estMinutes: true } });
  const orphan = path.handouts.filter((h) => !h.itemId);

  return (
    <Shell user={me}>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">{path.title}</h1>
          <p className="text-sm text-slate-500">
            {path.status.toLowerCase()} · v{path.version} · ~{totalMin.reduce((n, c) => n + c.estMinutes, 0)} min of code reading ·{" "}
            <Link className="underline" href={`/tasks?path=${path.id}`}>Tasks</Link>
          </p>
        </div>
        {manage && (
          <form action={setPublished}>
            <input type="hidden" name="pathId" value={path.id} />
            <input type="hidden" name="publish" value={path.status === "PUBLISHED" ? "0" : "1"} />
            <button className={btnCls}>{path.status === "PUBLISHED" ? "Unpublish to edit" : "Publish"}</button>
          </form>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* LEFT: knowledge graph picker */}
        <section>
          <h2 className="mb-2 font-medium">Knowledge graph</h2>
          <p className="mb-2 text-xs text-slate-500">
            Adding to section: <b>{activeSection?.title ?? "none"}</b> (choose a section on the right with &ldquo;add here&rdquo;).
          </p>
          {repos.length === 0 && <p className="text-sm text-slate-500">No repos analysed yet.</p>}
          {repos.map((r) => (
            <div key={r.id} className="mb-3">
              <div className="text-sm font-medium">{r.name}</div>
              {r.modules.map((m) => (
                <details key={m.id} className="my-1 rounded border bg-white p-2 text-sm">
                  <summary className="cursor-pointer">
                    {m.name} <span className="text-xs text-slate-500">({m.chunks.length} chunks)</span>
                  </summary>
                  {manage && activeSection && (
                    <form action={addModuleItems} className="my-1">
                      <input type="hidden" name="pathId" value={path.id} />
                      <input type="hidden" name="sectionId" value={activeSection.id} />
                      <input type="hidden" name="moduleId" value={m.id} />
                      <button className={mini}>+ add whole module</button>
                    </form>
                  )}
                  <ul className="divide-y">
                    {m.chunks.map((c) => (
                      <li key={c.id} className="flex items-start justify-between gap-2 py-1">
                        <div>
                          <div>{c.title} {chunkIds.has(c.id) && <span className="text-xs text-green-700">✓ in path</span>}</div>
                          <div className="text-xs text-slate-500">{c.filePath}:{c.startLine}-{c.endLine} · ~{c.estMinutes}m · {c.difficulty.toLowerCase()}</div>
                        </div>
                        {manage && activeSection && (
                          <form action={addChunkItem}>
                            <input type="hidden" name="pathId" value={path.id} />
                            <input type="hidden" name="sectionId" value={activeSection.id} />
                            <input type="hidden" name="chunkId" value={c.id} />
                            <button className={mini}>+ add</button>
                          </form>
                        )}
                      </li>
                    ))}
                  </ul>
                </details>
              ))}
            </div>
          ))}
        </section>

        {/* RIGHT: outline */}
        <section>
          <h2 className="mb-2 font-medium">Path outline</h2>
          {path.sections.map((s) => (
            <div key={s.id} className={`mb-3 rounded-lg border bg-white p-3 ${s.id === activeSection?.id ? "ring-2 ring-indigo-300" : ""}`}>
              <div className="mb-2 flex items-center justify-between">
                <span className="font-medium">{s.title}</span>
                <span className="flex gap-3">
                  <Link className={mini} href={`/paths/${path.id}?s=${s.id}`}>add here</Link>
                  {manage && (
                    <form action={deleteSection}>
                      <input type="hidden" name="id" value={s.id} />
                      <button className="text-xs text-red-600 underline">delete</button>
                    </form>
                  )}
                </span>
              </div>
              <ol className="space-y-2 text-sm">
                {s.items.map((i) => (
                  <li key={i.id} className="rounded border p-2">
                    <div className="flex items-center justify-between">
                      <span>{i.type === "CHUNK" ? "💻" : "📄"} {i.title}</span>
                      {manage && (
                        <span className="flex gap-2">
                          {["up", "down"].map((d) => (
                            <form key={d} action={moveItem}>
                              <input type="hidden" name="id" value={i.id} />
                              <input type="hidden" name="dir" value={d} />
                              <button className={mini}>{d === "up" ? "↑" : "↓"}</button>
                            </form>
                          ))}
                          <form action={removeItem}>
                            <input type="hidden" name="id" value={i.id} />
                            <button className="text-xs text-red-600 underline">remove</button>
                          </form>
                        </span>
                      )}
                    </div>
                    {manage && (
                      <form action={updateItem} className="mt-1 flex items-center gap-3 text-xs text-slate-600">
                        <input type="hidden" name="id" value={i.id} />
                        <label><input type="checkbox" name="mandatory" defaultChecked={i.mandatory} /> mandatory</label>
                        <label>due day <input name="dueDay" type="number" min={1} defaultValue={i.dueDay ?? ""} className="w-14 rounded border px-1" /></label>
                        <button className={mini}>save</button>
                      </form>
                    )}
                    {i.handouts.map((h) => (
                      <div key={h.id} className="mt-1 text-xs">
                        📎 <a className="underline" href={`/api/handouts/${h.id}`} target="_blank">{h.filename}</a>
                        {h.mustRead && " (must read)"}
                        {manage && (
                          <form action={deleteHandout} className="ml-2 inline">
                            <input type="hidden" name="id" value={h.id} />
                            <button className="text-red-600 underline">x</button>
                          </form>
                        )}
                      </div>
                    ))}
                  </li>
                ))}
                {s.items.length === 0 && <li className="text-xs text-slate-500">Empty. Add chunks from the left.</li>}
              </ol>
            </div>
          ))}

          {manage && (
            <div className="space-y-4">
              <form action={addSection} className="flex gap-2">
                <input type="hidden" name="pathId" value={path.id} />
                <input name="title" placeholder="New section title" className={inputCls} />
                <button className={btnCls}>Add</button>
              </form>

              <details className="rounded-lg border bg-white p-3 text-sm">
                <summary className="cursor-pointer font-medium">Add a content block (setup guide, conventions…)</summary>
                <form action={addContentItem} className="mt-2 space-y-2">
                  <input type="hidden" name="pathId" value={path.id} />
                  <input type="hidden" name="sectionId" value={activeSection?.id} />
                  <input name="title" placeholder="Title" className={inputCls} required />
                  <textarea name="body" rows={5} placeholder="Markdown / text. Links and video URLs allowed." className={inputCls} />
                  <button className={btnCls}>Add to {activeSection?.title}</button>
                </form>
              </details>

              <details className="rounded-lg border bg-white p-3 text-sm">
                <summary className="cursor-pointer font-medium">Upload a handout</summary>
                <ActionForm action={uploadHandout} submit="Upload" className="mt-2 space-y-2">
                  <input type="hidden" name="pathId" value={path.id} />
                  <input type="file" name="file" className="text-xs" />
                  <select name="itemId" className={inputCls}>
                    <option value="">Whole path (Resources)</option>
                    {path.sections.flatMap((s) => s.items.map((i) => <option key={i.id} value={i.id}>{s.title} › {i.title}</option>))}
                  </select>
                  <label className="text-xs"><input type="checkbox" name="mustRead" /> Must read (counts toward progress)</label>
                </ActionForm>
              </details>
            </div>
          )}

          {orphan.length > 0 && (
            <div className="mt-4 text-sm">
              <h3 className="font-medium">Path-level resources</h3>
              {orphan.map((h) => (
                <div key={h.id} className="text-xs">
                  📎 <a className="underline" href={`/api/handouts/${h.id}`} target="_blank">{h.filename}</a>
                  {h.mustRead && " (must read)"}
                </div>
              ))}
            </div>
          )}

          {manage && (
            <section className="mt-6 rounded-lg border bg-white p-4 text-sm">
              <h2 className="mb-2 font-medium">Assign</h2>
              <ActionForm action={assignPath} submit="Assign and email" className="space-y-2">
                <input type="hidden" name="pathId" value={path.id} />
                <input name="email" type="email" placeholder="candidate@email.com (invited if new)" className={inputCls} required />
                <div className="flex gap-2">
                  <input name="startDate" type="date" defaultValue={new Date().toISOString().slice(0, 10)} className={inputCls} />
                  <select name="mentorId" className={inputCls}>
                    <option value="">No mentor</option>
                    {staff.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
                  </select>
                </div>
                <textarea name="message" rows={2} placeholder="Personal message (optional)" className={inputCls} />
              </ActionForm>
              <p className="mt-2 text-xs text-slate-500">{path.assignments.length} assigned so far. Publish first.</p>
            </section>
          )}
        </section>
      </div>
    </Shell>
  );
}
