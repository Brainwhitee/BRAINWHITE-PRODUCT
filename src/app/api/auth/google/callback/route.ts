import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createSession, homeFor } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { resolveOAuthUser } from "@/lib/domain/auth";
import { appUrl } from "@/lib/config";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  const expectedState = req.cookies.get("g_state")?.value;
  const mode = req.cookies.get("g_mode")?.value === "signup" ? "signup" : "login";

  const fail = (reason: string) => {
    const url = new URL("/login", req.url);
    url.searchParams.set("error", reason);
    const res = NextResponse.redirect(url);
    res.cookies.delete("g_state");
    res.cookies.delete("g_mode");
    return res;
  };

  if (!code || !state || state !== expectedState) return fail("google_state_invalid");
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET)
    return fail("google_not_configured");

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      redirect_uri: `${appUrl()}/api/auth/google/callback`,
      grant_type: "authorization_code",
    }),
  });
  const tokenJson = await tokenRes.json();
  const accessToken = tokenJson.access_token as string | undefined;
  if (!accessToken) return fail("google_token_failed");

  const profile = await (
    await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
  ).json();

  const resolved = await resolveOAuthUser(
    db,
    {
      provider: "GOOGLE",
      providerUserId: String(profile.sub),
      email: typeof profile.email === "string" && profile.email ? profile.email.toLowerCase() : null,
      emailVerified: profile.email_verified === true,
      name: String(profile.name ?? "").trim() || "Google User",
      username: null,
      accessToken,
    },
    mode
  );
  if (!resolved.ok) {
    const code = resolved.code === "oauth_no_email" ? "google_no_email" : "google_no_account";
    return fail(code);
  }

  const user = await db.user.findUniqueOrThrow({ where: { id: resolved.data.userId } });
  await audit(user.orgId, user.id, resolved.data.linked ? "auth.login_google_linked" : "auth.signup_google");
  await createSession(user.id);
  const authRedirect = req.cookies.get("auth_redirect")?.value;
  const target = authRedirect && authRedirect.startsWith("/") && !authRedirect.startsWith("//")
    ? authRedirect
    : homeFor(user.role);
  const res = NextResponse.redirect(new URL(target, req.url));
  res.cookies.delete("g_state");
  res.cookies.delete("g_mode");
  res.cookies.delete("auth_redirect");
  return res;
}
