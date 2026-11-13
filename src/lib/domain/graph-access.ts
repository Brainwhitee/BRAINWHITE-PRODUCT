import type { Prisma, PrismaClient } from "@prisma/client";
import { can } from "@/lib/rbac";

type Client = PrismaClient | Prisma.TransactionClient;
export type GraphAccess = "ok" | "not_found" | "forbidden";

// Who may read a repository's graph: always scoped to the caller's org; staff (codebase:view) or a member with an assignment.
export async function graphAccess(client: Client, me: { id: string; orgId: string; role: string }, repoId: string): Promise<GraphAccess> {
  const repo = await client.repository.findFirst({ where: { id: repoId, orgId: me.orgId }, select: { id: true } });
  if (!repo) return "not_found";
  if (can(me.role, "codebase:view")) return "ok";
  const a = await client.assignment.findFirst({ where: { userId: me.id, orgId: me.orgId }, select: { id: true } });
  return a ? "ok" : "forbidden";
}
