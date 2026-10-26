"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { generateReport, runJobs } from "@/lib/domain/reports";

export async function generateNow(fd: FormData) {
  const me = await requirePermission("members:view");
  const a = await db.assignment.findFirst({ where: { id: String(fd.get("assignmentId")), orgId: me.orgId } });
  if (!a) return;
  const type = fd.get("type") === "FINAL" ? "FINAL" : "WEEKLY";
  const r = await generateReport(a.id, type);
  await audit(me.orgId, me.id, "report.generated", r.id);
  redirect(`/reports/${r.id}`);
}

export async function addFeedback(fd: FormData) {
  const me = await requirePermission("members:view");
  const a = await db.assignment.findFirst({ where: { id: String(fd.get("assignmentId")), orgId: me.orgId } });
  if (!a) return;
  const rubric: Record<string, number> = {};
  for (const k of ["communication", "codeQuality", "ownership", "learningSpeed"]) {
    const v = Number(fd.get(k));
    if (v >= 1 && v <= 5) rubric[k] = v;
  }
  await db.mentorFeedback.create({
    data: {
      assignmentId: a.id, authorId: me.id, rubric: JSON.stringify(rubric), notes: String(fd.get("notes") ?? "").slice(0, 4000),
      visibility: fd.get("shared") === "on" ? "SHARED" : "PRIVATE",
    },
  });
  revalidatePath(`/people/${a.id}`);
}

export async function runJobsNow() {
  const me = await requirePermission("paths:manage");
  const r = await runJobs();
  await audit(me.orgId, me.id, "jobs.run", JSON.stringify(r));
  revalidatePath("/dashboard");
}
