import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { can } from "@/lib/rbac";
import { Shell } from "@/components/Shell";
import { ActionForm, inputCls } from "@/components/ActionForm";
import { createTask } from "./actions";

const COLS = ["NOT_STARTED", "IN_PROGRESS", "IN_REVIEW", "CHANGES_REQUESTED", "BLOCKED", "DONE"];
const label = (s: string) => s.toLowerCase().replace(/_/g, " ");

export default async function Tasks({ searchParams }: { searchParams: Promise<{ path?: string }> }) {
  const me = await requireUser();
  const sp = await searchParams;

  if (me.role === "CANDIDATE") {
    const mine = await db.taskAssignment.findMany({ where: { assignment: { userId: me.id } }, include: { task: true, prs: true }, orderBy: { dueAt: "asc" } });
    return (
      <Shell user={me} wide>
        <h1 className="mb-4 text-xl font-semibold">My tasks</h1>
        {mine.length === 0 && <p className="text-sm text-slate-500">No tasks yet.</p>}
        <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-6">
          {COLS.map((c) => (
            <div key={c} className="rounded-lg bg-slate-100 p-2">
              <div className="mb-2 text-xs font-medium uppercase text-slate-500">{label(c)}</div>
              {mine.filter((t) => t.status === c).map((t) => (
                <Link key={t.id} href={`/tasks/${t.id}`} className="mb-2 block rounded border bg-white p-2 text-sm hover:border-indigo-400">
                  <div className="font-medium">{t.task.title}</div>
                  <div className="text-xs text-slate-500">due {t.dueAt.toDateString()}</div>
                  {t.prs[0]?.qualityScore != null && <div className="text-xs">PR score {t.prs[0].scoreOverride ?? t.prs[0].qualityScore}</div>}
                </Link>
              ))}
            </div>
          ))}
        </div>
      </Shell>
    );
  }

  const manage = can(me.role, "paths:manage");
  const [tasks, paths, repos, staff] = await Promise.all([
    db.task.findMany({
      where: { orgId: me.orgId, ...(sp.path ? { pathId: sp.path } : {}) },
      include: { path: true, assignments: { include: { assignment: true } } },
      orderBy: { createdAt: "desc" },
    }),
    db.learningPath.findMany({ where: { orgId: me.orgId } }),
    db.repository.findMany({ where: { orgId: me.orgId } }),
    db.user.findMany({ where: { orgId: me.orgId, role: { in: ["OWNER", "MANAGER", "MENTOR"] } } }),
  ]);
  const people = new Map((await db.user.findMany({ where: { orgId: me.orgId } })).map((u) => [u.id, u.name]));

  return (
    <Shell user={me}>
      <h1 className="mb-4 text-xl font-semibold">Tasks</h1>
      {manage && (
        <section className="mb-8 rounded-lg border bg-white p-4">
          <h2 className="mb-3 font-medium">New task</h2>
          <ActionForm action={createTask} submit="Create task" className="grid gap-2 md:grid-cols-2">
            <input name="title" placeholder="Title" className={inputCls} required />
            <select name="pathId" className={inputCls} defaultValue={sp.path ?? ""}>
              <option value="">No path (assign manually)</option>
              {paths.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
            </select>
            <textarea name="description" rows={3} placeholder="Description (markdown)" className={inputCls + " md:col-span-2"} />
            <textarea name="acceptance" rows={3} placeholder={"Acceptance criteria, one per line"} className={inputCls + " md:col-span-2"} />
            <select name="repoId" className={inputCls}>
              <option value="">Repository (optional)</option>
              {repos.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
            <select name="reviewerId" className={inputCls}>
              <option value="">Reviewer (optional)</option>
              {staff.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
            <input name="deadlineDay" type="number" defaultValue={7} min={1} className={inputCls} title="Deadline: day N of onboarding" />
            <input name="estHours" type="number" defaultValue={4} min={1} className={inputCls} title="Estimated hours" />
            <select name="difficulty" className={inputCls}><option>EASY</option><option>MEDIUM</option><option>HARD</option></select>
            <input name="issueUrl" placeholder="Link existing GitHub issue URL (optional)" className={inputCls} />
            <label className="text-sm"><input type="checkbox" name="createIssue" defaultChecked /> Create a GitHub issue (needs GITHUB_TOKEN, else placeholder number)</label>
          </ActionForm>
        </section>
      )}

      <div className="space-y-3">
        {tasks.map((t) => (
          <section key={t.id} className="rounded-lg border bg-white p-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="font-medium">{t.title} {t.issueNumber && <span className="text-xs text-slate-500">#{t.issueNumber}</span>}</span>
              <span className="text-xs text-slate-500">{t.path?.title ?? "no path"} · day {t.deadlineDay} · {t.difficulty.toLowerCase()}</span>
            </div>
            <ul className="mt-2 space-y-1">
              {t.assignments.map((a) => (
                <li key={a.id} className="flex gap-3">
                  <Link className="text-indigo-700 underline" href={`/tasks/${a.id}`}>{people.get(a.assignment.userId)}</Link>
                  <span>{label(a.status)}</span>
                  <span className="text-slate-500">due {a.dueAt.toDateString()}</span>
                </li>
              ))}
              {t.assignments.length === 0 && <li className="text-slate-500">Not assigned to anyone yet.</li>}
            </ul>
          </section>
        ))}
      </div>
    </Shell>
  );
}
