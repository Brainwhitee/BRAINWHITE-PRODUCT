import { PrismaClient } from "@prisma/client";

const g = globalThis as unknown as { prisma?: PrismaClient };
export const db = g.prisma ?? new PrismaClient();
if (process.env.NODE_ENV !== "production") g.prisma = db;

// Domain functions accept either the singleton or an interactive-transaction client
// so tests can run them inside a rolled-back transaction (no test data persists).
import type { Prisma } from "@prisma/client";
export type DbClient = PrismaClient | Prisma.TransactionClient;
