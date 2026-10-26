import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { can } from "@/lib/rbac";
import { Shell } from "@/components/Shell";
import { overridePrScore, reviewTask, setBlocked, simulateEvent } from "../actions";

const SIM = [
  ["push", "Push first commit"], ["open", "Open PR"], ["ci_fail", "CI fails"], ["ci_pass", "CI passes"],
  ["changes", "Reviewer requests changes"], ["conflict", "Merge conflict"], ["resolve", "Resolve conflict"], ["merge", "Merge PR"],
];

export default async function TaskDetail({ params }: { params: Promise<{ id: string }> }) {
  const me = await requireUser();
  const { id } = await params;
  const isCand = me.role === "CANDIDATE";
  const ta = await db.taskAssignment.findFirst({
    where: { id, assignment: { orgId: me.orgId, ...(isCand ? { userId: me.id } : {}) } },
    include: { task: true, prs: true, assignment: true },
  });
  if (!ta) notFound();
  const person = await db.user.findUnique({ where: { id: ta.assignment.userId } });
  const acceptance: string[] = JSON.parse(ta.task.acceptance);
  const history: { status: string; why: string; at: string }[] = JSON.parse(ta.history);
  const days = Math.ceil((ta.dueAt.getTime() - Date.now()) / 86400_000);
  const manage = can(me.role, "paths:manage");
  const canReview = manage || me.role === "MENTOR";
  const simulator = (manage && process.env.NODE_ENV !== "production") || process.env.ENABLE_SIMULATOR === "true";

  return (
    <Shell user={me}>
      <p className="text-xs text-slate-500"><Link className="underline" href="/tasks">Tasks</Link> › {person?.name}</p>
      <h1 className="text-xl font-semibold">{ta.task.title}</h1>
      <p className="mb-4 text-sm text-slate-600">
        <b>{ta.status.toLowerCase().replace(/_/g, " ")}</b> · due {ta.dueAt.toDateString()}{" "}
        {ta.status !== "DONE" ? `(${days >= 0 ? `${days}d left` : `${-days}d overdue`})` : ta.onTime ? "(on time)" : "(late)"}
        {ta.task.issueNumber && <> · issue {ta.task.issueUrl ? <a className="underline" href={ta.task.issueUrl} target="_blank">#{ta.task.issueNumber}</a> : `#${ta.task.issueNumber}`}</>}
      </p>
      {ta.task.description && <p className="mb-4 whitespace-pre-wrap text-sm">{ta.task.description}</p>}
      {acceptance.length > 0 && (
        <section className="mb-4 text-sm">
          <h2 className="font-medium">Acceptance criteria</h2>
          <ul className="list-disc pl-5">{acceptance.map((a) => <li key={a}>{a}</li>)}</ul>
        </section>
      )}

      <section className="mb-4 text-sm">
        <h2 className="mb-1 font-medium">Pull requests</h2>
        {ta.prs.length === 0 && <p className="text-slate-500">No PR linked yet. Reference the issue with &quot;Closes #{ta.task.issueNumber}&quot; in your PR.</p>}
        {ta.prs.map((pr) => {
          const parts = JSON.parse(pr.qualityBreakdown) as Record<string, number>;
          const fb = pr.feedback ? (JSON.parse(pr.feedback) as { strengths: string[]; improve: string[] }) : null;
          return (
            <div key={pr.id} className="mb-2 rounded border bg-white p-3">
              <div className="flex items-center justify-between">
                <span className="font-medium">#{pr.number} {pr.title} <span className="text-xs text-slate-500">({pr.state})</span></span>
                <span className="text-lg font-semibold">{pr.scoreOverride ?? pr.qualityScore ?? "-"}<span className="text-xs text-slate-500">/100{pr.scoreOverride != null && " (overridden)"}</span></span>
              </div>
              <div className="text-xs text-slate-500">
                +{pr.additions}/-{pr.deletions} · CI {pr.ciStatus} · {pr.reviewRounds} review round(s) · {pr.conflictCount} conflict(s)
              </div>
              {Object.keys(parts).length > 0 && <div className="mt-1 text-xs">{Object.entries(parts).map(([k, v]) => `${k} ${v}`).join(" · ")}</div>}
              {fb && (
                <div className="mt-2 grid gap-2 text-xs md:grid-cols-2">
                  <div><b>Strengths</b><ul className="list-disc pl-4">{fb.strengths.map((s) => <li key={s}>{s}</li>)}</ul></div>
                  <div><b>To improve</b><ul className="list-disc pl-4">{fb.improve.map((s) => <li key={s}>{s}</li>)}</ul></div>
                </div>
              )}
              {manage && (
                <form action={overridePrScore} className="mt-2 flex items-center gap-2 text-xs">
                  <input type="hidden" name="id" value={pr.id} />
                  <input name="score" type="number" min={0} max={100} placeholder="override" className="w-20 rounded border px-1" />
                  <button className="text-indigo-700 underline">Override score</button>
                </form>
              )}
            </div>
          );
        })}
      </section>

      {isCand && ta.status !== "DONE" && (
        <form action={setBlocked} className="mb-4 flex gap-2 text-sm">
          <input type="hidden" name="id" value={ta.id} />
          {ta.status === "BLOCKED" ? (
            <button className="rounded border px-3 py-1">Unblock ({ta.blockedReason})</button>
          ) : (
            <>
              <input name="reason" placeholder="What are you blocked on?" className="flex-1 rounded border px-2 py-1" />
              <button className="rounded border px-3 py-1">Flag as blocked / request help</button>
            </>
          )}
        </form>
      )}

      {canReview && (
        <form action={reviewTask} className="mb-4 flex gap-2 text-sm">
          <input type="hidden" name="id" value={ta.id} />
          <input name="comment" placeholder="Review comment" className="flex-1 rounded border px-2 py-1" />
          <button name="verdict" value="approve" className="rounded bg-green-600 px-3 py-1 text-white">Approve</button>
          <button name="verdict" value="changes" className="rounded bg-amber-600 px-3 py-1 text-white">Request changes</button>
        </form>
      )}

      {simulator && (
        <section className="mb-4 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm">
          <h2 className="font-medium">Dev simulator: fire GitHub events for this candidate</h2>
          <p className="mb-2 text-xs text-amber-800">Uses the same processor as the real webhook. Not shown in production.</p>
          {["good", "poor"].map((q) => (
            <form key={q} action={simulateEvent} className="mb-1 flex flex-wrap gap-2">
              <input type="hidden" name="id" value={ta.id} />
              <input type="hidden" name="quality" value={q} />
              <span className="w-24 text-xs">{q} PR:</span>
              {SIM.map(([k, l]) => <button key={k} name="kind" value={k} className="rounded border bg-white px-2 py-0.5 text-xs">{l}</button>)}
            </form>
          ))}
        </section>
      )}

      {history.length > 0 && (
        <section className="text-xs text-slate-600">
          <h2 className="mb-1 text-sm font-medium text-slate-900">History</h2>
          <ul>{history.map((h, i) => <li key={i}>{h.at.slice(0, 16).replace("T", " ")} → {h.status.toLowerCase().replace(/_/g, " ")} ({h.why})</li>)}</ul>
        </section>
      )}
    </Shell>
  );
}
