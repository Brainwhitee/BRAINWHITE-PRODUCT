import Link from "next/link";
import { requirePermission } from "@/lib/auth";
import { db } from "@/lib/db";
import { can } from "@/lib/rbac";
import { Shell } from "@/components/Shell";
import { ActionForm, inputCls } from "@/components/ActionForm";
import { createPath, createSuggestedPath } from "./actions";

export default async function Paths() {
  const me = await requirePermission("members:view");
  const paths = await db.learningPath.findMany({
    where: { orgId: me.orgId },
    include: { sections: { include: { _count: { select: { items: true } } } }, _count: { select: { assignments: true } } },
    orderBy: { createdAt: "desc" },
  });
  const repos = await db.repository.findMany({ where: { orgId: me.orgId, syncStatus: "HEALTHY" }, select: { id: true, name: true }, orderBy: { name: "asc" } });
  return (
    <Shell user={me}>
      <h1 className="mb-4 text-xl font-semibold">Learning paths</h1>
      {can(me.role, "paths:manage") && (
        <section className="mb-8 rounded-lg border bg-white p-4">
          <h2 className="mb-3 font-medium">New path</h2>
          <ActionForm action={createPath} submit="Create path" className="flex flex-wrap items-start gap-2">
            <input name="title" placeholder="e.g. Backend onboarding: Payments" className={inputCls + " !w-72"} required />
            <input name="role" placeholder="Target role" className={inputCls + " !w-40"} />
            <select name="type" className={inputCls + " !w-40"}>
              <option value="NEW_JOINEE">New joinee</option>
              <option value="NEW_PROJECT">New project</option>
            </select>
          </ActionForm>
        </section>
      )}
      {can(me.role, "paths:manage") && repos.length > 0 && (
        <section className="mb-8 rounded-lg border bg-white p-4">
          <h2 className="mb-1 font-medium">Suggest a path from the code graph</h2>
          <p className="mb-3 text-sm text-slate-500">Creates a draft: modules in dependency order (foundations first), the most imported files first, each lesson linked to real code. You review and edit it before publishing.</p>
          <ActionForm action={createSuggestedPath} submit="Suggest a draft path" className="flex flex-wrap items-start gap-2">
            <select name="repoId" className={inputCls + " !w-72"} required>
              {repos.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          </ActionForm>
        </section>
      )}
      {paths.length === 0 && <p className="text-sm text-slate-500">No paths yet. Connect a repo under Codebase first, then create one.</p>}
      <ul className="space-y-2">
        {paths.map((p) => (
          <li key={p.id} className="rounded-lg border bg-white p-3 text-sm">
            <Link className="font-medium text-indigo-700 underline" href={`/paths/${p.id}`}>{p.title}</Link>
            <span className="ml-3 rounded bg-slate-100 px-2 py-0.5 text-xs">{p.status.toLowerCase()} v{p.version}</span>
            <span className="ml-3 text-slate-500">
              {p.sections.reduce((n, s) => n + s._count.items, 0)} items · {p._count.assignments} assigned
            </span>
          </li>
        ))}
      </ul>
    </Shell>
  );
}
