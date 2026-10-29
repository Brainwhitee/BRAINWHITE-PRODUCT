import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createSession, homeFor } from "@/lib/auth";
import { encrypt } from "@/lib/crypto";
import { audit } from "@/lib/audit";

const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  const mode = req.cookies.get("gh_mode")?.value ?? "login";

  const expectedState = req.cookies.get("gh_state")?.value;
  const expectedMode = req.cookies.get("gh_mode")?.value;
  if (!code || !state || state !== expectedState) {
    return NextResponse.redirect(new URL("/login?error=github_state_invalid", req.url));
  }

  if (!process.env.GITHUB_CLIENT_ID || !process.env.GITHUB_CLIENT_SECRET) {
    return NextResponse.redirect(new URL("/login?error=github_not_configured", req.url));
  }

  const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: process.env.GITHUB_CLIENT_ID,
      client_secret: process.env.GITHUB_CLIENT_SECRET,
      code,
    }),
  });
  const tokenJson = await tokenRes.json();
  const access_token = tokenJson.access_token as string | undefined;
  if (!access_token) {
    return NextResponse.redirect(new URL("/login?error=github_token_failed", req.url));
  }

  const gh = await (
    await fetch("https://api.github.com/user", {
      headers: { Authorization: `Bearer ${access_token}`, Accept: "application/vnd.github+json" },
    })
  ).json();

  const githubUserId = String(gh.id);
  const githubUsername = String(gh.login ?? "");
  const ghEmail = String(gh.email ?? "");

  // Try to find existing user by GitHub ID
  let user = await db.user.findFirst({ where: { githubUserId }, include: { org: true } });

  if (!user && ghEmail) {
    // Try to find by email (link existing account to GitHub)
    user = await db.user.findUnique({ where: { email: ghEmail.toLowerCase() }, include: { org: true } });
    if (user) {
      await db.user.update({
        where: { id: user.id },
        data: { githubUserId, githubUsername, githubTokenEnc: encrypt(access_token) },
      });
      await audit(user.orgId, user.id, "github.linked", githubUsername);
      await createSession(user.id);
      return NextResponse.redirect(new URL(homeFor(user.role), req.url));
    }
  }

  if (user) {
    // Existing GitHub-linked user: log in
    await audit(user.orgId, user.id, "auth.login_github");
    await createSession(user.id);
    return NextResponse.redirect(new URL(homeFor(user.role), req.url));
  }

  // No existing user
  if (mode === "login") {
    return NextResponse.redirect(new URL("/login?error=github_account_not_found", req.url));
  }

  // Signup mode: create organisation + user from GitHub profile
  const orgName = gh.name || `${githubUsername}'s Workspace`;
  const slug = slugify(orgName) || slugify(githubUsername);
  if (await db.organisation.findUnique({ where: { slug } })) {
    return NextResponse.redirect(new URL("/signup?error=org_name_taken", req.url));
  }

  const org = await db.organisation.create({ data: { name: orgName, slug } });
  const newUser = await db.user.create({
    data: {
      orgId: org.id,
      name: githubUsername || gh.name || "GitHub User",
      email: ghEmail.toLowerCase() || `${githubUsername}@github.local`,
      role: "OWNER",
      githubUserId,
      githubUsername,
      githubTokenEnc: encrypt(access_token),
      passwordHash: null,
    },
  });
  await audit(org.id, newUser.id, "org.created_github", org.slug);
  await createSession(newUser.id);
  return NextResponse.redirect(new URL("/dashboard", req.url));
}
