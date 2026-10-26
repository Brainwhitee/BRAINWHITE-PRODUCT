import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { assignmentProgress } from "@/lib/domain/assign";
import { Shell } from "@/components/Shell";

export default async function Learn() {
  const me = await requireUser();
  // Candidates cannot enter the app until GitHub is linked (PLT-03)
  if (me.role === "CANDIDATE" && !me.githubUserId) redirect("/connect-github");

  const assignments = await db.assignment.findMany({
    where: { userId: me.id },
    include: { path: true, tasks: { include: { task: true }, orderBy: { dueAt: "asc" } }, progress: { orderBy: { ts: "desc" }, take: 1 } },
  });
  const rows = await Promise.all(assignments.map(async (a) => ({ a, p: await assignmentProgress(a.id) })));

  return (
    <Shell user={me}>
      <h1 className="mb-1 text-xl font-semibold">Hi {me.name}</h1>
      <p className="mb-6 text-sm text-slate-600">GitHub linked as <b>@{me.githubUsername}</b>.</p>
      {rows.length === 0 && <p className="text-sm text-slate-500">No learning path has been assigned yet.</p>}
      {rows.map(({ a, p }) => {
        const nextItem = p.items.find((i) => i.mandatory && !p.done.has(i.id));
        const lastItem = a.progress[0]?.itemId;
        const upcoming = a.tasks.filter((t) => t.status !== "DONE").slice(0, 3);
        return (
          <section key={a.id} className="mb-4 rounded-lg border bg-white p-4">
            <div className="flex items-center justify-between">
              <h2 className="font-medium">{a.path.title}</h2>
              <span className="text-sm text-slate-500">{a.status.toLowerCase()}</span>
            </div>
            <div className="my-2 h-2 rounded bg-slate-100"><div className="h-2 rounded bg-indigo-600" style={{ width: `${p.pct}%` }} /></div>
            <p className="text-sm text-slate-600">{p.completed}/{p.total} mandatory items · {p.pct}%</p>
            <div className="mt-3 flex gap-4 text-sm">
              <Link className="text-indigo-700 underline" href={`/learn/${a.id}`}>Path outline</Link>
              {(lastItem || nextItem) && (
                <Link className="rounded bg-indigo-600 px-3 py-1 text-white" href={`/learn/${a.id}/${nextItem?.id ?? lastItem}`}>
                  {lastItem ? "Continue where you left off" : "Start"}
                </Link>
              )}
              <Link className="text-indigo-700 underline" href={`/learn/${a.id}/resources`}>Resources</Link>
            </div>
            {upcoming.length > 0 && (
              <div className="mt-3 text-sm">
                <div className="font-medium">Upcoming tasks</div>
                <ul className="text-slate-600">
                  {upcoming.map((t) => (
                    <li key={t.id}><Link className="underline" href={`/tasks/${t.id}`}>{t.task.title}</Link> — due {t.dueAt.toDateString()} ({t.status.toLowerCase().replace("_", " ")})</li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        );
      })}
    </Shell>
  );
}
