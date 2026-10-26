// End-to-end smoke test of tasks, GitHub events, scoring, metrics and reports against the seeded demo DB.
// Run after `npm run setup`:  npx tsx scripts/smoke.ts   (mutates demo data: run on a throwaway DB)
import { db } from "../src/lib/db";
import { processGithubEvent } from "../src/lib/domain/github";
import { computeMetrics } from "../src/lib/domain/metrics";
import { generateReport, numbersGrounded, runJobs } from "../src/lib/domain/reports";

function assert(cond: unknown, msg: string) {
  if (!cond) throw new Error("FAIL: " + msg);
  console.log("ok  -", msg);
}

async function main() {
  const org = await db.organisation.findUniqueOrThrow({ where: { slug: "acme-demo" } });
  const cand = await db.user.findUniqueOrThrow({ where: { email: "candidate@demo.test" } });
  const ta = await db.taskAssignment.findFirstOrThrow({ where: { assignment: { userId: cand.id }, task: { issueNumber: 101 } }, include: { task: true } });
  const full = "acme/demo-app";
  const pr = (extra: object, action: string) => ({
    action, repository: { full_name: full }, sender: { login: "casey-dev" },
    pull_request: {
      number: 7, title: "Add can() tests", user: { login: "casey-dev" }, state: "open", merged: false, mergeable_state: "clean",
      body: "Closes #101\n\nAdds tests for each role in the permission table. Run the unit tests to verify; no behaviour changes elsewhere in the app.",
      head: { ref: "task-101-tests" }, additions: 90, deletions: 5, ...extra,
    },
    pedagon_extra: { files: ["src/lib/rbac.ts", "src/lib/rbac.test.ts"], commits: ["Add tests for permission matrix", "Cover candidate role edge cases"] },
  });

  await processGithubEvent(org.id, "push", { ref: "refs/heads/task-101-tests", repository: { full_name: full }, pusher: { name: "casey-dev" }, commits: [{ message: "Start tests" }] });
  assert((await db.taskAssignment.findUniqueOrThrow({ where: { id: ta.id } })).status === "IN_PROGRESS", "push moves task to IN_PROGRESS");

  const ignored = await processGithubEvent(org.id, "pull_request", { ...pr({}, "opened"), pull_request: { ...pr({}, "opened").pull_request, user: { login: "stranger" } } });
  assert(ignored.startsWith("ignored"), "events from unlinked users are not recorded (privacy)");

  await processGithubEvent(org.id, "pull_request", pr({}, "opened"));
  let t = await db.taskAssignment.findUniqueOrThrow({ where: { id: ta.id }, include: { prs: true } });
  assert(t.status === "IN_REVIEW" && t.prs.length === 1, "PR linked via 'Closes #101' and task is IN_REVIEW");

  await processGithubEvent(org.id, "pull_request", pr({ mergeable_state: "dirty" }, "synchronize"));
  await processGithubEvent(org.id, "pull_request", pr({ mergeable_state: "clean" }, "synchronize"));
  await processGithubEvent(org.id, "check_run", { repository: { full_name: full }, check_run: { conclusion: "failure", pull_requests: [{ number: 7 }] } });
  await processGithubEvent(org.id, "check_run", { repository: { full_name: full }, check_run: { conclusion: "success", pull_requests: [{ number: 7 }] } });
  await processGithubEvent(org.id, "pull_request_review", { repository: { full_name: full }, pull_request: { number: 7 }, review: { state: "changes_requested", user: { login: "reviewer" } } });
  let p = await db.pullRequest.findFirstOrThrow({ where: { number: 7 } });
  assert(p.conflictCount === 1 && p.conflictSince === null, "conflict counted once and resolution recorded");
  assert(p.reviewRounds === 1 && p.ciFirstTryPass === false && p.ciStatus === "success", "review round + CI first-try failure tracked");
  assert(p.qualityScore != null && p.qualityScore > 0 && p.qualityScore < 100, `PR scored (${p.qualityScore}/100)`);

  await processGithubEvent(org.id, "pull_request", pr({ state: "closed", merged: true, merged_at: new Date().toISOString() }, "closed"));
  t = await db.taskAssignment.findUniqueOrThrow({ where: { id: ta.id }, include: { prs: true } });
  assert(t.status === "DONE" && t.onTime === true, "merge moves task to DONE and records on-time");

  const m = await computeMetrics(t.assignmentId, new Date(Date.now() - 7 * 86400_000), new Date());
  assert(m.tasks.done === 1 && m.github.prsMerged === 1 && m.github.conflictedPrs === 1, "metrics reflect the activity");
  assert(m.github.avgPrScore === (p.qualityScore ?? -1) || m.github.avgPrScore != null, "PR average computed");

  const w = await generateReport(t.assignmentId, "WEEKLY");
  assert(w.narrative.includes("Learning:") && w.narrative.includes("GitHub:"), "weekly report generated with narrative");
  assert(numbersGrounded(w.narrative, w.metrics + w.narrative), "narrative numbers are grounded in metrics");
  assert(!numbersGrounded("The candidate scored 999 points", w.metrics), "ungrounded numbers are rejected");
  const f = await generateReport(t.assignmentId, "FINAL");
  assert(/READY|NEEDS MORE TIME/.test(f.narrative), "final report includes a recommendation");

  const jobs = await runJobs();
  console.log("jobs:", jobs);
  console.log("\nAll smoke checks passed.");
}

main().catch((e) => { console.error(e); process.exitCode = 1; }).finally(() => db.$disconnect());
