import { describe, it, expect } from "vitest";
import { runInTransaction, type TestTransactionClient } from "tests/setup";
import {
  rateLimit,
  recordLoginFailure,
  clearLoginFailures,
  isLockedOut,
} from "@/lib/rate-limit";

describe("Rate limiting", () => {
  it("allows requests within limit", async () => {
    await runInTransaction(async (tx: TestTransactionClient) => {
      const key = `test-rl-${Date.now()}`;
      for (let i = 0; i < 5; i++) {
        const result = await rateLimit(tx, key, 10, 60 * 1000);
        expect(result.ok).toBe(true);
      }
    });
  });

  it("blocks after exceeding limit", async () => {
    await runInTransaction(async (tx: TestTransactionClient) => {
      const key = `test-rl-block-${Date.now()}`;
      for (let i = 0; i < 10; i++) {
        await rateLimit(tx, key, 5, 60 * 1000);
      }
      const result = await rateLimit(tx, key, 5, 60 * 1000);
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.retryAfterSeconds).toBeGreaterThan(0);
    });
  });

  it("recordLoginFailure locks after threshold", async () => {
    await runInTransaction(async (tx: TestTransactionClient) => {
      const key = `test-rl-lock-${Date.now()}`;
      for (let i = 0; i < 4; i++) {
        const locked = await recordLoginFailure(tx, key, 5, 60 * 1000);
        expect(locked).toBeNull();
      }
      const locked = await recordLoginFailure(tx, key, 5, 60 * 1000);
      expect(locked).not.toBeNull();
      expect(locked!.getTime()).toBeGreaterThan(Date.now());
    });
  });

  it("clearLoginFailures removes lockout", async () => {
    await runInTransaction(async (tx: TestTransactionClient) => {
      const key = `test-rl-clear-${Date.now()}`;
      await recordLoginFailure(tx, key, 5, 60 * 1000);
      await recordLoginFailure(tx, key, 5, 60 * 1000);
      await recordLoginFailure(tx, key, 5, 60 * 1000);
      await recordLoginFailure(tx, key, 5, 60 * 1000);
      await recordLoginFailure(tx, key, 5, 60 * 1000);
      let locked = await isLockedOut(tx, key);
      expect(locked).not.toBeNull();
      await clearLoginFailures(tx, key);
      locked = await isLockedOut(tx, key);
      expect(locked).toBeNull();
    });
  });

  it("different keys are independent", async () => {
    await runInTransaction(async (tx: TestTransactionClient) => {
      const key1 = `test-ind-${Date.now()}-1`;
      const key2 = `test-ind-${Date.now()}-2`;
      for (let i = 0; i < 5; i++) await rateLimit(tx, key1, 3, 60 * 1000);
      const r1 = await rateLimit(tx, key1, 3, 60 * 1000);
      const r2 = await rateLimit(tx, key2, 3, 60 * 1000);
      expect(r1.ok).toBe(false);
      expect(r2.ok).toBe(true);
    });
  });
});