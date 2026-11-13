import Link from "next/link";
import { requirePermission } from "@/lib/auth";
import { db } from "@/lib/db";
import { can } from "@/lib/rbac";
import { computeMetrics } from "@/lib/domain/metrics";
import { Shell } from "@/components/Shell";
import { runJobsNow } from "../people/actions";

export default async function Dashboard({ searchParams }: { searchParams: Promise<{ path?: string; risk?: string }> }) {
  const me = await requirePermission("members:view");
  const sp = await searchParams;
  const [members, pending, assignments, paths] = await Promise.all([
    db.user.count({ where: { orgId: me.orgId, status: "ACTIVE" } }),
    db.invitation.count({ where: { orgId: me.orgId, status: "PENDING" } }),
    db.assignment.findMany({ where: { orgId: me.orgId, status: "ACTIVE", ...(sp.path ? { pathId: sp.path } : {}) }, include: { path: true }, orderBy: { startDate: "desc" } }),
    db.learningPath.findMany({ where: { orgId: me.orgId } }),
  ]);
  const people = new Map((await db.user.findMany({ where: { orgId: me.orgId } })).map((u) => [u.id, u.name]));
  const now = new Date();
  const rows = await Promise.all(assignments.map(async (a) => ({ a, m: await computeMetrics(a.id, new Date(now.getTime() - 7 * 86400_000), now) })));
  const shown = sp.risk === "1" ? rows.filter((r) => r.m.overall.riskFlags.length) : rows;
  const atRisk = rows.filter((r) => r.m.overall.riskFlags.length).length;
  const stat = (label: string, n: number | string) => (
    <div className="rounded-lg border bg-white p-4">
      <div className="text-2xl font-semibold">{n}</div>
      <div className="text-sm text-slate-500">{label}</div>
    </div>
  );

  return (
    <Shell user={me} wide>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Onboarding dashboard</h1>
        {can(me.role, "paths:manage") && (
          <form action={runJobsNow}><button className="rounded border px-3 py-1 text-sm" title="Deadline reminders, weekly and final reports">Run background jobs now</button></form>
        )}
      </div>
      <div className="mb-6 grid grid-cols-4 gap-4">
        {stat("Active members", members)}{stat("Active onboardings", rows.length)}{stat("At risk", atRisk)}{stat("Pending invites", pending)}
      </div>

      <div className="mb-2 flex gap-3 text-sm">
        <Link className={!sp.path && !sp.risk ? "font-medium underline" : "underline"} href="/dashboard">All</Link>
        <Link className="underline" href="/dashboard?risk=1">At risk only</Link>
        {paths.map((p) => <Link key={p.id} className="text-slate-500 underline" href={`/dashboard?path=${p.id}`}>{p.title}</Link>)}
      </div>

      <div className="overflow-x-auto rounded-lg border bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-500">
            <tr>{["Candidate", "Path", "Progress", "Tasks", "On-time", "Avg PR", "Last activity", "Risk"].map((h) => <th key={h} className="px-3 py-2 font-medium">{h}</th>)}</tr>
          </thead>
          <tbody>
            {shown.length === 0 && <tr><td className="px-3 py-4 text-slate-500" colSpan={8}>No active onboardings. Publish a path and assign it to someone.</td></tr>}
            {shown.map(({ a, m }) => (
              <tr key={a.id} className="border-t">
                <td className="px-3 py-2"><Link className="text-indigo-700 underline" href={`/people/${a.id}`}>{people.get(a.userId)}</Link></td>
                <td className="px-3 py-2">{a.path.title}</td>
                <td className="px-3 py-2">{m.learning.completionPct}%</td>
                <td className="px-3 py-2">{m.tasks.done}/{m.tasks.total}</td>
                <td className="px-3 py-2">{m.tasks.onTimeRatePct ?? "-"}{m.tasks.onTimeRatePct != null && "%"}</td>
                <td className="px-3 py-2">{m.github.avgPrScore ?? "-"}</td>
                <td className="px-3 py-2 text-slate-500">{m.overall.lastActivity ? m.overall.lastActivity.slice(0, 10) : "none"}</td>
                <td className="px-3 py-2">
                  {m.overall.riskFlags.length === 0 ? <span className="text-green-700">on track</span> : (
                    <span className="text-red-700" title={m.overall.riskFlags.join("\n")}>⚠ {m.overall.riskFlags[0]}{m.overall.riskFlags.length > 1 && ` (+${m.overall.riskFlags.length - 1})`}</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Shell>
  );
}
