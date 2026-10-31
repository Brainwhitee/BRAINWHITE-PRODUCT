import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { can } from "@/lib/rbac";
import { Shell } from "@/components/Shell";
import { ActionForm, inputCls } from "@/components/ActionForm";
import { createTask } from "./actions";
import { CheckSquare, Plus, GitPullRequest, Calendar, Clock, GitBranch } from "lucide-react";

const COLS = ["NOT_STARTED", "IN_PROGRESS", "IN_REVIEW", "CHANGES_REQUESTED", "BLOCKED", "DONE"];
const label = (s: string) => s.toLowerCase().replace(/_/g, " ");

const getDifficultyBadge = (d: string) => {
  switch (d.toUpperCase()) {
    case "HARD":
      return "bg-red-50 text-red-700 border-red-200";
    case "MEDIUM":
      return "bg-amber-50 text-amber-700 border-amber-200";
    case "EASY":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    default:
      return "bg-slate-100 text-slate-700 border-slate-200";
  }
};

const getStatusBadge = (s: string) => {
  switch (s) {
    case "DONE":
      return "bg-emerald-50 text-emerald-700 border-emerald-200/60";
    case "IN_REVIEW":
      return "bg-blue-50 text-blue-700 border-blue-200/60";
    case "CHANGES_REQUESTED":
    case "BLOCKED":
      return "bg-red-50 text-red-700 border-red-200/60";
    case "IN_PROGRESS":
      return "bg-purple-50 text-purple-700 border-purple-200/60";
    default:
      return "bg-slate-100 text-slate-600 border-slate-200";
  }
};

