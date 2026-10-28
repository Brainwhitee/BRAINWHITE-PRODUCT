"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requirePermission, requireUser } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { audit } from "@/lib/audit";
import { setTaskStatus, processGithubEvent } from "@/lib/domain/github";
import { createIssueForTask, parseIssueUrl } from "@/lib/domain/issues";
import { notify } from "@/lib/mailer";
import type { FormState } from "../actions";

const DAY = 86400_000;

export async function createTask(_: FormState, fd: FormData): Promise<FormState> {
  const me = await requirePermission("paths:manage");
  const p = z.object({
    title: z.string().min(3), description: z.string().optional(), pathId: z.string().optional(), repoId: z.string().optional(),
    deadlineDay: z.coerce.number().int().min(1).max(365), difficulty: z.enum(["EASY", "MEDIUM", "HARD"]),
    estHours: z.coerce.number().int().min(1).max(200), acceptance: z.string().optional(), issueUrl: z.string().optional(),
    reviewerId: z.string().optional(),
  }).safeParse(Object.fromEntries(fd));
  if (!p.success) return { error: "Check the title, deadline day and hours" };
  const d = p.data;
  const pathId = d.pathId || null;
  if (pathId && !(await db.learningPath.findFirst({ where: { id: pathId, orgId: me.orgId } }))) return { error: "Unknown path" };
  const acceptance = (d.acceptance ?? "").split("\n").map((s) => s.trim()).filter(Boolean);

  let issue: { number: number | null; url: string | null } = { number: null, url: null };
  const linked = d.issueUrl ? parseIssueUrl(d.issueUrl) : null;
  if (linked) issue = { number: linked.number, url: d.issueUrl! };
  else if (fd.get("createIssue") === "on") issue = await createIssueForTask(me.orgId, d.repoId || null, d.title, `${d.description ?? ""}\n\n${acceptance.map((a) => `- [ ] ${a}`).join("\n")}`);

  const task = await db.task.create({
    data: {
      orgId: me.orgId, pathId, title: d.title, description: d.description ?? "", repoId: d.repoId || null,
      acceptance: JSON.stringify(acceptance), deadlineDay: d.deadlineDay, difficulty: d.difficulty, estHours: d.estHours,
      reviewerId: d.reviewerId || null, issueNumber: issue.number, issueUrl: issue.url,
    },
  });
  // existing assignments of this path get the task immediately
  if (pathId) {
    for (const a of await db.assignment.findMany({ where: { pathId, status: "ACTIVE" } }))
      await db.taskAssignment.create({ data: { assignmentId: a.id, taskId: task.id, dueAt: new Date(a.startDate.getTime() + d.deadlineDay * DAY) } });
  }
  await audit(me.orgId, me.id, "task.created", task.id);
  revalidatePath("/tasks");
}

export async function setBlocked(fd: FormData) {
  const me = await requireUser();
  const ta = await db.taskAssignment.findFirst({ where: { id: String(fd.get("id")), assignment: { userId: me.id } }, include: { assignment: true, task: true } });
  if (!ta) return;
  if (ta.status === "BLOCKED") {
    await setTaskStatus(ta.id, "IN_PROGRESS", "Unblocked");
  } else {
    const reason = String(fd.get("reason") ?? "").slice(0, 500) || "Blocked";
    await db.taskAssignment.update({ where: { id: ta.id }, data: { blockedReason: reason } });
    await setTaskStatus(ta.id, "BLOCKED", reason);
    if (ta.assignment.mentorId) await notify(ta.assignment.mentorId, "Help requested", `${me.name} is blocked on "${ta.task.title}": ${reason}`);
  }
  revalidatePath(`/tasks/${ta.id}`);
}

export async function reviewTask(fd: FormData) {
  const me = await requirePermission("members:view");
  if (!can(me.role, "paths:manage") && me.role !== "MENTOR") return;
  const ta = await db.taskAssignment.findFirst({ where: { id: String(fd.get("id")), assignment: { orgId: me.orgId } } });
  const verdict = fd.get("verdict") === "approve" ? "DONE" : "CHANGES_REQUESTED";
  if (!ta) return;
  await setTaskStatus(ta.id, verdict, `Manual review by ${me.name}: ${String(fd.get("comment") ?? "")}`);
  await audit(me.orgId, me.id, "task.reviewed", `${ta.id}:${verdict}`);
  revalidatePath(`/tasks/${ta.id}`);
}

