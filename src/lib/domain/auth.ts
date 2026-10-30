// Framework-free auth core: password signup/login with lockout, password reset,
// email verification, and OAuth account resolution. Accepts a Prisma client so
// tests can run every path inside a rolled-back transaction.
import bcrypt from "bcryptjs";
import { z } from "zod";
import { db, type DbClient } from "@/lib/db";
import { appUrl, isEmailConfigured } from "@/lib/config";
import { clearLoginFailures, isLockedOut, recordLoginFailure } from "@/lib/rate-limit";
import { newToken, sha256 } from "@/lib/crypto";
import { sendEmail } from "@/lib/mailer";

export type Ok<T> = { ok: true; data: T };
export type Err = { ok: false; error: string; code?: string };
export type Result<T> = Ok<T> | Err;

export const signupSchema = z.object({
  orgName: z.string().trim().min(2, "Organisation name is too short").max(80),
  name: z.string().trim().min(2, "Please enter your name").max(80),
  email: z.string().trim().email("Enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters").max(200),
});
export type SignupInput = z.infer<typeof signupSchema>;

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(200);

const PASSWORD_RESET_TTL_MS = 60 * 60 * 1000; // 1 hour
const EMAIL_VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
export const LOGIN_LOCKOUT_THRESHOLD = 5;
export const LOGIN_LOCKOUT_MS = 15 * 60 * 1000;

const slugify = (s: string) =>
  s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 50);

const emailLink = (path: string, token: string) =>
  `${appUrl()}${path}${path.includes("?") ? "&" : "?"}token=${encodeURIComponent(token)}`;

// ---------- Password signup ----------

export async function signupWithPassword(
  client: DbClient,
  input: SignupInput
): Promise<Result<{ userId: string; orgId: string; verificationSent: boolean }>> {
  const parsed = signupSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const { orgName, name, password } = parsed.data;
  const email = parsed.data.email.toLowerCase();

  if (await client.user.findUnique({ where: { email } }))
    return { ok: false, error: "An account with this email already exists. Sign in instead." };

  const base = slugify(orgName);
  if (!base) return { ok: false, error: "Enter a valid organisation name" };
  let slug = base;
  for (let i = 2; await client.organisation.findUnique({ where: { slug } }); i++) {
    slug = `${base}-${i}`;
  }

  const org = await client.organisation.create({ data: { name: orgName, slug } });
  const user = await client.user.create({
    data: {
      orgId: org.id,
      name,
      email,
      role: "OWNER",
      passwordHash: await bcrypt.hash(password, 12),
    },
  });
  const verificationSent = await issueEmailVerification(client, user.id, email);
  return { ok: true, data: { userId: user.id, orgId: org.id, verificationSent } };
}

// ---------- Password login (with lockout) ----------

export async function loginWithPassword(
  client: DbClient,
  input: { email: string; password: string }
): Promise<Result<{ userId: string; orgId: string; role: string; emailVerified: boolean }>> {
  const email = input.email.toLowerCase().trim();
  if (!email || !input.password) return { ok: false, error: "Enter your email and password" };

  const lockedUntil = await isLockedOut(client, `login:${email}`);
  if (lockedUntil) {
    const mins = Math.max(1, Math.ceil((lockedUntil.getTime() - Date.now()) / 60000));
    return {
      ok: false,
      error: `Too many failed attempts. Try again in ${mins} minute${mins === 1 ? "" : "s"}.`,
    };
  }

  const user = await client.user.findUnique({ where: { email } });
  const ok =
    user?.passwordHash &&
    user.status === "ACTIVE" &&
    (await bcrypt.compare(input.password, user.passwordHash));

  if (!user || !ok) {
    // identical message for unknown email / wrong password / deactivated (no account enumeration)
    await recordLoginFailure(client, `login:${email}`, LOGIN_LOCKOUT_THRESHOLD, LOGIN_LOCKOUT_MS);
    return { ok: false, error: "Invalid email or password" };
  }

  await clearLoginFailures(client, `login:${email}`);
  return {
    ok: true,
    data: {
      userId: user.id,
      orgId: user.orgId,
      role: user.role,
      emailVerified: user.emailVerifiedAt !== null,
    },
  };
}

// ---------- Password reset ----------

