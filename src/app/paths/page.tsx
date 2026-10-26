import Link from "next/link";
import { requirePermission } from "@/lib/auth";
import { db } from "@/lib/db";
import { can } from "@/lib/rbac";
import { Shell } from "@/components/Shell";
import { ActionForm, inputCls } from "@/components/ActionForm";
import { createPath } from "./actions";

export default async function Paths() {
  const me = await requirePermission("members:view");
  const paths = await db.learningPath.findMany({
    where: { orgId: me.orgId },
    include: { sections: { include: { _count: { select: { items: true } } } }, _count: { select: { assignments: true } } },
    orderBy: { createdAt: "desc" },
  });
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
