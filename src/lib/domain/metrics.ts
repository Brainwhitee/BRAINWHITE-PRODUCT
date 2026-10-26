import { db } from "../db";
import { tokenize } from "./retrieve";

const DAY = 86400_000;
const avg = (xs: number[]) => (xs.length ? Math.round(xs.reduce((a, b) => a + b, 0) / xs.length) : null);
const pct = (a: number, b: number) => (b ? Math.round((a / b) * 100) : null);

export type Metrics = Awaited<ReturnType<typeof computeMetrics>>;

// Every number in a report comes from here (see "Report Metrics" sheet). Narratives may only restate these facts.
export async function computeMetrics(assignmentId: string, start: Date, end: Date) {
  const a = await db.assignment.findUniqueOrThrow({
    where: { id: assignmentId },
    include: {
      path: { include: { sections: { include: { items: true } }, handouts: true } },
      progress: true,
      tasks: { include: { task: true, prs: true } },
      feedback: true,
    },
  });
  const user = await db.user.findUniqueOrThrow({ where: { id: a.userId } });
  const inPeriod = (d: Date | null | undefined) => !!d && d >= start && d <= end;
  const items = a.path.sections.flatMap((s) => s.items.map((i) => ({ ...i, section: s.title })));
  const byId = new Map(items.map((i) => [i.id, i]));

  // ---- learning ----
  const completed = new Map<string, Date>();
  for (const p of a.progress.filter((x) => x.type === "COMPLETED")) completed.set(p.itemId, p.ts);
  const mandatory = items.filter((i) => i.mandatory);
  const completionPct = pct(mandatory.filter((i) => completed.has(i.id)).length, mandatory.length) ?? 0;
  const doneThisPeriod = items.filter((i) => inPeriod(completed.get(i.id)));
  const timeSec = (from?: Date) => a.progress.filter((p) => p.type === "TIME" && (!from || p.ts >= from) && p.ts <= end).reduce((n, p) => n + p.value, 0);
  const elapsedDays = Math.floor((end.getTime() - a.startDate.getTime()) / DAY);
  const dueSoFar = items.filter((i) => i.dueDay != null && i.dueDay <= elapsedDays);
  const onSchedule = dueSoFar.filter((i) => {
    const c = completed.get(i.id);
    return c && c.getTime() <= a.startDate.getTime() + (i.dueDay! + 1) * DAY;
  });
  const mustRead = a.path.handouts.filter((h) => h.mustRead);
  const opened = new Set(a.progress.filter((p) => p.type.startsWith("HANDOUT:")).map((p) => p.type.slice(8)));
  const questions = await db.chatMessage.findMany({ where: { userId: a.userId, role: "user", ts: { gte: start, lte: end } } });
  const topicCount = new Map<string, number>();
  for (const q of questions) for (const t of tokenize(q.content)) topicCount.set(t, (topicCount.get(t) ?? 0) + 1);
  const perItem = new Map<string, number>();
  for (const q of questions) perItem.set(q.itemId, (perItem.get(q.itemId) ?? 0) + 1);
  const confusing = [...perItem.entries()].sort((x, y) => y[1] - x[1]).slice(0, 3).map(([id, n]) => ({ item: byId.get(id)?.title ?? "?", questions: n }));

  // ---- tasks ----
  const tasks = a.tasks;
  const dueByNow = tasks.filter((t) => t.dueAt <= end);
  const done = tasks.filter((t) => t.status === "DONE");
  const doneByEnd = done.filter((t) => t.completedAt && t.completedAt <= end);
  const blocked = tasks.reduce((n, t) => n + t.blockedSeconds + (t.blockedSince ? Math.round((end.getTime() - t.blockedSince.getTime()) / 1000) : 0), 0);
  const cycle = done.flatMap((t) => {
    const h: { status: string; at: string }[] = JSON.parse(t.history);
    const s = h.find((x) => x.status === "IN_PROGRESS" || x.status === "IN_REVIEW");
    return s && t.completedAt ? [(t.completedAt.getTime() - new Date(s.at).getTime()) / 3600_000] : [];
  });

  // ---- github ----
  const events = await db.githubEvent.findMany({ where: { orgId: a.orgId, userId: a.userId, ts: { gte: start, lte: end } } });
  const commitCount = events.filter((e) => e.type === "push").reduce((n, e) => n + (JSON.parse(e.payload).messages?.length ?? 1), 0);
  const prs = await db.pullRequest.findMany({ where: { orgId: a.orgId, authorUserId: a.userId } });
  const prsPeriod = prs.filter((p) => inPeriod(p.openedAt) || inPeriod(p.mergedAt));
  const scored = prs.filter((p) => (p.scoreOverride ?? p.qualityScore) != null).sort((x, y) => x.openedAt.getTime() - y.openedAt.getTime());
  const scores = scored.map((p) => p.scoreOverride ?? p.qualityScore!);
  const half = Math.floor(scores.length / 2);
  const sub: Record<string, number[]> = {};
  for (const p of scored) for (const [k, v] of Object.entries(JSON.parse(p.qualityBreakdown) as Record<string, number>)) (sub[k] ??= []).push(v);
  const merged = prs.filter((p) => p.state === "merged");
  const conflicted = prs.filter((p) => p.conflictCount > 0);
  const ci = prs.filter((p) => p.ciFirstTryPass != null);

  // ---- qualitative ----
  const rubrics = a.feedback.map((f) => JSON.parse(f.rubric) as Record<string, number>);
  const rubricVals = rubrics.flatMap((r) => Object.values(r).filter((v) => typeof v === "number"));
  const mentorAvg = rubricVals.length ? Math.round((rubricVals.reduce((x, y) => x + y, 0) / rubricVals.length) * 10) / 10 : null;

  // ---- overall ----
  const tasksPct = pct(done.length, tasks.length);
  const prAvg = avg(scores);
  const comps: [string, number | null, number][] = [
    ["tasks", tasksPct, 0.35], ["prQuality", prAvg, 0.25], ["learning", completionPct, 0.25],
    ["mentor", mentorAvg != null ? Math.round(mentorAvg * 20) : null, 0.15],
  ];
  const present = comps.filter(([, v]) => v != null) as [string, number, number][];
  const wsum = present.reduce((n, [, , w]) => n + w, 0);
  const readiness = wsum ? Math.round(present.reduce((n, [, v, w]) => n + v * w, 0) / wsum) : null;

  const lastActivity = [
    ...a.progress.map((p) => p.ts), ...events.map((e) => e.ts),
    ...(await db.githubEvent.findMany({ where: { orgId: a.orgId, userId: a.userId }, orderBy: { ts: "desc" }, take: 1 })).map((e) => e.ts),
  ].sort((x, y) => y.getTime() - x.getTime())[0] ?? null;

  const risks: string[] = [];
  const idleDays = lastActivity ? (end.getTime() - lastActivity.getTime()) / DAY : elapsedDays;
  if (elapsedDays >= 3 && idleDays > 3) risks.push(`No activity for ${Math.floor(idleDays)} days`);
  const adherence = pct(onSchedule.length, dueSoFar.length);
  if (adherence != null && adherence < 80) risks.push(`${100 - adherence}% of items due so far are behind schedule`);
  if (prAvg != null && prAvg < 50) risks.push(`Average PR score is ${prAvg}/100`);
  const overdue = tasks.filter((t) => t.status !== "DONE" && t.dueAt < end);
  if (overdue.length) risks.push(`${overdue.length} task(s) overdue`);

  return {
    candidate: { name: user.name, github: user.githubUsername, path: a.path.title, startDate: a.startDate.toISOString().slice(0, 10), dayNumber: elapsedDays + 1 },
    period: { start: start.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10) },
    learning: {
      completionPct,
      itemsCompletedThisPeriod: doneThisPeriod.map((i) => `${i.section}: ${i.title}`),
      timeSpentMinutesPeriod: Math.round(timeSec(start) / 60),
      timeSpentMinutesTotal: Math.round(timeSec() / 60),
      scheduleAdherencePct: adherence,
      quizAveragePct: null as number | null, // quizzes are a V1 feature
      mustReadHandoutsOpened: `${mustRead.filter((h) => opened.has(h.id)).length}/${mustRead.length}`,
      chatQuestions: questions.length,
      topTopics: [...topicCount.entries()].sort((x, y) => y[1] - x[1]).slice(0, 5).map(([t]) => t),
      mostQuestionedItems: confusing,
    },
    tasks: {
      total: tasks.length, done: done.length, dueByNow: dueByNow.length, doneOfDuePct: pct(dueByNow.filter((t) => t.status === "DONE").length, dueByNow.length),
      completedThisPeriod: doneByEnd.filter((t) => inPeriod(t.completedAt)).map((t) => t.task.title),
      onTimeRatePct: pct(done.filter((t) => t.onTime).length, done.length),
      avgCycleHours: avg(cycle), blockedHours: Math.round((blocked / 3600) * 10) / 10,
      overdue: overdue.map((t) => t.task.title),
    },
    github: {
      commits: commitCount,
      prsOpened: prsPeriod.filter((p) => inPeriod(p.openedAt)).length, prsMerged: prsPeriod.filter((p) => p.state === "merged").length,
      prsClosed: prsPeriod.filter((p) => p.state === "closed").length,
      avgPrScore: prAvg, prScoreTrend: scores.length >= 2 ? (avg(scores.slice(half)) ?? 0) - (avg(scores.slice(0, half)) ?? 0) : null,
      subScores: Object.fromEntries(Object.entries(sub).map(([k, v]) => [k, avg(v)])),
      avgReviewRoundsToMerge: merged.length ? Math.round((merged.reduce((n, p) => n + p.reviewRounds, 0) / merged.length) * 10) / 10 : null,
      conflictedPrs: conflicted.length,
      avgConflictResolveMinutes: conflicted.length ? Math.round(conflicted.reduce((n, p) => n + p.conflictSeconds, 0) / conflicted.length / 60) : null,
      ciFirstTryPassPct: pct(ci.filter((p) => p.ciFirstTryPass).length, ci.length),
      reviewsGiven: events.filter((e) => e.type === "review_given").length,
    },
    qualitative: { mentorRubricAvg: mentorAvg, mentorNotes: a.feedback.slice(-3).map((f) => f.notes).filter(Boolean) },
    overall: { readinessScore: readiness, riskFlags: risks, lastActivity: lastActivity?.toISOString() ?? null },
  };
}