// Always returns ok:true — never reveals whether an address has an account.
export async function requestPasswordReset(
  client: DbClient,
  email: string
): Promise<Result<{ sent: boolean }>> {
  const normalized = email.toLowerCase().trim();
  const user = await client.user.findUnique({ where: { email: normalized } });
  if (!user || user.status !== "ACTIVE" || !user.passwordHash || !isEmailConfigured())
    return { ok: true, data: { sent: false } };

  const token = newToken();
  await client.authToken.create({
    data: {
      userId: user.id,
      email: normalized,
      tokenHash: sha256(token),
      type: "PASSWORD_RESET",
      expiresAt: new Date(Date.now() + PASSWORD_RESET_TTL_MS),
    },
  });
  await sendEmail(
    user.orgId,
    normalized,
    "Reset your Brainwhite password",
    resetEmailHtml(emailLink("/reset-password", token)),
    { html: true, client }
  );
  return { ok: true, data: { sent: true } };
}

export async function resetPasswordWithToken(
  client: DbClient,
  input: { token: string; password: string }
): Promise<Result<{ userId: string }>> {
  const pw = passwordSchema.safeParse(input.password);
  if (!pw.success) return { ok: false, error: pw.error.issues[0].message };

  const authToken = await client.authToken.findUnique({ where: { tokenHash: sha256(input.token) } });
  if (!authToken || authToken.type !== "PASSWORD_RESET" || authToken.usedAt || authToken.expiresAt < new Date())
    return { ok: false, code: "reset_token_invalid", error: "This reset link is invalid or expired. Request a new one." };

  const user = await client.user.findUnique({ where: { id: authToken.userId } });
  if (!user || user.status !== "ACTIVE")
    return { ok: false, code: "reset_token_invalid", error: "This reset link is invalid or expired. Request a new one." };

  await client.user.update({
    where: { id: user.id },
    data: { passwordHash: await bcrypt.hash(pw.data, 12) },
  });
  // single-use: burn this token and any other outstanding reset tokens for the user
  await client.authToken.updateMany({
    where: { userId: user.id, type: "PASSWORD_RESET", usedAt: null },
    data: { usedAt: new Date() },
  });
  await clearLoginFailures(client, `login:${user.email}`);
  // security: every existing session is invalidated after a password change
  await client.session.deleteMany({ where: { userId: user.id } });
  return { ok: true, data: { userId: user.id } };
}

// ---------- Email verification ----------

export async function issueEmailVerification(
  client: DbClient,
  userId: string,
  email?: string
): Promise<boolean> {
  const user = await client.user.findUnique({ where: { id: userId } });
  if (!user) return false;
  if (user.emailVerifiedAt) return false;
  if (!isEmailConfigured()) return false;

  const token = newToken();
  await client.authToken.create({
    data: {
      userId,
      email: email ?? user.email,
      tokenHash: sha256(token),
      type: "EMAIL_VERIFICATION",
      expiresAt: new Date(Date.now() + EMAIL_VERIFICATION_TTL_MS),
    },
  });
  await sendEmail(
    user.orgId,
    user.email,
    "Verify your Brainwhite email",
    verificationEmailHtml(emailLink("/verify-email", token)),
    { html: true, client }
  );
  return true;
}

export async function verifyEmailWithToken(
  client: DbClient,
  token: string
): Promise<Result<{ userId: string }>> {
  const authToken = await client.authToken.findUnique({ where: { tokenHash: sha256(token) } });
  if (!authToken || authToken.type !== "EMAIL_VERIFICATION" || authToken.usedAt || authToken.expiresAt < new Date())
    return { ok: false, code: "verify_token_invalid", error: "This verification link is invalid or expired." };

  const user = await client.user.findUnique({ where: { id: authToken.userId } });
  if (!user) return { ok: false, code: "verify_token_invalid", error: "This verification link is invalid or expired." };

  await client.user.update({ where: { id: user.id }, data: { emailVerifiedAt: new Date() } });
  await client.authToken.update({ where: { id: authToken.id }, data: { usedAt: new Date() } });
  return { ok: true, data: { userId: user.id } };
}

// ---------- OAuth (Google / GitHub) ----------

export type OAuthProfile = {
  provider: "GOOGLE" | "GITHUB";
  providerUserId: string;
  email: string | null;
  emailVerified: boolean;
  name: string;
  username: string | null;
  accessToken: string;
};