export default async function Tasks({ searchParams }: { searchParams: Promise<{ path?: string }> }) {
  const me = await requireUser();
  const sp = await searchParams;

  if (me.role === "CANDIDATE") {
    const mine = await db.taskAssignment.findMany({
      where: { assignment: { userId: me.id } },
      include: { task: true, prs: true },
      orderBy: { dueAt: "asc" },
    });

    return (
      <Shell user={me} wide>
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-950 tracking-tight">My Tasks & Kanban</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Review your onboarding assignments, PR reviews, and upcoming task deadlines.
            </p>
          </div>
        </div>

        {mine.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center bg-white shadow-xs">
            <CheckSquare className="mx-auto size-10 text-slate-400 mb-3" />
            <h3 className="font-semibold text-slate-900 text-lg">No Tasks Assigned Yet</h3>
            <p className="text-sm text-slate-500 max-w-md mx-auto mt-1">
              Your mentors will assign tasks according to your learning path milestones.
            </p>
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6 items-start">
          {COLS.map((c) => {
            const colTasks = mine.filter((t) => t.status === c);
            return (
              <div key={c} className="rounded-2xl bg-slate-100/80 p-3 border border-slate-200/60">
                <div className="mb-3 flex items-center justify-between px-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                    {label(c)}
                  </span>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-white text-slate-700 border border-slate-200 shadow-2xs">
                    {colTasks.length}
                  </span>
                </div>

                <div className="space-y-2.5">
                  {colTasks.map((t) => (
                    <Link
                      key={t.id}
                      href={`/tasks/${t.id}`}
                      className="group block rounded-xl border border-slate-200/90 bg-white p-3 shadow-xs hover:shadow-md hover:border-black transition-all"
                    >
                      <div className="font-bold text-slate-900 text-sm leading-snug group-hover:text-black">
                        {t.task.title}
                      </div>
                      <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                        <span className="inline-flex items-center gap-1">
                          <Calendar className="size-3 text-slate-400" />
                          <span>{t.dueAt.toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                        </span>
                        {t.prs[0]?.qualityScore != null && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200/50">
                            <GitPullRequest className="size-2.5" />
                            <span>{t.prs[0].scoreOverride ?? t.prs[0].qualityScore}</span>
                          </span>
                        )}
                      </div>
                    </Link>
                  ))}
                  {colTasks.length === 0 && (
                    <div className="py-6 text-center text-xs text-slate-400 italic">No tasks</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Shell>
    );
  }

  const manage = can(me.role, "paths:manage");
  const [tasks, paths, repos, staff, usersList] = await Promise.all([
    db.task.findMany({
      where: { orgId: me.orgId, ...(sp.path ? { pathId: sp.path } : {}) },
      include: { path: true, assignments: { include: { assignment: true } } },
      orderBy: { createdAt: "desc" },
    }),
    db.learningPath.findMany({ where: { orgId: me.orgId } }),
    db.repository.findMany({ where: { orgId: me.orgId } }),
    db.user.findMany({ where: { orgId: me.orgId, role: { in: ["OWNER", "MANAGER", "MENTOR"] } } }),
    db.user.findMany({ where: { orgId: me.orgId } }),
  ]);
  const people = new Map(usersList.map((u) => [u.id, u.name]));

  return (
    <Shell user={me}>
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-950 tracking-tight">Onboarding Tasks</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure practical milestones, pull request reviews, and deadline checkpoints.
          </p>
        </div>
      </div>

      {manage && (
        <section className="mb-8 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
          <div className="flex items-center gap-2 mb-3">
            <Plus className="size-4 text-slate-700" />
            <h2 className="font-bold text-slate-900 text-sm">Create New Task</h2>
          </div>
          <ActionForm action={createTask} submit="Create Task" className="grid gap-3 md:grid-cols-2">
            <input name="title" placeholder="Task title (e.g. Implement Webhook Deduplication)" className={inputCls} required />
            <select name="pathId" className={inputCls} defaultValue={sp.path ?? ""}>
              <option value="">No path (assign manually)</option>
              {paths.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </select>
            <textarea
              name="description"
              rows={3}
              placeholder="Description (markdown documentation, objectives)"
              className={inputCls + " md:col-span-2"}
            />
            <textarea
              name="acceptance"
              rows={3}
              placeholder="Acceptance criteria (one requirement per line)"
              className={inputCls + " md:col-span-2"}
            />
            <select name="repoId" className={inputCls}>
              <option value="">Repository (optional)</option>
              {repos.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
            <select name="reviewerId" className={inputCls}>
              <option value="">Reviewer mentor (optional)</option>
              {staff.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
            <div className="grid grid-cols-2 gap-2">
              <input
                name="deadlineDay"
                type="number"
                defaultValue={7}
                min={1}
                className={inputCls}
                title="Deadline: Day N of onboarding cohort"
              />
              <input
                name="estHours"
                type="number"
                defaultValue={4}
                min={1}
                className={inputCls}
                title="Estimated hours"
              />
            </div>
            <select name="difficulty" className={inputCls}>
              <option>EASY</option>
              <option>MEDIUM</option>
              <option>HARD</option>
            </select>
            <input
              name="issueUrl"
              placeholder="Link existing GitHub issue URL (optional)"
              className={inputCls + " md:col-span-2"}
            />
            <label className="text-xs font-semibold text-slate-700 flex items-center gap-2 md:col-span-2">
              <input type="checkbox" name="createIssue" defaultChecked className="rounded border-slate-300" />
              <span>Automatically synchronize and generate GitHub issue for assigned candidate</span>
            </label>
          </ActionForm>
        </section>
      )}

      {/* Task List */}
      <div className="space-y-3.5">
        {tasks.map((t) => (
          <div
            key={t.id}
            className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs hover:border-slate-300 transition-colors"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <span className="font-bold text-slate-900 text-sm">{t.title}</span>
                {t.issueNumber && (
                  <span className="text-[11px] font-mono font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                    #{t.issueNumber}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 font-medium">
                  {t.path?.title ?? "General"} · Day {t.deadlineDay}
                </span>
                <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded border ${getDifficultyBadge(t.difficulty)}`}>
                  {t.difficulty}
                </span>
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-slate-100">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Assigned Candidates
              </div>
              <ul className="space-y-1.5">
                {t.assignments.map((a) => (
                  <li key={a.id} className="flex items-center justify-between text-xs py-1">
                    <Link
                      className="font-bold text-slate-900 hover:text-indigo-600 transition-colors"
                      href={`/tasks/${a.id}`}
                    >
                      {people.get(a.assignment.userId) || "Assigned Engineer"}
                    </Link>
                    <div className="flex items-center gap-3">
                      <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full border ${getStatusBadge(a.status)}`}>
                        {label(a.status)}
                      </span>
                      <span className="text-slate-400">
                        due {a.dueAt.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </span>
                    </div>
                  </li>
                ))}
                {t.assignments.length === 0 && (
                  <li className="text-slate-400 text-xs italic">Not assigned to any cohort member yet.</li>
                )}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </Shell>
  );
}
