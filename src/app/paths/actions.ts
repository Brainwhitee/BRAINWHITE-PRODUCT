"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { createAssignment } from "@/lib/domain/assign";
import { newToken, sha256 } from "@/lib/crypto";
import { sendEmail } from "@/lib/mailer";
import { ALLOWED_EXT, MAX_UPLOAD_BYTES, saveFile } from "@/lib/storage";
import type { FormState } from "../actions";

async function ownPath(orgId: string, id: string) {
  const p = await db.learningPath.findFirst({ where: { id, orgId } });
  if (!p) throw new Error("Path not found");
  return p;
}

export async function createPath(_: FormState, fd: FormData): Promise<FormState> {
  const me = await requirePermission("paths:manage");
  const p = z
    .object({ title: z.string().min(2), description: z.string().optional(), role: z.string().optional(), type: z.enum(["NEW_JOINEE", "NEW_PROJECT"]) })
    .safeParse(Object.fromEntries(fd));
  if (!p.success) return { error: "Enter a title" };
  const path = await db.learningPath.create({
    data: { orgId: me.orgId, createdBy: me.id, title: p.data.title, description: p.data.description ?? "", role: p.data.role ?? "", type: p.data.type },
  });
  await db.pathSection.create({ data: { pathId: path.id, title: "Week 1", order: 0 } });
  await audit(me.orgId, me.id, "path.created", path.id);
  redirect(`/paths/${path.id}`);
}

export async function addSection(fd: FormData) {
  const me = await requirePermission("paths:manage");
  const path = await ownPath(me.orgId, String(fd.get("pathId")));
  const count = await db.pathSection.count({ where: { pathId: path.id } });
  const title = String(fd.get("title") || `Section ${count + 1}`);
  await db.pathSection.create({ data: { pathId: path.id, title, order: count } });
  revalidatePath(`/paths/${path.id}`);
}

export async function deleteSection(fd: FormData) {
  const me = await requirePermission("paths:manage");
  const s = await db.pathSection.findFirst({ where: { id: String(fd.get("id")), path: { orgId: me.orgId } } });
  if (s) await db.pathSection.delete({ where: { id: s.id } });
  if (s) revalidatePath(`/paths/${s.pathId}`);
}

async function nextOrder(sectionId: string) {
  const last = await db.pathItem.findFirst({ where: { sectionId }, orderBy: { order: "desc" } });
  return (last?.order ?? -1) + 1;
}

export async function addChunkItem(fd: FormData) {
  const me = await requirePermission("paths:manage");
  const path = await ownPath(me.orgId, String(fd.get("pathId")));
  const sectionId = String(fd.get("sectionId"));
  const chunk = await db.chunk.findFirst({ where: { id: String(fd.get("chunkId")), module: { repo: { orgId: me.orgId } } } });
  const section = await db.pathSection.findFirst({ where: { id: sectionId, pathId: path.id } });
  if (!chunk || !section) return;
  await db.pathItem.create({
    data: { sectionId, type: "CHUNK", refId: chunk.id, title: chunk.title, order: await nextOrder(sectionId) },
  });
  revalidatePath(`/paths/${path.id}`);
}

// Adding a whole module adds all its chunks in a sensible order (file path, then line)
export async function addModuleItems(fd: FormData) {
  const me = await requirePermission("paths:manage");
  const path = await ownPath(me.orgId, String(fd.get("pathId")));
  const sectionId = String(fd.get("sectionId"));
  const section = await db.pathSection.findFirst({ where: { id: sectionId, pathId: path.id } });
  const chunks = await db.chunk.findMany({
    where: { moduleId: String(fd.get("moduleId")), module: { repo: { orgId: me.orgId } } },
    orderBy: [{ filePath: "asc" }, { startLine: "asc" }],
  });
  if (!section) return;
  let order = await nextOrder(sectionId);
  for (const c of chunks)
    await db.pathItem.create({ data: { sectionId, type: "CHUNK", refId: c.id, title: c.title, order: order++ } });
  revalidatePath(`/paths/${path.id}`);
}

export async function addContentItem(fd: FormData) {
  const me = await requirePermission("paths:manage");
  const path = await ownPath(me.orgId, String(fd.get("pathId")));
  const sectionId = String(fd.get("sectionId"));
  const title = String(fd.get("title") ?? "").trim();
  if (!title || !(await db.pathSection.findFirst({ where: { id: sectionId, pathId: path.id } }))) return;
  await db.pathItem.create({
    data: { sectionId, type: "CONTENT", title, body: String(fd.get("body") ?? ""), order: await nextOrder(sectionId) },
  });
  revalidatePath(`/paths/${path.id}`);
}

export async function updateItem(fd: FormData) {
  const me = await requirePermission("paths:manage");
  const item = await db.pathItem.findFirst({ where: { id: String(fd.get("id")), section: { path: { orgId: me.orgId } } }, include: { section: true } });
  if (!item) return;
  const dueRaw = String(fd.get("dueDay") ?? "");
  await db.pathItem.update({
    where: { id: item.id },
    data: { mandatory: fd.get("mandatory") === "on", dueDay: dueRaw ? Number(dueRaw) : null },
  });
  revalidatePath(`/paths/${item.section.pathId}`);
}

