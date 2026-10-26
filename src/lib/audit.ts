import { db } from "./db";

export const audit = (orgId: string, actorId: string | null, action: string, target?: string) =>
  db.auditLog.create({ data: { orgId, actorId, action, target } });
