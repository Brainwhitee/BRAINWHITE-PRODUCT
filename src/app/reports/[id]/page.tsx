import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePermission } from "@/lib/auth";
import { db } from "@/lib/db";
import { Shell } from "@/components/Shell";
import { PrintButton } from "@/components/PrintButton";
import type { Metrics } from "@/lib/domain/metrics";

export default async function ReportPage({ params }: { params: Promise<{ id: string }> }) {
  const me = await requirePermission("members:view");
  const { id } = await params;
  const r = await db.report.findFirst({ where: { id, orgId: me.orgId } });
  if (!r) notFound();
  const m = JSON.parse(r.metrics) as Metrics;
  const row = (k: string, v: React.ReactNode) => (
    <tr className="border-t"><td className="py-1 pr-4 text-slate-500">{k}</td><td className="py-1">{v ?? "n/a"}</td></tr>
  );
  return (
    <Shell user={me}>
      <div className="mb-4 flex items-center justify-between print:hidden">
        <Link className="text-sm underline" href={`/people/${r.assignmentId}`}>← Back to {m.candidate.name}</Link>
        <PrintButton />
      </div>
      <article className="rounded-lg border bg-white p-6 print:border-0">
        <h1 className="text-xl font-semibold">{r.type === "FINAL" ? "Final" : "Weekly"} onboarding report: {m.candidate.name}</h1>
        <p className="mb-4 text-sm text-slate-500">{m.candidate.path} · {m.period.start} to {m.period.end}</p>
        <div className="mb-6 whitespace-pre-wrap text-sm leading-6">{r.narrative}</div>
        <div className="grid gap-6 text-sm md:grid-cols-3">
          <table><tbody>
            <tr><th colSpan={2} className="text-left">Learning</th></tr>
            {row("Path completion", `${m.learning.completionPct}%`)}
            {row("Items done this period", m.learning.itemsCompletedThisPeriod.length)}
            {row("Active minutes (period)", m.learning.timeSpentMinutesPeriod)}
            {row("Schedule adherence", m.learning.scheduleAdherencePct != null ? `${m.learning.scheduleAdherencePct}%` : null)}
            {row("Must-read opened", m.learning.mustReadHandoutsOpened)}
            {row("AI questions", m.learning.chatQuestions)}
          </tbody></table>
          <table><tbody>
            <tr><th colSpan={2} className="text-left">Tasks</th></tr>
            {row("Done / total", `${m.tasks.done}/${m.tasks.total}`)}
            {row("Done of due", m.tasks.doneOfDuePct != null ? `${m.tasks.doneOfDuePct}%` : null)}
            {row("On-time rate", m.tasks.onTimeRatePct != null ? `${m.tasks.onTimeRatePct}%` : null)}
            {row("Avg cycle (hours)", m.tasks.avgCycleHours)}
            {row("Blocked (hours)", m.tasks.blockedHours)}
          </tbody></table>
          <table><tbody>
            <tr><th colSpan={2} className="text-left">GitHub</th></tr>
            {row("Commits", m.github.commits)}
            {row("PRs opened / merged", `${m.github.prsOpened} / ${m.github.prsMerged}`)}
            {row("Avg PR score", m.github.avgPrScore)}
            {row("Review rounds to merge", m.github.avgReviewRoundsToMerge)}
            {row("PRs with conflicts", m.github.conflictedPrs)}
            {row("CI first-try pass", m.github.ciFirstTryPassPct != null ? `${m.github.ciFirstTryPassPct}%` : null)}
            {row("Reviews given", m.github.reviewsGiven)}
          </tbody></table>
        </div>
        {r.type === "FINAL" && <p className="mt-6 text-sm">Readiness score: <b>{m.overall.readinessScore ?? "n/a"}</b>/100 · Mentor rubric: {m.qualitative.mentorRubricAvg ?? "n/a"}/5</p>}
        <p className="mt-6 text-xs text-slate-400">Generated {r.createdAt.toISOString().slice(0, 16).replace("T", " ")} UTC. Metrics definitions: see docs/REPORT_METRICS.md.</p>
      </article>
    </Shell>
  );
}
