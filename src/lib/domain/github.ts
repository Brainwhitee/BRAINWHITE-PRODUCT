import { db } from "../db";
import { notify } from "../mailer";
import { scorePr } from "./score";
import { getOrgGithubToken } from "./github-app";

type Json = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any

const log = (history: string, status: string, why: string) => {
  const h = JSON.parse(history || "[]");
  h.push({ status, why, at: new Date().toISOString() });
  return JSON.stringify(h);
};

export async function setTaskStatus(taId: string, status: string, why: string) {
  const ta = await db.taskAssignment.findUnique({ where: { id: taId }, include: { task: true, assignment: true } });
  if (!ta || ta.status === status) return;
  const data: Json = { status, history: log(ta.history, status, why) };
  if (ta.status === "BLOCKED" && ta.blockedSince) {
    data.blockedSeconds = ta.blockedSeconds + Math.round((Date.now() - ta.blockedSince.getTime()) / 1000);
    data.blockedSince = null;
  }
  if (status === "BLOCKED") data.blockedSince = new Date();
  if (status === "DONE") {
    data.completedAt = new Date();
    data.onTime = new Date() <= ta.dueAt;
  } else if (ta.status === "DONE") {
    data.completedAt = null;
    data.onTime = null;
  }
  await db.taskAssignment.update({ where: { id: taId }, data });
  await notify(ta.assignment.userId, `Task ${status.toLowerCase().replace("_", " ")}`, ta.task.title);
}

// Only linked candidates in connected repos are recorded (privacy).
async function candidateFor(orgId: string, login?: string | null) {
  if (!login) return null;
  const users = await db.user.findMany({ where: { orgId, role: "CANDIDATE", githubUsername: { not: null } } });
  return users.find((u) => u.githubUsername!.toLowerCase() === login.toLowerCase()) ?? null;
}