export async function overridePrScore(fd: FormData) {
  const me = await requirePermission("paths:manage");
  const v = Number(fd.get("score"));
  if (!Number.isFinite(v) || v < 0 || v > 100) return;
  await db.pullRequest.updateMany({ where: { id: String(fd.get("id")), orgId: me.orgId }, data: { scoreOverride: Math.round(v) } });
  await audit(me.orgId, me.id, "pr.score-overridden", String(fd.get("id")));
  revalidatePath("/tasks");
}

// ---- Dev simulator: fires GitHub-shaped events through the same processor as the real webhook ----
export async function simulateEvent(fd: FormData) {
  const me = await requirePermission("paths:manage");
  if (process.env.NODE_ENV === "production" && process.env.ENABLE_SIMULATOR !== "true") return;
  const ta = await db.taskAssignment.findFirst({
    where: { id: String(fd.get("id")), assignment: { orgId: me.orgId } },
    include: { assignment: { include: { } }, task: true, prs: true },
  });
  if (!ta) return;
  const user = await db.user.findUniqueOrThrow({ where: { id: ta.assignment.userId } });
  const repo = ta.task.repoId ? await db.repository.findUnique({ where: { id: ta.task.repoId } }) : await db.repository.findFirst({ where: { orgId: me.orgId } });
  const full = repo?.location.includes("/") && !/[\\:]/.test(repo.location) ? repo.location : "acme/demo-app";
  const kind = String(fd.get("kind"));
  const login = user.githubUsername ?? "candidate";
  const prNo = ta.prs[0]?.number ?? 1000 + Math.floor(Math.random() * 8000);
  const good = fd.get("quality") !== "poor";
  const pr = (extra: object, action: string) => ({
    action,
    repository: { full_name: full },
    sender: { login },
    pull_request: {
      number: prNo, title: ta.task.title, user: { login }, state: "open", merged: false, mergeable_state: "clean",
      body: good ? `Closes #${ta.task.issueNumber ?? 0}\n\nWhat: implements the task. Why: part of onboarding. How to test: run the unit tests and try the flow manually in the UI.` : "done",
      head: { ref: `task-${ta.task.issueNumber ?? 0}-work` }, additions: good ? 120 : 900, deletions: good ? 20 : 100, ...extra,
    },
    brainwhite_extra: good
      ? { files: ["src/feature.ts", "src/feature.test.ts"], commits: ["Add validation for the new endpoint", "Cover edge cases with tests"] }
      : { files: ["src/feature.ts"], commits: ["wip", "fix"] },
  });
  const run = (event: string, payload: object) => processGithubEvent(me.orgId, event, payload);

  if (kind === "push") await run("push", { ref: "refs/heads/task-work", repository: { full_name: full }, pusher: { name: login }, commits: [{ message: "Start work on the task" }] });
  if (kind === "open") await run("pull_request", pr({}, "opened"));
  if (kind === "ci_pass") await run("check_run", { repository: { full_name: full }, check_run: { conclusion: "success", pull_requests: [{ number: prNo }] } });
  if (kind === "ci_fail") await run("check_run", { repository: { full_name: full }, check_run: { conclusion: "failure", pull_requests: [{ number: prNo }] } });
  if (kind === "changes") await run("pull_request_review", { repository: { full_name: full }, pull_request: { number: prNo }, review: { state: "changes_requested", user: { login: "reviewer" } } });
  if (kind === "conflict") await run("pull_request", pr({ mergeable_state: "dirty" }, "synchronize"));
  if (kind === "resolve") await run("pull_request", pr({ mergeable_state: "clean" }, "synchronize"));
  if (kind === "merge") await run("pull_request", pr({ state: "closed", merged: true, merged_at: new Date().toISOString() }, "closed"));
  revalidatePath(`/tasks/${ta.id}`);
}
