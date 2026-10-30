// Node-only startup work. Kept out of instrumentation.ts so the edge bundle never sees fs/crypto/prisma imports.
import { STALE_SYNC_MS } from "./lib/analyser/constants";

// In-process scheduler (PLT-08 MVP). Runs deadline checks and report generation every 15 minutes.
// Replace with a real queue (BullMQ/Temporal) when you need multiple instances.
export async function registerNode() {
  await recoverStaleSyncs();
  if (process.env.DISABLE_SCHEDULER === "true") return;
  const g = globalThis as unknown as { __brainwhiteTimer?: NodeJS.Timeout };
  if (g.__brainwhiteTimer) return;
  g.__brainwhiteTimer = setInterval(async () => {
    try {
      const { runJobs } = await import("./lib/domain/reports");
      await runJobs();
    } catch (e) {
      console.error("[scheduler]", e);
    }
  }, 15 * 60 * 1000);
}

// A restart mid-sync leaves repos on RUNNING forever. Only syncs older than STALE_SYNC_MS are failed, so with a
// shared database a teammate's live sync is never killed by your server starting.
async function recoverStaleSyncs() {
  try {
    const { db } = await import("./lib/db");
    const cutoff = new Date(Date.now() - STALE_SYNC_MS);
    await db.syncRun.updateMany({
      where: { status: "RUNNING", startedAt: { lt: cutoff } },
      data: { status: "FAILED", finishedAt: new Date(), error: "Interrupted (server restarted)", progress: "Failed" },
    });
    await db.repository.updateMany({
      where: { syncStatus: "RUNNING", syncRuns: { none: { status: "RUNNING", startedAt: { gte: cutoff } } } },
      data: { syncStatus: "FAILED" },
    });
  } catch (e) {
    console.error("[recover-syncs]", e);
  }
}
