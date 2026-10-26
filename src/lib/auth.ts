import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "./db";
import { newToken, sha256 } from "./crypto";
import { can, type Permission } from "./rbac";

const COOKIE = "pd_session";
const TTL_MS = 7 * 24 * 60 * 60 * 1000;

export async function createSession(userId: string) {
  const token = newToken();
  await db.session.create({
    data: { userId, tokenHash: sha256(token), expiresAt: new Date(Date.now() + TTL_MS) },
  });
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: TTL_MS / 1000,
  });
}

export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (token) await db.session.deleteMany({ where: { tokenHash: sha256(token) } });
  jar.delete(COOKIE);
}

export async function getUser() {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  const s = await db.session.findUnique({
    where: { tokenHash: sha256(token) },
    include: { user: { include: { org: true } } },
  });
  if (!s || s.expiresAt < new Date() || s.user.status !== "ACTIVE") return null;
  return s.user;
}

export async function requireUser() {
  const u = await getUser();
  if (!u) redirect("/login");
  return u;
}

// Gate for staff pages: throws redirect for candidates / missing permission
export async function requirePermission(perm: Permission) {
  const u = await requireUser();
  if (!can(u.role, perm)) redirect(u.role === "CANDIDATE" ? "/learn" : "/dashboard");
  return u;
}

export const homeFor = (role: string) => (role === "CANDIDATE" ? "/learn" : "/dashboard");
