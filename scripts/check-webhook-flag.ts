// Checks that a push webhook only starts a sync when AUTO_SYNC_ON_PUSH=true (Phase 6b is opt-in, so deploying it is safe).
//   npm run check:webhook      (local database only; makes no real GitHub call)
// It calls the real route handler with a push payload for a throw-away repository. With the flag on, the scheduled sync
// is pointed at a closed local port, so it fails fast instead of reaching GitHub; we only assert that a run was started.
import { NextRequest } from "next/server";
try { (process as unknown as { loadEnvFile?: (p?: string) => void }).loadEnvFile?.(); } catch { /* no .env */ }

async function main() {
  if (!/@(localhost|127\.0\.0\.1)[:/]/.test(process.env.DATABASE_URL ?? "")) { console.error("Refusing to run: DATABASE_URL is not a local database."); process.exit(2); }
  delete process.env.GITHUB_WEBHOOK_SECRET; // this direct call carries no signature
  process.env.GITHUB_CODELOAD_BASE = "http://127.0.0.1:9"; // closed port: the full-sync fallback can never reach the internet
  const { PrismaClient } = await import("@prisma/client");
  const db = new PrismaClient();
  const { POST } = await import("../src/app/api/github/webhook/route");
  const org = await db.organisation.findFirstOrThrow();
  const project = await db.project.findFirstOrThrow({ where: { orgId: org.id } });
  const location = `check/flag-${Date.now()}`;
  const repo = await db.repository.create({ data: { orgId: org.id, projectId: project.id, name: "webhook-check", source: "github", location, branch: "main", lastSyncedSha: "aaa", syncStatus: "HEALTHY" } });
  const push = async () => {
    const body = JSON.stringify({ ref: "refs/heads/main", before: "aaa", after: "bbb", repository: { full_name: location }, pusher: { name: "nobody" }, commits: [{ id: "bbb", message: "x", modified: ["src/a.ts"] }] });
    const res = await POST(new NextRequest("http://localhost/api/github/webhook", { method: "POST", headers: { "x-github-event": "push", "content-type": "application/json" }, body }));
    return ((await res.json()) as { results: string[] }).results;
  };
  let failures = 0;
  const check = (name: string, ok: boolean, detail = "") => { console.log(`${ok ? "PASS" : "FAIL"}  ${name}${ok ? "" : "  -> " + detail}`); if (!ok) failures++; };
  try {
    for (const value of [undefined, "false"]) {
      if (value === undefined) delete process.env.AUTO_SYNC_ON_PUSH; else process.env.AUTO_SYNC_ON_PUSH = value;
      const r = await push();
      await new Promise((x) => setTimeout(x, 1500));
      const runs = await db.syncRun.count({ where: { repoId: repo.id } });
      check(`AUTO_SYNC_ON_PUSH ${value === undefined ? "unset" : `"${value}"`}: no sync is scheduled and nothing is written`, !r.includes("sync: scheduled") && runs === 0, `results=${JSON.stringify(r)} runs=${runs}`);
    }
    process.env.AUTO_SYNC_ON_PUSH = "true";
    const r = await push();
    check('AUTO_SYNC_ON_PUSH "true": the push schedules a sync', r.includes("sync: scheduled"), JSON.stringify(r));
    let runs = 0;
    for (let i = 0; i < 30 && runs === 0; i++) { await new Promise((x) => setTimeout(x, 1000)); runs = await db.syncRun.count({ where: { repoId: repo.id } }); }
    check("...and a SyncRun is recorded for it", runs > 0, "no run appeared");
    // wait for the background run to end before deleting its repository (it fails fast: closed port)
    for (let i = 0; i < 40; i++) { if (!(await db.syncRun.count({ where: { repoId: repo.id, status: "RUNNING" } }))) break; await new Promise((x) => setTimeout(x, 1000)); }
    const other = await POST(new NextRequest("http://localhost/api/github/webhook", { method: "POST", headers: { "x-github-event": "push", "content-type": "application/json" }, body: JSON.stringify({ ref: "refs/heads/some-other-branch", before: "aaa", after: "bbb", repository: { full_name: location }, commits: [{ modified: ["src/a.ts"] }] }) }));
    check("a push to a branch the repository does not track schedules nothing", !((await other.json()) as { results: string[] }).results.includes("sync: scheduled"));
  } finally {
    await new Promise((x) => setTimeout(x, 1500));
    await db.repository.deleteMany({ where: { id: repo.id } });
    await db.$disconnect();
  }
  console.log(failures === 0 ? "\nALL CHECKS PASSED" : `\n${failures} CHECK(S) FAILED`);
  process.exit(failures === 0 ? 0 : 1);
}
main().catch((e) => { console.error(e); process.exit(1); });
