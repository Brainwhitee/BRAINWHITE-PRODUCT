// Vitest setup: shared Prisma client for tests with transactional rollback
import { beforeAll, afterAll, beforeEach, afterEach } from "vitest";
import { PrismaClient } from "@prisma/client";
import type { Prisma } from "@prisma/client";

// Use TEST_DATABASE_URL if set, otherwise use DATABASE_URL (live DB with rollback)
const testDbUrl = process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL;
if (!testDbUrl) throw new Error("TEST_DATABASE_URL or DATABASE_URL must be set for tests");

export const testDb = new PrismaClient({ datasources: { db: { url: testDbUrl } } });

// Type for transaction client (what $transaction callback receives)
export type TestTransactionClient = Prisma.TransactionClient;

// Helper to run a test inside a rolled-back transaction
// Prisma interactive transactions auto-rollback if an error is thrown
export async function runInTransaction(fn: (tx: TestTransactionClient) => Promise<void>): Promise<void> {
  try {
    await testDb.$transaction(async (tx) => {
      await fn(tx);
      throw new Error("TEST_ROLLBACK_MARKER");
    }, { timeout: 30000 }); // 30 second timeout for tests
  } catch (e: unknown) {
    if (e instanceof Error && e.message === "TEST_ROLLBACK_MARKER") return;
    throw e;
  }
}

// Track created IDs for cleanup (fallback if transaction approach doesn't work)
const createdIds: {
  users: string[];
  orgs: string[];
  authTokens: string[];
  loginAttempts: string[];
  oauthAccounts: string[];
} = {
  users: [],
  orgs: [],
  authTokens: [],
  loginAttempts: [],
  oauthAccounts: [],
};

export function trackCreated(type: keyof typeof createdIds, id: string) {
  createdIds[type].push(id);
}

beforeEach(() => {
  Object.keys(createdIds).forEach((k) => (createdIds[k as keyof typeof createdIds].length = 0));
});

afterEach(async () => {
  await testDb.oAuthAccount.deleteMany({ where: { id: { in: createdIds.oauthAccounts } } });
  await testDb.authToken.deleteMany({ where: { id: { in: createdIds.authTokens } } });
  await testDb.loginAttempt.deleteMany({ where: { id: { in: createdIds.loginAttempts } } });
  await testDb.user.deleteMany({ where: { id: { in: createdIds.users } } });
  await testDb.organisation.deleteMany({ where: { id: { in: createdIds.orgs } } });
});

afterAll(async () => {
  await testDb.$disconnect();
});

// Mock console.error to reduce noise in tests
const originalError = console.error;
beforeAll(() => {
  console.error = (...args) => {
    if (args[0]?.includes?.("Prisma") && args[0]?.includes?.("warn")) return;
    originalError.apply(console, args);
  };
});
afterAll(() => {
  console.error = originalError;
});