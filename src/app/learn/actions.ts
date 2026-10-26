"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { assignmentProgress } from "@/lib/domain/assign";
import { notify } from "@/lib/mailer";

export async function markComplete(fd: FormData) {
  const me = await requireUser();
  const a = await db.assignment.findFirst({ where: { id: String(fd.get("assignmentId")), userId: me.id } });
  const itemId = String(fd.get("itemId"));
  const nextId = String(fd.get("nextId") || "");
  if (!a) return;
  const done = await db.progressEvent.findFirst({ where: { assignmentId: a.id, itemId, type: "COMPLETED" } });
  if (!done) await db.progressEvent.create({ data: { assignmentId: a.id, userId: me.id, itemId, type: "COMPLETED" } });

  const p = await assignmentProgress(a.id);
  if (p.total > 0 && p.completed === p.total && a.status === "ACTIVE") {
    await db.assignment.update({ where: { id: a.id }, data: { status: "COMPLETED" } });
    if (a.mentorId) await notify(a.mentorId, "Learning path completed", `${me.name} finished all mandatory items.`);
  }
  revalidatePath(`/learn/${a.id}`);
  redirect(nextId ? `/learn/${a.id}/${nextId}` : `/learn/${a.id}`);
}
