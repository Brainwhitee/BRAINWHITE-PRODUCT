import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

// Always preserve client in globalThis across serverless function re-evaluations
globalForPrisma.prisma = db;

// Domain functions accept either the singleton or an interactive-transaction client
// so tests can run them inside a rolled-back transaction (no test data persists).
import type { Prisma } from "@prisma/client";
export type DbClient = PrismaClient | Prisma.TransactionClient;