// Resolve an OAuth profile to a user: link by provider id, then by verified email,
// otherwise (signup mode only) create an org + owner account.
export async function resolveOAuthUser(
  client: DbClient,
  profile: OAuthProfile,
  mode: "login" | "signup"
): Promise<Result<{ userId: string; linked: boolean }>> {
  const linked = await client.oAuthAccount.findUnique({
    where: { provider_providerUserId: { provider: profile.provider, providerUserId: profile.providerUserId } },
    include: { user: true },
  });
  if (linked) {
    if (linked.user.status !== "ACTIVE")
      return { ok: false, error: "This account has been deactivated" };
    await client.oAuthAccount.update({
      where: { id: linked.id },
      data: { email: linked.email },
    });
    return { ok: true, data: { userId: linked.userId, linked: true } };
  }

  if (profile.email && profile.emailVerified) {
    const byEmail = await client.user.findUnique({ where: { email: profile.email.toLowerCase() } });
    if (byEmail) {
      if (byEmail.status !== "ACTIVE")
        return { ok: false, error: "This account has been deactivated" };
      if (mode === "signup")
        return { ok: false, error: "An account with this email already exists. Sign in instead." };
      await client.oAuthAccount.create({
        data: {
          provider: profile.provider,
          providerUserId: profile.providerUserId,
          userId: byEmail.id,
          email: profile.email.toLowerCase(),
        },
      });
      if (profile.provider === "GITHUB") {
        await client.user.update({
          where: { id: byEmail.id },
          data: { githubUsername: profile.username, githubUserId: profile.providerUserId },
        });
      }
      return { ok: true, data: { userId: byEmail.id, linked: true } };
    }
  }

  if (mode === "login")
    return {
      ok: false,
      code: "oauth_no_account",
      error:
        profile.provider === "GOOGLE"
          ? "No Brainwhite account uses this Google profile. Create an account first."
          : "No Brainwhite account uses this GitHub profile. Create an account first.",
    };

  if (!profile.email)
    return {
      ok: false,
      code: "oauth_no_email",
      error:
        profile.provider === "GOOGLE"
          ? "Your Google account did not share an email address. Use email sign-up instead."
          : "Your GitHub account did not share a verified email address. Add one at github.com/settings/emails, then retry.",
    };

  const email = profile.email.toLowerCase();
  const base = slugify(profile.name || email.split("@")[0]) || "workspace";
  let slug = base;
  for (let i = 2; await client.organisation.findUnique({ where: { slug } }); i++) {
    slug = `${base}-${i}`;
  }
  const org = await client.organisation.create({
    data: { name: profile.name || email.split("@")[0], slug },
  });
  const user = await client.user.create({
    data: { orgId: org.id, name: profile.name || email.split("@")[0], email, role: "OWNER" },
  });
  await client.oAuthAccount.create({
    data: {
      provider: profile.provider,
      providerUserId: profile.providerUserId,
      userId: user.id,
      email,
    },
  });
  if (profile.provider === "GITHUB") {
    await client.user.update({
      where: { id: user.id },
      data: { githubUsername: profile.username, githubUserId: profile.providerUserId },
    });
  }
  return { ok: true, data: { userId: user.id, linked: false } };
}

// ---------- Transactional helpers (used by route handlers / server actions) ----------
export const signupTx = (input: SignupInput) => db.$transaction((tx) => signupWithPassword(tx, input));
export const loginTx = (input: { email: string; password: string }) => loginWithPassword(db, input);
export const requestResetTx = (email: string) => requestPasswordReset(db, email);
export const resetTx = (input: { token: string; password: string }) => resetPasswordWithToken(db, input);
export const verifyEmailTx = (token: string) => verifyEmailWithToken(db, token);

// ---------- Email templates (plain-text-safe minimal HTML) ----------

function resetEmailHtml(link: string) {
  return `<p>Reset your Brainwhite password:</p><p><a href="${link}">Choose a new password</a></p><p>This link expires in 1 hour. If you did not request a reset, ignore this email.</p>`;
}

function verificationEmailHtml(link: string) {
  return `<p>Verify your Brainwhite email address:</p><p><a href="${link}">Verify email</a></p><p>This link expires in 24 hours.</p>`;
}
