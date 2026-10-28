import { db } from "../db";
import { notify, sendEmail } from "../mailer";
import { computeMetrics, type Metrics } from "./metrics";
import { callAi, isAiConfigured } from "../ai";

const DAY = 86400_000;
const n = (v: number | null | undefined, unit = "") => (v == null ? "n/a" : `${v}${unit}`);

// Deterministic narrative: every sentence is a template over computed metrics (AI-06: no invented numbers).
export function templateNarrative(m: Metrics, type: "WEEKLY" | "FINAL"): string {
  const L = m.learning, T = m.tasks, G = m.github;
  const strengths: string[] = [];
  const concerns: string[] = [];
  if (L.completionPct >= 60) strengths.push(`${L.completionPct}% of the mandatory learning path is complete`);
  if (T.onTimeRatePct != null && T.onTimeRatePct >= 80) strengths.push(`${T.onTimeRatePct}% of finished tasks were on time`);
  if (G.avgPrScore != null && G.avgPrScore >= 75) strengths.push(`pull requests average ${G.avgPrScore}/100`);
  if ((G.prScoreTrend ?? 0) > 5) strengths.push("PR quality is trending up");
  if (L.scheduleAdherencePct != null && L.scheduleAdherencePct >= 80) strengths.push(`${L.scheduleAdherencePct}% schedule adherence`);
  for (const r of m.overall.riskFlags) concerns.push(r);
  if (G.conflictedPrs > 0) concerns.push(`${G.conflictedPrs} PR(s) hit merge conflicts`);
  if (T.blockedHours > 0) concerns.push(`${T.blockedHours}h spent blocked on tasks`);
  if (G.avgPrScore != null && G.avgPrScore < 75) {
    const weakest = Object.entries(G.subScores).filter(([, v]) => v != null).sort((a, b) => (a[1] as number) - (b[1] as number))[0];
    if (weakest) concerns.push(`weakest PR area is ${weakest[0]} (${weakest[1]}/100)`);
  }

  const lines = [
    `${m.candidate.name} is on day ${m.candidate.dayNumber} of "${m.candidate.path}". Period ${m.period.start} to ${m.period.end}.`,
    `Learning: ${L.completionPct}% of the mandatory path complete; ${L.itemsCompletedThisPeriod.length} item(s) finished this period; ${L.timeSpentMinutesPeriod} active minutes this period (${L.timeSpentMinutesTotal} in total); schedule adherence ${n(L.scheduleAdherencePct, "%")}; must-read handouts opened ${L.mustReadHandoutsOpened}.`,
    `Tasks: ${T.done}/${T.total} done; ${n(T.doneOfDuePct, "%")} of tasks due so far are done; on-time rate ${n(T.onTimeRatePct, "%")}.`,
    `GitHub: ${G.commits} commit(s), ${G.prsOpened} PR(s) opened, ${G.prsMerged} merged; average PR score ${n(G.avgPrScore)}/100; ${G.conflictedPrs} PR(s) with merge conflicts.`,
    strengths.length ? `Strengths: ${strengths.join("; ")}.` : "Strengths: not enough data yet.",
    concerns.length ? `Concerns: ${concerns.join("; ")}.` : "Concerns: none flagged.",
  ];
  if (L.mostQuestionedItems.length)
    lines.push(`Most questions asked about: ${L.mostQuestionedItems.map((i) => `${i.item} (${i.questions})`).join(", ")}.`);
  if (type === "WEEKLY") {
    const focus = T.overdue.length ? `finish the overdue task(s): ${T.overdue.join(", ")}` : L.completionPct < 100 ? "keep progressing through the next learning items" : "start the next assigned task";
    lines.push(`Recommended focus next week: ${focus}.`);
  } else {
    const ready = (m.overall.readinessScore ?? 0) >= 75 && m.overall.riskFlags.length === 0;
    lines.push(`Overall readiness score: ${n(m.overall.readinessScore)}/100. Recommendation: ${ready ? "READY" : "NEEDS MORE TIME"}${ready ? "." : concerns.length ? ` — focus areas: ${concerns.join("; ")}.` : "."}`);
    if (m.qualitative.mentorRubricAvg != null) lines.push(`Mentor rubric average: ${m.qualitative.mentorRubricAvg}/5.`);
  }
  return lines.join("\n\n");
}

// If an LLM rewrites the narrative, reject it unless every number it states already exists in the facts.
export function numbersGrounded(text: string, facts: string) {
  const allowed = new Set(facts.match(/\d+(?:\.\d+)?/g) ?? []);
  return (text.match(/\d+(?:\.\d+)?/g) ?? []).every((x) => allowed.has(x));
}

