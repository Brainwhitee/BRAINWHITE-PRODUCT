// Checks the boot fix (Phase 6a): on server start, syncs that have been RUNNING for too long are marked FAILED,
// while a sync that started recently (maybe a teammate's, on a shared database) is left alone.
//   npm run check:boot        (local database only: it creates and deletes two repositories)
try { (process as unknown as { loadEnvFile?: (p?: string) => void }).loadEnvFile?.(); } catch { /* no .env */ }
process.env.DISABLE_SCHEDULER = "true"; // registerNode() must not start the 15 minute timer here

async function main() {
  if (!/@(localhost|127\.0\.0\.1)[:/]/.test(process.env.DATABASE_URL ?? "")) { console.error("Refusing to run: DATABASE_URL is not a local database."); process.exit(2); }
  const { PrismaClient } = await import("@prisma/client");
  const db = new PrismaClient();
  const org = await db.organisation.findFirstOrThrow();
  const project = await db.project.findFirstOrThrow({ where: { orgId: org.id } });
  const mk = (name: string) => db.repository.create({ data: { orgId: org.id, projectId: project.id, name, source: "local", location: "x", syncStatus: "RUNNING" } });
  const stale = await mk("boot-check-stale"), live = await mk("boot-check-live");
  let ok = false;
  try {
    await db.syncRun.create({ data: { repoId: stale.id, status: "RUNNING", startedAt: new Date(Date.now() - 2 * 3600_000) } }); // 2 hours old
    await db.syncRun.create({ data: { repoId: live.id, status: "RUNNING", startedAt: new Date() } });
    const { registerNode } = await import("../src/instrumentation-node");
    await registerNode();
    const s = await db.repository.findUniqueOrThrow({ where: { id: stale.id } }), l = await db.repository.findUniqueOrThrow({ where: { id: live.id } });
    const sr = await db.syncRun.findFirstOrThrow({ where: { repoId: stale.id } }), lr = await db.syncRun.findFirstOrThrow({ where: { repoId: live.id } });
    const a = s.syncStatus === "FAILED" && sr.status === "FAILED";
    const b = l.syncStatus === "RUNNING" && lr.status === "RUNNING";
    console.log(`${a ? "PASS" : "FAIL"}  a sync RUNNING for 2 hours is marked FAILED (repo ${s.syncStatus}, run ${sr.status}: ${sr.error})`);
    console.log(`${b ? "PASS" : "FAIL"}  a sync that started just now is left RUNNING (repo ${l.syncStatus}, run ${lr.status})`);
    ok = a && b;
  } finally {
    await db.repository.deleteMany({ where: { id: { in: [stale.id, live.id] } } });
    await db.$disconnect();
  }
  console.log(ok ? "\nALL CHECKS PASSED" : "\nCHECK FAILED");
  process.exit(ok ? 0 : 1);
}
main().catch((e) => { console.error(e); process.exit(1); });
