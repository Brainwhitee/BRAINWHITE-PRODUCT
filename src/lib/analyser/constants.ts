// Dependency-free on purpose: imported by instrumentation code, which must not pull in node-only modules.
// A repo stuck on RUNNING longer than this is a crashed sync: it may be failed on boot or taken over by a new sync.
export const STALE_SYNC_MS = 30 * 60 * 1000;
// The incremental sync only starts when no other sync of the repo has been RUNNING for less than this. It matches the repo page,
// which offers "Restart Sync" once a run is older than 2 minutes. (The full sync has no lock: a lock would block that restart.)
export const SYNC_TAKEOVER_MS = 2 * 60 * 1000;
