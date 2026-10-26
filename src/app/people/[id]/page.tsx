import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePermission } from "@/lib/auth";
import { db } from "@/lib/db";
import { computeMetrics } from "@/lib/domain/metrics";
import { Shell } from "@/components/Shell";
import { addFeedback, generateNow } from "../actions";

export default async function PersonDetail({ params }: { params: Promise<{ id: string }> }) {
  const me = await requirePermission("members:view");
  const { id } = await params;
  const a = await db.assignment.findFirst({
    where: { id, orgId: me.orgId },
    include: {
      path: { include: { sections: { orderBy: { order: "asc" }, include: { items: { orderBy: { order: "asc" } } } } } },
      tasks: { include: { task: true, prs: true } }, reports: { orderBy: { createdAt: "desc" } }, feedback: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!a) notFound();
  const user = await db.user.findUniqueOrThrow({ where: { id: a.userId } });
  const now = new Date();
  const m = await computeMetrics(a.id, a.startDate, now);
  const done = new Set((await db.progressEvent.findMany({ where: { assignmentId: a.id, type: "COMPLETED" } })).map((p) => p.itemId));
  const authors = new Map((await db.user.findMany({ where: { orgId: me.orgId } })).map((u) => [u.id, u.name]));

  // unified timeline: learning + GitHub + task status changes
  type Ev = { at: Date; text: string };
  const ev: Ev[] = [];
  const items = new Map(a.path.sections.flatMap((s) => s.items).map((i) => [i.id, i.title]));
  for (const p of await db.progressEvent.findMany({ where: { assignmentId: a.id, type: { in: ["COMPLETED", "OPENED"] } } }))
    ev.push({ at: p.ts, text: `${p.type === "COMPLETED" ? "✅ Completed" : "👀 Opened"}: ${items.get(p.itemId)}` });
  for (const g of await db.githubEvent.findMany({ where: { orgId: me.orgId, userId: a.userId } })) ev.push({ at: g.ts, text: `🐙 ${g.summary}` });
  for (const t of a.tasks) for (const h of JSON.parse(t.history) as { status: string; why: string; at: string }[]) ev.push({ at: new Date(h.at), text: `📋 ${t.task.title} → ${h.status.toLowerCase().replace(/_/g, " ")} (${h.why})` });
  ev.sort((x, y) => y.at.getTime() - x.at.getTime());
  const prs = a.tasks.flatMap((t) => t.prs);
  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <section className="mb-6"><h2 className="mb-2 font-medium">{title}</h2>{children}</section>
  );

  return (
    <Shell user={me}>
      <p className="text-xs text-slate-500"><Link className="underline" href="/dashboard">Dashboard</Link> › {user.name}</p>
      <h1 className="text-xl font-semibold">{user.name} <span className="text-sm font-normal text-slate-500">@{user.githubUsername ?? "no github"} · {a.path.title}</span></h1>
      <p className="mb-4 text-sm text-slate-600">
        Day {m.candidate.dayNumber} · readiness {m.overall.readinessScore ?? "n/a"} · {m.overall.riskFlags.length ? <span className="text-red-700">⚠ {m.overall.riskFlags.join("; ")}</span> : <span className="text-green-700">on track</span>}
      </p>

      <div className="mb-6 flex gap-2">
        {["WEEKLY", "FINAL"].map((t) => (
          <form key={t} action={generateNow}>
            <input type="hidden" name="assignmentId" value={a.id} />
            <input type="hidden" name="type" value={t} />
            <button className="rounded border bg-white px-3 py-1 text-sm">Generate {t.toLowerCase()} report</button>
          </form>
        ))}
        <Link className="rounded border bg-white px-3 py-1 text-sm" href={`/learn/${a.id}`}>Preview candidate view</Link>
      </div>

      <Section title="Learning progress">
        {a.path.sections.map((s) => (
          <div key={s.id} className="mb-1 text-sm">
            <b>{s.title}</b>: {s.items.filter((i) => done.has(i.id)).length}/{s.items.length} done
          </div>
        ))}
        <p className="text-xs text-slate-500">{m.learning.timeSpentMinutesTotal} active minutes · {m.learning.chatQuestions} AI questions this week · topics: {m.learning.topTopics.join(", ") || "none"}</p>
      </Section>

      <Section title="Tasks">
        <ul className="space-y-1 text-sm">
          {a.tasks.map((t) => (
            <li key={t.id}><Link className="text-indigo-700 underline" href={`/tasks/${t.id}`}>{t.task.title}</Link> · {t.status.toLowerCase().replace(/_/g, " ")} · due {t.dueAt.toDateString()}{t.status === "DONE" && (t.onTime ? " · on time" : " · late")}</li>
          ))}
          {a.tasks.length === 0 && <li className="text-slate-500">No tasks.</li>}
        </ul>
      </Section>

      <Section title="Pull requests">
        <ul className="space-y-1 text-sm">
          {prs.map((p) => <li key={p.id}>#{p.number} {p.title} · {p.state} · score {p.scoreOverride ?? p.qualityScore ?? "-"} · {p.reviewRounds} review round(s) · {p.conflictCount} conflict(s)</li>)}
          {prs.length === 0 && <li className="text-slate-500">No PRs yet.</li>}
        </ul>
      </Section>

      <Section title="Timeline">
        <ul className="max-h-72 space-y-1 overflow-auto text-sm">
          {ev.slice(0, 60).map((e, i) => <li key={i}><span className="text-xs text-slate-500">{e.at.toISOString().slice(0, 16).replace("T", " ")}</span> {e.text}</li>)}
          {ev.length === 0 && <li className="text-slate-500">Nothing yet.</li>}
        </ul>
      </Section>

      <Section title="Mentor feedback">
        <form action={addFeedback} className="mb-3 space-y-2 rounded-lg border bg-white p-3 text-sm">
          <input type="hidden" name="assignmentId" value={a.id} />
          <div className="flex flex-wrap gap-3">
            {[["communication", "Communication"], ["codeQuality", "Code quality"], ["ownership", "Ownership"], ["learningSpeed", "Learning speed"]].map(([k, l]) => (
              <label key={k}>{l} <select name={k} className="rounded border"><option value="">-</option>{[1, 2, 3, 4, 5].map((n) => <option key={n}>{n}</option>)}</select></label>
            ))}
          </div>
          <textarea name="notes" rows={2} placeholder="Notes" className="w-full rounded border px-2 py-1" />
          <label className="text-xs"><input type="checkbox" name="shared" /> Shared (visible to report recipients); otherwise private</label>
          <div><button className="rounded bg-indigo-600 px-3 py-1 text-white">Save feedback</button></div>
        </form>
        {a.feedback.map((f) => (
          <div key={f.id} className="mb-1 text-sm text-slate-700">
            <span className="text-xs text-slate-500">{f.createdAt.toISOString().slice(0, 10)} · {authors.get(f.authorId)} · {f.visibility.toLowerCase()}</span>{" "}
            {Object.entries(JSON.parse(f.rubric)).map(([k, v]) => `${k} ${v}/5`).join(", ")} {f.notes}
          </div>
        ))}
      </Section>

      <Section title="Reports">
        <ul className="text-sm">
          {a.reports.map((r) => <li key={r.id}><Link className="text-indigo-700 underline" href={`/reports/${r.id}`}>{r.type.toLowerCase()} report</Link> · {r.createdAt.toISOString().slice(0, 10)}</li>)}
          {a.reports.length === 0 && <li className="text-slate-500">No reports yet.</li>}
        </ul>
      </Section>
    </Shell>
  );
}
