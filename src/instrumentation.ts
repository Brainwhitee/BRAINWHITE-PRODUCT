// In-process scheduler (PLT-08 MVP). Runs deadline checks and report generation every 15 minutes.
// Replace with a real queue (BullMQ/Temporal) when you need multiple instances.
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs" || process.env.DISABLE_SCHEDULER === "true") return;
  const g = globalThis as unknown as { __pedagonTimer?: NodeJS.Timeout };
  if (g.__pedagonTimer) return;
  g.__pedagonTimer = setInterval(async () => {
    try {
      const { runJobs } = await import("./lib/domain/reports");
      await runJobs();
    } catch (e) {
      console.error("[scheduler]", e);
    }
  }, 15 * 60 * 1000);
}
