import { db } from "../db";
import { notify, sendEmail } from "../mailer";

const DAY = 24 * 60 * 60 * 1000;

// Resolves relative deadlines ("Day N") from the candidate start date and creates the task board (ADM-13).
export async function createAssignment(opts: {
  orgId: string;
  userId: string;
  pathId: string;
  startDate: Date;
  mentorId?: string | null;
  assignerName: string;
  message?: string;
}) {
  const path = await db.learningPath.findUniqueOrThrow({ where: { id: opts.pathId }, include: { tasks: true, org: true } });
  const user = await db.user.findUniqueOrThrow({ where: { id: opts.userId } });
  const existing = await db.assignment.findFirst({ where: { userId: opts.userId, pathId: opts.pathId, status: "ACTIVE" } });
  if (existing) return existing;

  const a = await db.assignment.create({
    data: {
      orgId: opts.orgId, userId: opts.userId, pathId: path.id, pathVersion: path.version,
      startDate: opts.startDate, mentorId: opts.mentorId ?? null,
    },
  });
  for (const t of path.tasks)
    await db.taskAssignment.create({
      data: { assignmentId: a.id, taskId: t.id, dueAt: new Date(opts.startDate.getTime() + t.deadlineDay * DAY) },
    });

  await sendEmail(
    opts.orgId, user.email, `New learning path: ${path.title}`,
    `${opts.assignerName} assigned you "${path.title}", starting ${opts.startDate.toDateString()}.\n${opts.message ?? ""}\n\nOpen: ${process.env.APP_URL}/learn`,
  );
  await notify(user.id, "New learning path assigned", path.title);
  if (opts.mentorId) await notify(opts.mentorId, "You are mentoring a new joiner", `${user.name}: ${path.title}`);
  return a;
}

export async function assignmentProgress(assignmentId: string) {
  const a = await db.assignment.findUniqueOrThrow({
    where: { id: assignmentId },
    include: { path: { include: { sections: { include: { items: true } } } }, progress: true },
  });
  const items = a.path.sections.flatMap((s) => s.items);
  const mandatory = items.filter((i) => i.mandatory);
  const done = new Set(a.progress.filter((p) => p.type === "COMPLETED").map((p) => p.itemId));
  const total = mandatory.length;
  const completed = mandatory.filter((i) => done.has(i.id)).length;
  return { items, done, total, completed, pct: total ? Math.round((completed / total) * 100) : 0 };
}