export async function moveItem(fd: FormData) {
  const me = await requirePermission("paths:manage");
  const item = await db.pathItem.findFirst({ where: { id: String(fd.get("id")), section: { path: { orgId: me.orgId } } }, include: { section: true } });
  if (!item) return;
  const dir = fd.get("dir") === "up" ? -1 : 1;
  const siblings = await db.pathItem.findMany({ where: { sectionId: item.sectionId }, orderBy: { order: "asc" } });
  const i = siblings.findIndex((s) => s.id === item.id);
  const j = i + dir;
  if (j < 0 || j >= siblings.length) return;
  [siblings[i], siblings[j]] = [siblings[j], siblings[i]];
  await Promise.all(siblings.map((s, idx) => db.pathItem.update({ where: { id: s.id }, data: { order: idx } })));
  revalidatePath(`/paths/${item.section.pathId}`);
}

export async function removeItem(fd: FormData) {
  const me = await requirePermission("paths:manage");
  const item = await db.pathItem.findFirst({ where: { id: String(fd.get("id")), section: { path: { orgId: me.orgId } } }, include: { section: true } });
  if (!item) return;
  await db.pathItem.delete({ where: { id: item.id } });
  revalidatePath(`/paths/${item.section.pathId}`);
}

export async function setPublished(fd: FormData) {
  const me = await requirePermission("paths:manage");
  const path = await ownPath(me.orgId, String(fd.get("pathId")));
  const publish = fd.get("publish") === "1";
  // editing a published path creates a new version number; existing assignments keep their recorded version
  const hasAssignments = (await db.assignment.count({ where: { pathId: path.id } })) > 0;
  await db.learningPath.update({
    where: { id: path.id },
    data: { status: publish ? "PUBLISHED" : "DRAFT", ...(publish && path.status === "DRAFT" && hasAssignments ? { version: { increment: 1 } } : {}) },
  });
  await audit(me.orgId, me.id, publish ? "path.published" : "path.unpublished", path.id);
  revalidatePath(`/paths/${path.id}`);
}

export async function uploadHandout(_: FormState, fd: FormData): Promise<FormState> {
  const me = await requirePermission("paths:manage");
  const path = await ownPath(me.orgId, String(fd.get("pathId")));
  const file = fd.get("file");
  if (!(file instanceof File) || file.size === 0) return { error: "Choose a file" };
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (!ALLOWED_EXT.has(ext)) return { error: `Allowed types: ${[...ALLOWED_EXT].join(", ")}` };
  if (file.size > MAX_UPLOAD_BYTES) return { error: "File is larger than 25 MB" };
  const bytes = Buffer.from(await file.arrayBuffer());
  const itemId = String(fd.get("itemId") || "") || null;
  if (itemId && !(await db.pathItem.findFirst({ where: { id: itemId, section: { pathId: path.id } } }))) return { error: "Invalid item" };
  await db.handout.create({
    data: {
      orgId: me.orgId, pathId: path.id, itemId, filename: file.name, mime: file.type || "application/octet-stream",
      size: file.size, mustRead: fd.get("mustRead") === "on", storageKey: await saveFile(me.orgId, bytes),
      // text is indexed for AI chat; PDF/Office text extraction is a known gap
      extractedText: ext === "txt" || ext === "md" ? bytes.toString("utf8").slice(0, 200_000) : "",
    },
  });
  revalidatePath(`/paths/${path.id}`);
}

export async function deleteHandout(fd: FormData) {
  const me = await requirePermission("paths:manage");
  const h = await db.handout.findFirst({ where: { id: String(fd.get("id")), orgId: me.orgId } });
  if (h) {
    await db.handout.delete({ where: { id: h.id } });
    revalidatePath(`/paths/${h.pathId}`);
  }
}

// Assign to an existing user directly, or invite by email with the path attached (ADM-13/14)
export async function assignPath(_: FormState, fd: FormData): Promise<FormState> {
  const me = await requirePermission("paths:manage");
  const path = await ownPath(me.orgId, String(fd.get("pathId")));
  if (path.status !== "PUBLISHED") return { error: "Publish the path before assigning it" };
  const email = String(fd.get("email") ?? "").trim().toLowerCase();
  if (!z.string().email().safeParse(email).success) return { error: "Enter a valid email" };
  const startDate = new Date(String(fd.get("startDate") || new Date().toISOString().slice(0, 10)));
  const mentorId = String(fd.get("mentorId") || "") || null;
  const message = String(fd.get("message") ?? "");

  const user = await db.user.findFirst({ where: { email, orgId: me.orgId } });
  if (user) {
    await createAssignment({ orgId: me.orgId, userId: user.id, pathId: path.id, startDate, mentorId, assignerName: me.name, message });
  } else {
    if (await db.user.findUnique({ where: { email } })) return { error: "That email belongs to another organisation" };
    const token = newToken();
    await db.invitation.create({
      data: {
        orgId: me.orgId, email, role: "CANDIDATE", invitedBy: me.id, pathId: path.id, startDate,
        tokenHash: sha256(token), expiresAt: new Date(Date.now() + 7 * 86400_000),
      },
    });
    await sendEmail(
      me.orgId, email, `${me.name} invited you to onboard at ${me.org.name}`,
      `You have been assigned "${path.title}", starting ${startDate.toDateString()}.\n${message}\n\nSign up: ${process.env.APP_URL}/invite/${token}`,
    );
  }
  await audit(me.orgId, me.id, "path.assigned", `${path.id}:${email}`);
  revalidatePath(`/paths/${path.id}`);
}