async function findTaskAssignment(orgId: string, userId: string, text: string, branch: string, repoFull: string) {
  const open = await db.taskAssignment.findMany({
    where: { assignment: { userId, orgId }, status: { not: "DONE" } },
    include: { task: true },
    orderBy: { dueAt: "asc" },
  });
  const n = text.match(/(?:close[sd]?|fix(?:e[sd])?|resolve[sd]?)\s+#(\d+)/i)?.[1] ?? branch.match(/(?:task|issue)[-_/]?(\d+)/i)?.[1];
  if (n) {
    const hit = open.find((t) => t.task.issueNumber === Number(n));
    if (hit) return hit;
  }
  const repo = await db.repository.findFirst({ where: { orgId, location: repoFull } });
  const same = open.filter((t) => !t.task.repoId || t.task.repoId === repo?.id);
  return same.length === 1 ? same[0] : null; // only auto-link when unambiguous; otherwise manual link
}

async function enrichFromGithub(orgId: string, repoFull: string, number: number) {
  const token = await getOrgGithubToken(orgId);
  const h: Record<string, string> = { "User-Agent": "brainwhite", Accept: "application/vnd.github+json" };
  if (token) {
    h.Authorization = `Bearer ${token}`;
  }
  try {
    const [files, commits] = await Promise.all([
      fetch(`https://api.github.com/repos/${repoFull}/pulls/${number}/files?per_page=100`, { headers: h }).then((r) => r.json()),
      fetch(`https://api.github.com/repos/${repoFull}/pulls/${number}/commits?per_page=100`, { headers: h }).then((r) => r.json()),
    ]);
    return {
      files: Array.isArray(files) ? files.map((f: Json) => f.filename as string) : [],
      commits: Array.isArray(commits) ? commits.map((c: Json) => c.commit?.message as string) : [],
    };
  } catch {
    return null;
  }
}

export async function rescore(prId: string) {
  const pr = await db.pullRequest.findUniqueOrThrow({ where: { id: prId } });
  const r = scorePr({
    additions: pr.additions, deletions: pr.deletions, body: pr.body, changedFiles: JSON.parse(pr.changedFiles),
    commitMessages: JSON.parse(pr.commitMessages), ciStatus: pr.ciStatus, ciFirstTryPass: pr.ciFirstTryPass,
    reviewRounds: pr.reviewRounds, conflictCount: pr.conflictCount,
  });
  await db.pullRequest.update({ where: { id: prId }, data: { qualityScore: r.score, qualityBreakdown: JSON.stringify(r.parts), feedback: r.feedback } });
  if (pr.authorUserId && pr.state !== "open") await notify(pr.authorUserId, "PR feedback ready", `${pr.title}: score ${r.score}/100`);
}

async function record(orgId: string, userId: string | null, repoId: string | null, type: string, summary: string, payload: Json) {
  await db.githubEvent.create({ data: { orgId, userId, repoId, type, summary, payload: JSON.stringify(payload).slice(0, 20000) } });
}

// One entry point for real webhooks and the dev simulator (ADM-16/17/19).
export async function processGithubEvent(orgId: string, event: string, p: Json): Promise<string> {
  const repoFull: string = p.repository?.full_name ?? "";
  const repo = await db.repository.findFirst({ where: { orgId, location: repoFull } });
  const sender = p.sender?.login as string | undefined;

  if (event === "pull_request" && p.pull_request) {
    const g = p.pull_request;
    const author = await candidateFor(orgId, g.user?.login);
    if (!author) return "ignored: author is not a linked candidate";
    let pr = await db.pullRequest.findUnique({ where: { repoFullName_number: { repoFullName: repoFull, number: g.number } } });
    const extra = p.brainwhite_extra ?? (await enrichFromGithub(orgId, repoFull, g.number)) ?? {};
    const files: string[] = extra.files ?? (pr ? JSON.parse(pr.changedFiles) : []);
    const commits: string[] = extra.commits ?? (pr ? JSON.parse(pr.commitMessages) : []);
    const state = g.merged ? "merged" : g.state === "closed" ? "closed" : "open";
    const dirty = g.mergeable_state === "dirty";
    const base = {
      title: g.title, body: g.body ?? "", branch: g.head?.ref ?? "", state, additions: g.additions ?? 0, deletions: g.deletions ?? 0,
      changedFiles: JSON.stringify(files), commitMessages: JSON.stringify(commits), mergedAt: g.merged_at ? new Date(g.merged_at) : null,
    };
    if (!pr) {
      const ta = await findTaskAssignment(orgId, author.id, `${g.title} ${g.body ?? ""}`, g.head?.ref ?? "", repoFull);
      pr = await db.pullRequest.create({
        data: { orgId, repoFullName: repoFull, number: g.number, authorUserId: author.id, taskAssignmentId: ta?.id ?? null, ...base,
          conflictCount: dirty ? 1 : 0, conflictSince: dirty ? new Date() : null },
      });
    } else {
      const patch: Json = { ...base };
      if (dirty && !pr.conflictSince) { patch.conflictCount = pr.conflictCount + 1; patch.conflictSince = new Date(); }
      if (!dirty && pr.conflictSince && g.mergeable_state && g.mergeable_state !== "unknown") {
        patch.conflictSeconds = pr.conflictSeconds + Math.round((Date.now() - pr.conflictSince.getTime()) / 1000);
        patch.conflictSince = null;
      }
      pr = await db.pullRequest.update({ where: { id: pr.id }, data: patch });
    }
    if (pr.taskAssignmentId) {
      if (state === "open") await setTaskStatus(pr.taskAssignmentId, pr.reviewRounds > 0 ? "CHANGES_REQUESTED" : "IN_REVIEW", `PR #${pr.number} ${p.action}`);
      if (state === "merged") await setTaskStatus(pr.taskAssignmentId, "DONE", `PR #${pr.number} merged`);
      if (state === "closed") await setTaskStatus(pr.taskAssignmentId, "IN_PROGRESS", `PR #${pr.number} closed without merge`);
    }
    await rescore(pr.id);
    await record(orgId, author.id, repo?.id ?? null, "pull_request", `PR #${g.number} ${p.action}: ${g.title}`, { action: p.action, number: g.number });
    return `ok: PR #${g.number} ${p.action}`;
  }

  if (event === "pull_request_review" && p.pull_request) {
    const pr = await db.pullRequest.findUnique({ where: { repoFullName_number: { repoFullName: repoFull, number: p.pull_request.number } } });
    const reviewer = await candidateFor(orgId, p.review?.user?.login);
    if (reviewer) await record(orgId, reviewer.id, repo?.id ?? null, "review_given", `Reviewed PR #${p.pull_request.number}`, {});
    if (!pr) return "ignored: unknown PR";
    if (p.review?.state?.toLowerCase() === "changes_requested") {
      await db.pullRequest.update({ where: { id: pr.id }, data: { reviewRounds: { increment: 1 } } });
      if (pr.taskAssignmentId) await setTaskStatus(pr.taskAssignmentId, "CHANGES_REQUESTED", "Reviewer requested changes");
      await rescore(pr.id);
      if (pr.authorUserId) await notify(pr.authorUserId, "Changes requested", pr.title);
    }
    await record(orgId, pr.authorUserId, repo?.id ?? null, "pull_request_review", `Review ${p.review?.state} on #${pr.number}`, {});
    return "ok: review";
  }

  if (event === "check_run" && p.check_run) {
    const num = p.check_run.pull_requests?.[0]?.number;
    const pr = num && (await db.pullRequest.findUnique({ where: { repoFullName_number: { repoFullName: repoFull, number: num } } }));
    if (!pr) return "ignored: no PR";
    const c = p.check_run.conclusion;
    if (c) {
      const status = c === "success" ? "success" : "failure";
      await db.pullRequest.update({ where: { id: pr.id }, data: { ciStatus: status, ciFirstTryPass: pr.ciFirstTryPass ?? status === "success" } });
      await rescore(pr.id);
      await record(orgId, pr.authorUserId, repo?.id ?? null, "check_run", `CI ${status} on #${pr.number}`, {});
    }
    return "ok: ci";
  }

  if (event === "push") {
    const user = await candidateFor(orgId, p.pusher?.name ?? sender);
    if (!user) return "ignored: not a linked candidate";
    const commits: Json[] = p.commits ?? [];
    const branch = String(p.ref ?? "").replace("refs/heads/", "");
    await record(orgId, user.id, repo?.id ?? null, "push", `${commits.length} commit(s) to ${branch}`, { messages: commits.map((c) => c.message) });
    const ta = await findTaskAssignment(orgId, user.id, commits.map((c) => c.message).join(" "), branch, repoFull);
    if (ta?.status === "NOT_STARTED") await setTaskStatus(ta.id, "IN_PROGRESS", "First commit pushed");
    return "ok: push";
  }

  if (event === "issues" && p.issue) {
    const task = await db.task.findFirst({ where: { orgId, issueNumber: p.issue.number } });
    if (!task) return "ignored: unknown issue";
    const tas = await db.taskAssignment.findMany({ where: { taskId: task.id } });
    for (const t of tas) {
      if (p.action === "closed") await setTaskStatus(t.id, "DONE", `Issue #${p.issue.number} closed`);
      if (p.action === "reopened") await setTaskStatus(t.id, "IN_PROGRESS", `Issue #${p.issue.number} reopened`);
    }
    return "ok: issue";
  }
  return `ignored: ${event}`;
}
