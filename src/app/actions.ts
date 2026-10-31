"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import type { DbClient } from "@/lib/db";
import { createSession, destroySession, homeFor, requirePermission, requireUser } from "@/lib/auth";
import { encrypt, newToken, sha256 } from "@/lib/crypto";
import { appUrl } from "@/lib/config";
import { audit } from "@/lib/audit";
import { notify, sendEmail } from "@/lib/mailer";
import { rateLimitDb } from "@/lib/rate-limit";
import { syncRepository } from "@/lib/analyser/pipeline";
import { createAssignment } from "@/lib/domain/assign";
import {
  issueEmailVerification,
  signupTx,
  loginTx,
  requestResetTx,
  resetTx,
  verifyEmailWithToken,
} from "@/lib/domain/auth";

export type FormState = { error?: string; success?: boolean; home?: string; emailSent?: boolean; message?: string } | undefined;

// Best-effort client IP for rate limiting (proxy headers first).
async function clientIp(): Promise<string> {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for") ?? h.get("x-real-ip");
  return (forwarded ?? "unknown").split(",")[0].trim();
}

export async function signupOrg(_: FormState, fd: FormData): Promise<FormState> {
  const ip = await clientIp();
  const ipLimit = await rateLimitDb(`signup:ip:${ip}`, 10, 15 * 60 * 1000);
  if (!ipLimit.ok)
    return { error: "Too many sign-up attempts from this network. Try again later." };
  const result = await signupTx({
    orgName: String(fd.get("orgName") ?? ""),
    name: String(fd.get("name") ?? ""),
    email: String(fd.get("email") ?? ""),
    password: String(fd.get("password") ?? ""),
  });
  if (!result.ok) return { error: result.error };
  await audit(result.data.orgId, result.data.userId, "org.created");
  await createSession(result.data.userId);
  return { success: true, emailSent: result.data.verificationSent };
}

export async function login(_: FormState, fd: FormData): Promise<FormState & { home?: string }> {
  const ipLimit = await rateLimitDb(`login:ip:${await clientIp()}`, 20, 15 * 60 * 1000);
  if (!ipLimit.ok) return { error: "Too many attempts from this network. Try again later." };
  const result = await loginTx({
    email: String(fd.get("email") ?? ""),
    password: String(fd.get("password") ?? ""),
  });
  if (!result.ok) return { error: result.error };
  await audit(result.data.orgId, result.data.userId, "auth.login");
  await createSession(result.data.userId);
  return { success: true, home: homeFor(result.data.role) };
}

// ---------- Password reset (never reveals whether an account exists) ----------

export async function requestPasswordResetAction(_: FormState, fd: FormData): Promise<FormState> {
  const ipLimit = await rateLimitDb(`reset:ip:${await clientIp()}`, 5, 15 * 60 * 1000);
  if (!ipLimit.ok) return { error: "Too many reset requests from this network. Try again later." };
  const email = z.string().email().safeParse(String(fd.get("email") ?? "").trim());
  if (!email.success) return { error: "Enter a valid email address" };
  const result = await requestResetTx(email.data);
  if (!result.ok) return { error: result.error };
  return { success: true };
}

export async function resetPasswordAction(_: FormState, fd: FormData): Promise<FormState> {
  const parsed = z
    .object({ token: z.string().min(1), password: z.string(), confirm: z.string() })
    .safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: "Fill in every field" };
  if (parsed.data.password !== parsed.data.confirm) return { error: "Passwords do not match" };
  const result = await resetTx({ token: parsed.data.token, password: parsed.data.password });
  if (!result.ok) return { error: result.error };
  await createSession(result.data.userId);
  const user = await db.user.findUniqueOrThrow({ where: { id: result.data.userId } });
  return { success: true, home: homeFor(user.role) };
}

// ---------- Email verification ----------

export async function verifyEmailAction(token: string): Promise<FormState> {
  const result = await verifyEmailWithToken(db, token);
  if (!result.ok) return { error: result.error };
  return { success: true };
}

export async function resendVerificationAction(): Promise<FormState> {
  const me = await requireUser();
  const sent = await issueEmailVerification(db, me.id);
  if (!sent) return { error: "Verification email is not available. Add a Resend key or you are already verified." };
  return { success: true, emailSent: true };
}

export async function logout() {
  await destroySession();
  redirect("/login");
}

// ---------- Invitations (PLT-05) ----------

const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

async function issueInvite(
  client: DbClient,
  orgId: string,
  orgName: string,
  inviterId: string,
  inviterName: string,
  email: string,
  role: string,
) {
  const token = newToken();
  await client.invitation.create({
    data: {
      orgId,
      email,
      role,
      invitedBy: inviterId,
      tokenHash: sha256(token),
      expiresAt: new Date(Date.now() + INVITE_TTL_MS),
    },
  });
  const link = `${appUrl()}/invite/${token}`;
  await sendEmail(
    orgId,
    email,
    `You are invited to join ${orgName}`,
    `${inviterName} invited you to ${orgName} as ${role.toLowerCase()}.\n\nAccept: ${link}\n\nThis link expires in 7 days.`,
    { client }
  );
}

export async function inviteMember(_: FormState, fd: FormData): Promise<FormState> {
  const me = await requirePermission("members:invite");
  const email = z.string().email().safeParse(String(fd.get("email") ?? "").toLowerCase());
  const role = z.enum(["MANAGER", "MENTOR", "CANDIDATE"]).safeParse(fd.get("role"));
  if (!email.success || !role.success) return { error: "Enter a valid email and role" };
  if (await db.user.findUnique({ where: { email: email.data } })) return { error: "That person already has an account" };
  await issueInvite(db, me.orgId, me.org.name, me.id, me.name, email.data, role.data);
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
  await issueInvite(db, me.orgId, me.org.name, me.id, me.name, inv.email, inv.role);
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
    data: { orgId: inv.orgId, name, email: inv.email, role: inv.role, passwordHash: await bcrypt.hash(password, 12), emailVerifiedAt: new Date() },
  });
  await db.invitation.update({ where: { id: inv.id }, data: { status: "ACCEPTED" } });
  await audit(inv.orgId, user.id, "invite.accepted", inv.email);
  await notify(inv.invitedBy, "Invite accepted", `${name} (${inv.email}) joined.`);
  await issueEmailVerification(db, user.id);
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

export async function disconnectGithubApp(fd: FormData) {
  const me = await requirePermission("codebase:manage");
  await db.organisation.update({
    where: { id: me.orgId },
    data: {
      githubInstallationId: null,
      githubOrgName: null,
    },
  });
  await audit(me.orgId, me.id, "org.github_app_disconnected");
  revalidatePath("/projects");
}

export async function saveCustomGithubPat(_: FormState, fd: FormData): Promise<FormState> {
  const me = await requirePermission("codebase:manage");
  const rawToken = String(fd.get("token") ?? "").trim();

  if (!rawToken) {
    await db.organisation.update({
      where: { id: me.orgId },
      data: { githubTokenEnc: null },
    });
    await audit(me.orgId, me.id, "org.github_pat_cleared");
    revalidatePath("/projects");
    return { success: true, message: "Custom token removed" };
  }

  if (rawToken.length < 20) {
    return { error: "Please enter a valid GitHub Personal Access Token (classic or fine-grained)" };
  }

  await db.organisation.update({
    where: { id: me.orgId },
    data: { githubTokenEnc: encrypt(rawToken) },
  });
  await audit(me.orgId, me.id, "org.github_pat_saved");
  revalidatePath("/projects");
  return { success: true, message: "GitHub Personal Access Token saved securely" };
}
