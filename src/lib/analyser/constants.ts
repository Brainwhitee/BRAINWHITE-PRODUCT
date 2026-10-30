// Dependency-free on purpose: imported by instrumentation code, which must not pull in node-only modules.
// A repo stuck on RUNNING longer than this is a crashed sync: it may be failed on boot or taken over by a new sync.
export const STALE_SYNC_MS = 30 * 60 * 1000;
