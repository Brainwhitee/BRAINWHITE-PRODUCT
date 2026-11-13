// DB-backed rate limiting + login lockout. No in-process state, so it is correct
// across serverless instances (Vercel) and survives restarts.
import { db, type DbClient } from "./db";

const DAY_MS = 24 * 60 * 60 * 1000;

export type LimitResult =
  | { ok: true; remaining: number }
  | { ok: false; retryAfterSeconds: number };

// Generic fixed-window counter keyed by an arbitrary string (email, ip, route).
export async function rateLimit(
  client: DbClient,
  key: string,
  limit: number,
  windowMs: number
): Promise<LimitResult> {
  await purgeOldAttempts(client);
  const now = new Date();
  const row = await client.loginAttempt.findUnique({ where: { key } });
  if (!row || now >= new Date(row.windowStartedAt.getTime() + windowMs)) {
    await client.loginAttempt.upsert({
      where: { key },
      create: { key, failures: 1, windowStartedAt: now },
      update: { failures: 1, windowStartedAt: now, lockedUntil: null },
    });
    return { ok: true, remaining: limit - 1 };
  }
  const failures = row.failures + 1;
  await client.loginAttempt.update({ where: { key }, data: { failures } });
  if (failures > limit) {
    const lockedUntil = new Date(now.getTime() + windowMs);
    await client.loginAttempt.update({ where: { key }, data: { lockedUntil } });
    return { ok: false, retryAfterSeconds: Math.ceil(windowMs / 1000) };
  }
  return { ok: true, remaining: limit - failures };
}

export async function isLockedOut(client: DbClient, key: string): Promise<Date | null> {
  const row = await client.loginAttempt.findUnique({ where: { key } });
  if (!row?.lockedUntil) return null;
  if (row.lockedUntil <= new Date()) {
    await client.loginAttempt.deleteMany({ where: { key } });
    return null;
  }
  return row.lockedUntil;
}

// Called after a failed login: increments the per-email counter and locks after
// `threshold` failures for `lockMs`. Returns the lock expiry when now locked.
export async function recordLoginFailure(
  client: DbClient,
  key: string,
  threshold = 5,
  lockMs = 15 * 60 * 1000
): Promise<Date | null> {
  await purgeOldAttempts(client);
  const now = new Date();
  const row = await client.loginAttempt.findUnique({ where: { key } });
  const failures = row ? row.failures + 1 : 1;
  const lockedUntil = failures >= threshold ? new Date(now.getTime() + lockMs) : null;
  await client.loginAttempt.upsert({
    where: { key },
    create: { key, failures, windowStartedAt: now, lockedUntil },
    update: { failures, lockedUntil },
  });
  return lockedUntil;
}

// Called after a successful login so one bad streak cannot lock out a real user.
export async function clearLoginFailures(client: DbClient, key: string) {
  await client.loginAttempt.deleteMany({ where: { key } });
}

// Keep the table bounded without a separate scheduler: drop rows untouched for a day.
// Run probabilistically (1%) to avoid connection pool pressure under load.
async function purgeOldAttempts(client: DbClient) {
  if (Math.random() > 0.01) return;
  await client.loginAttempt.deleteMany({
    where: { windowStartedAt: { lt: new Date(Date.now() - DAY_MS) } },
  });
}

// ---------- Convenience wrappers on the default client (used by route handlers) ----------

export const rateLimitDb = (key: string, limit: number, windowMs: number) =>
  rateLimit(db, key, limit, windowMs);
export const isLockedOutDb = (key: string) => isLockedOut(db, key);
export const recordLoginFailureDb = (key: string) => recordLoginFailure(db, key);
export const clearLoginFailuresDb = (key: string) => clearLoginFailures(db, key);