async function llmNarrative(m: Metrics, base: string): Promise<string | null> {
  if (!isAiConfigured()) return null;
  const facts = JSON.stringify(m);
  try {
    const { text } = await callAi({
      task: "report",
      messages: [
        {
          role: "system",
          content:
            "You write concise, constructive onboarding progress reports for managers. Use ONLY the numbers and facts in the JSON. Never invent or compute new numbers. Plain paragraphs, no markdown.",
        },
        {
          role: "user",
          content: `Facts JSON:\n${facts}\n\nDraft to improve (keep all facts accurate):\n${base}`,
        },
      ],
      maxTokens: 900,
      temperature: 0.1,
    });
    return text && numbersGrounded(text, facts + base) ? text.trim() : null;
  } catch {
    return null;
  }
}

export async function generateReport(assignmentId: string, type: "WEEKLY" | "FINAL") {
  const a = await db.assignment.findUniqueOrThrow({ where: { id: assignmentId }, include: { path: true } });
  const end = new Date();
  const start = type === "FINAL" ? a.startDate : new Date(end.getTime() - 7 * DAY);
  const m = await computeMetrics(assignmentId, start, end);
  const base = templateNarrative(m, type);
  const narrative = (await llmNarrative(m, base)) ?? base;
  const report = await db.report.create({
    data: { orgId: a.orgId, assignmentId, type, periodStart: start, periodEnd: end, metrics: JSON.stringify(m), narrative },
  });
  const recipients = new Set([a.mentorId, a.path.createdBy].filter(Boolean) as string[]);
  for (const id of recipients) {
    const u = await db.user.findUnique({ where: { id } });
    if (!u) continue;
    await sendEmail(a.orgId, u.email, `${type === "FINAL" ? "Final" : "Weekly"} onboarding report: ${m.candidate.name}`, `${narrative}\n\nFull report: ${process.env.APP_URL}/reports/${report.id}`);
    await notify(id, `${type === "FINAL" ? "Final" : "Weekly"} report ready`, m.candidate.name);
  }
  await db.report.update({ where: { id: report.id }, data: { sentAt: new Date() } });
  return report;
}

// Scheduled work: deadline reminders/alerts (ADM-20), weekly reports (ADM-24), final reports (ADM-25).
export async function runJobs() {
  const now = new Date();
  const out = { reminders: 0, overdue: 0, weekly: 0, final: 0 };

  const open = await db.taskAssignment.findMany({
    where: { status: { not: "DONE" } },
    include: { task: true, assignment: { include: { path: true } } },
  });
  for (const t of open) {
    const left = t.dueAt.getTime() - now.getTime();
    const cand = await db.user.findUnique({ where: { id: t.assignment.userId } });
    if (!cand) continue;
    if (left > 0 && left <= DAY && !t.reminderSent) {
      await sendEmail(t.assignment.orgId, cand.email, `Reminder: "${t.task.title}" is due within 24h`, `Due ${t.dueAt.toString()}\n${process.env.APP_URL}/tasks/${t.id}`);
      await notify(cand.id, "Task due within 24h", t.task.title);
      await db.taskAssignment.update({ where: { id: t.id }, data: { reminderSent: true } });
      out.reminders++;
    }
    if (left < 0 && !t.overdueAlerted) {
      for (const id of new Set([t.assignment.mentorId, t.assignment.path.createdBy].filter(Boolean) as string[]))
        await notify(id, "Task overdue", `${cand.name}: ${t.task.title}`);
      await db.taskAssignment.update({ where: { id: t.id }, data: { overdueAlerted: true } });
      out.overdue++;
    }
  }

  const active = await db.assignment.findMany({ where: { status: "ACTIVE" }, include: { reports: true } });
  for (const a of active) {
    const last = a.reports.filter((r) => r.type === "WEEKLY").sort((x, y) => y.createdAt.getTime() - x.createdAt.getTime())[0];
    const since = last ? last.createdAt : a.startDate;
    if (a.startDate <= now && now.getTime() - since.getTime() >= 7 * DAY) {
      await generateReport(a.id, "WEEKLY");
      out.weekly++;
    }
  }
  const completed = await db.assignment.findMany({ where: { status: "COMPLETED", reports: { none: { type: "FINAL" } } } });
  for (const a of completed) {
    await generateReport(a.id, "FINAL");
    out.final++;
  }
  return out;
}
