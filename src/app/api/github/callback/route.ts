import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { encrypt } from "@/lib/crypto";
import { audit } from "@/lib/audit";

export async function GET(req: NextRequest) {
  const me = await requireUser();
  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  if (!code || !state || state !== req.cookies.get("gh_state")?.value)
    return NextResponse.redirect(new URL("/connect-github?error=state", req.url));

  const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: process.env.GITHUB_CLIENT_ID,
      client_secret: process.env.GITHUB_CLIENT_SECRET,
      code,
    }),
  });
  const { access_token } = await tokenRes.json();
  if (!access_token) return NextResponse.redirect(new URL("/connect-github?error=token", req.url));

  const gh = await (
    await fetch("https://api.github.com/user", {
      headers: { Authorization: `Bearer ${access_token}`, Accept: "application/vnd.github+json" },
    })
  ).json();

  await db.user.update({
    where: { id: me.id },
    data: { githubUserId: String(gh.id), githubUsername: gh.login, githubTokenEnc: encrypt(access_token) },
  });
  await audit(me.orgId, me.id, "github.linked", gh.login);
  return NextResponse.redirect(new URL("/learn", req.url));
}
