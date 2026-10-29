"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { createSession, destroySession, homeFor, requirePermission, requireUser } from "@/lib/auth";
import { encrypt, newToken, sha256 } from "@/lib/crypto";
import { audit } from "@/lib/audit";
import { notify, sendEmail } from "@/lib/mailer";
import { syncRepository } from "@/lib/analyser/pipeline";
import { createAssignment } from "@/lib/domain/assign";

export type FormState = { error?: string; success?: boolean; home?: string } | undefined;

const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const signupSchema = z.object({
  orgName: z.string().min(2),
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export async function signupOrg(_: FormState, fd: FormData): Promise<FormState> {
  const p = signupSchema.safeParse(Object.fromEntries(fd));
  if (!p.success) return { error: p.error.issues[0].message };
  const { orgName, name, email, password } = p.data;
  const slug = slugify(orgName);
  if (!slug) return { error: "Invalid organisation name" };
  if (await db.organisation.findUnique({ where: { slug } })) return { error: "That organisation name is taken" };
  if (await db.user.findUnique({ where: { email: email.toLowerCase() } })) return { error: "Email already registered" };

  const org = await db.organisation.create({ data: { name: orgName, slug } });
  const user = await db.user.create({
    data: {
      orgId: org.id,
      name,
      email: email.toLowerCase(),
      role: "OWNER",
      passwordHash: await bcrypt.hash(password, 12),
    },
  });
  await audit(org.id, user.id, "org.created", org.slug);
  await createSession(user.id);
  return { success: true };
}

export async function login(_: FormState, fd: FormData): Promise<FormState & { home?: string }> {
  const email = String(fd.get("email") ?? "").toLowerCase();
  const user = await db.user.findUnique({ where: { email } });
  const ok = user?.passwordHash && (await bcrypt.compare(String(fd.get("password") ?? ""), user.passwordHash));
  if (!user || !ok || user.status !== "ACTIVE") return { error: "Invalid email or password" };
  await audit(user.orgId, user.id, "auth.login");
  await createSession(user.id);
  return { success: true, home: homeFor(user.role) };
}

export async function logout() {
  await destroySession();
  redirect("/login");
}

// ---------- Invitations (PLT-05) ----------

const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

async function issueInvite(
  orgId: string,
  orgName: string,
  inviterId: string,
  inviterName: string,
  email: string,
  role: string,
) {
  const token = newToken();
  await db.invitation.create({
    data: {
      orgId,
      email,
      role,
      invitedBy: inviterId,
      tokenHash: sha256(token),
      expiresAt: new Date(Date.now() + INVITE_TTL_MS),
    },
  });
  const link = `${process.env.APP_URL}/invite/${token}`;
  await sendEmail(
    orgId,
    email,
    `You are invited to join ${orgName}`,
    `${inviterName} invited you to ${orgName} as ${role.toLowerCase()}.\n\nAccept: ${link}\n\nThis link expires in 7 days.`,
  );
}

export async function inviteMember(_: FormState, fd: FormData): Promise<FormState> {
  const me = await requirePermission("members:invite");
  const email = z.string().email().safeParse(String(fd.get("email") ?? "").toLowerCase());
  const role = z.enum(["MANAGER", "MENTOR", "CANDIDATE"]).safeParse(fd.get("role"));
  if (!email.success || !role.success) return { error: "Enter a valid email and role" };
  if (await db.user.findUnique({ where: { email: email.data } })) return { error: "That person already has an account" };
  await issueInvite(me.orgId, me.org.name, me.id, me.name, email.data, role.data);
  await audit(me.orgId, me.id, "invite.sent", email.data);
  revalidatePath("/team");
}

export async function revokeInvite(fd: FormData) {
  const me = await requirePermission("members:invite");
  const id = String(fd.get("id"));
  await db.invitation.updateMany({ where: { id, orgId: me.orgId, status: "PENDING" }, data: { status: "REVOKED" } });
  await audit(me.orgId, me.id, "invite.revoked", id);
  revalidatePath("/team");
}

export async function resendInvite(fd: FormData) {
  const me = await requirePermission("members:invite");
  const inv = await db.invitation.findFirst({ where: { id: String(fd.get("id")), orgId: me.orgId } });
  if (!inv || inv.status === "ACCEPTED") return;
  await db.invitation.update({ where: { id: inv.id }, data: { status: "REVOKED" } });
  await issueInvite(me.orgId, me.org.name, me.id, me.name, inv.email, inv.role);
  await audit(me.orgId, me.id, "invite.resent", inv.email);
  revalidatePath("/team");
}

export async function acceptInvite(token: string, _: FormState, fd: FormData): Promise<FormState> {
  const inv = await db.invitation.findUnique({ where: { tokenHash: sha256(token) } });
  if (!inv || inv.status !== "PENDING" || inv.expiresAt < new Date())
    return { error: "This invite is no longer valid. Ask your manager to resend it." };
  const name = String(fd.get("name") ?? "").trim();
  const password = String(fd.get("password") ?? "");
  if (name.length < 2) return { error: "Enter your name" };
  if (password.length < 8) return { error: "Password must be at least 8 characters" };
  if (await db.user.findUnique({ where: { email: inv.email } })) return { error: "Account already exists. Log in instead." };

  // email is locked to the invited address
  const user = await db.user.create({
    data: { orgId: inv.orgId, name, email: inv.email, role: inv.role, passwordHash: await bcrypt.hash(password, 12) },
  });
  await db.invitation.update({ where: { id: inv.id }, data: { status: "ACCEPTED" } });
  await audit(inv.orgId, user.id, "invite.accepted", inv.email);
  await notify(inv.invitedBy, "Invite accepted", `${name} (${inv.email}) joined.`);
  if (inv.pathId) {
    const inviter = await db.user.findUnique({ where: { id: inv.invitedBy } });
    await createAssignment({
      orgId: inv.orgId, userId: user.id, pathId: inv.pathId, startDate: inv.startDate ?? new Date(),
      mentorId: null, assignerName: inviter?.name ?? "Your manager",
    });
  }
  await createSession(user.id);
  redirect(inv.role === "CANDIDATE" ? "/connect-github" : "/dashboard");
}

// ---------- Members ----------

export async function deactivateMember(fd: FormData) {
  const me = await requirePermission("members:deactivate");
  const id = String(fd.get("id"));
  if (id === me.id) return;
  const target = await db.user.findFirst({ where: { id, orgId: me.orgId } });
  if (!target || target.role === "OWNER") return;
  await db.user.update({ where: { id }, data: { status: target.status === "ACTIVE" ? "DEACTIVATED" : "ACTIVE" } });
  await db.session.deleteMany({ where: { userId: id } });
  await audit(me.orgId, me.id, "member.toggled", id);
  revalidatePath("/team");
}

export async function changeRole(fd: FormData) {
  const me = await requirePermission("members:change-role");
  const role = z.enum(["MANAGER", "MENTOR", "CANDIDATE"]).safeParse(fd.get("role"));
  const id = String(fd.get("id"));
  if (!role.success || id === me.id) return;
  await db.user.updateMany({ where: { id, orgId: me.orgId }, data: { role: role.data } });
  await audit(me.orgId, me.id, "member.role-changed", `${id}:${role.data}`);
  revalidatePath("/team");
}

// ---------- GitHub link (PLT-03 / CND-02) ----------

// Dev-mode fallback used only when GITHUB_CLIENT_ID is not configured.
export async function linkGithubDev(_: FormState, fd: FormData): Promise<FormState> {
  if (process.env.GITHUB_CLIENT_ID) return { error: "Use the GitHub sign-in button" };
  const me = await requireUser();
  const username = String(fd.get("username") ?? "").trim();
  if (!/^[a-zA-Z0-9-]{1,39}$/.test(username)) return { error: "Enter a valid GitHub username" };
  await db.user.update({
    where: { id: me.id },
    data: { githubUsername: username, githubUserId: `dev:${username}`, githubTokenEnc: encrypt("dev-token") },
  });
  await audit(me.orgId, me.id, "github.linked", username);
  redirect("/learn");
}

// ---------- Codebase Analyser (CBA-01 / 03) ----------


export async function addRepository(_: FormState, fd: FormData): Promise<FormState> {
  const me = await requirePermission("codebase:manage");
  const p = z
    .object({
      projectName: z.string().min(2),
      source: z.enum(["github", "local"]),
      location: z.string().min(2),
      branch: z.string().min(1).default("main"),
    })
    .safeParse({ ...Object.fromEntries(fd), branch: String(fd.get("branch") || "main") });
  if (!p.success) return { error: "Fill in project name, source and location" };
  const { projectName, source, location, branch } = p.data;
  if (source === "local" && process.env.ALLOW_LOCAL_REPOS !== "true") return { error: "Local folders are disabled on this server" };

  let project = await db.project.findFirst({ where: { orgId: me.orgId, name: projectName } });
  project ??= await db.project.create({ data: { orgId: me.orgId, name: projectName } });
  const repo = await db.repository.create({
    data: {
      orgId: me.orgId, projectId: project.id, source, location, branch,
      name: location.split(/[\/]/).filter(Boolean).pop()!,
    },
  });
  await audit(me.orgId, me.id, "repo.connected", location);
  void syncRepository(repo.id); // fire and forget; progress is visible on the repo page
  redirect(`/projects/repos/${repo.id}`);
}

export async function syncNow(fd: FormData) {
  const me = await requirePermission("codebase:manage");
  const repo = await db.repository.findFirst({ where: { id: String(fd.get("id")), orgId: me.orgId } });
  if (!repo || repo.syncStatus === "RUNNING") return;
  await audit(me.orgId, me.id, "repo.sync", repo.location);
  void syncRepository(repo.id);
  revalidatePath(`/projects/repos/${repo.id}`);
}

export async function disconnectRepo(fd: FormData) {
  const me = await requirePermission("codebase:manage");
  await db.repository.deleteMany({ where: { id: String(fd.get("id")), orgId: me.orgId } });
  await audit(me.orgId, me.id, "repo.disconnected", String(fd.get("id")));
  redirect("/projects");
}
