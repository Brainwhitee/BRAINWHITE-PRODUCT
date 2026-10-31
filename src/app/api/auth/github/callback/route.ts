import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createSession, getUser, homeFor } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { resolveOAuthUser } from "@/lib/domain/auth";
import { encrypt } from "@/lib/crypto";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  const rawMode = req.cookies.get("gh_mode")?.value;
  const mode = rawMode === "link" ? "link" : rawMode === "signup" ? "signup" : "login";
  const expectedState = req.cookies.get("gh_state")?.value;

  const fail = (reason: string) => {
    const targetPath = mode === "link" ? "/connect-github" : "/login";
    const url = new URL(targetPath, req.url);
    url.searchParams.set("error", reason);
    const res = NextResponse.redirect(url);
    res.cookies.delete("gh_state");
    res.cookies.delete("gh_mode");
    res.cookies.delete("gh_redirect_uri");
    res.cookies.delete("auth_redirect");
    return res;
  };

  try {
    if (!code || !state || state !== expectedState) return fail("github_state_invalid");
    if (!process.env.GITHUB_CLIENT_ID || !process.env.GITHUB_CLIENT_SECRET) {
      return fail("github_not_configured");
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
    const accessToken = tokenJson.access_token as string | undefined;
    if (!accessToken) {
      console.error("GitHub token exchange error:", tokenJson);
      return fail("github_token_failed");
    }

    const ghHeaders = {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/vnd.github+json",
      "User-Agent": "brainwhite",
    };
    const gh = await (await fetch("https://api.github.com/user", { headers: ghHeaders })).json();

    // MODE = LINK (candidate linking their GitHub account)
    if (mode === "link") {
      const me = await getUser();
      if (!me) {
        return fail("unauthorized");
      }

      await db.user.update({
        where: { id: me.id },
        data: {
          githubUserId: String(gh.id),
          githubUsername: gh.login,
          githubTokenEnc: encrypt(accessToken),
        },
      });

      // Keep OAuthAccount in sync for 1-click login
      await db.oAuthAccount.upsert({
        where: {
          provider_providerUserId: {
            provider: "GITHUB",
            providerUserId: String(gh.id),
          },
        },
        update: {
          userId: me.id,
          email: typeof gh.email === "string" && gh.email ? gh.email.toLowerCase() : undefined,
        },
        create: {
          provider: "GITHUB",
          providerUserId: String(gh.id),
          userId: me.id,
          email: typeof gh.email === "string" && gh.email ? gh.email.toLowerCase() : me.email,
        },
      });

      await audit(me.orgId, me.id, "github.linked", gh.login);

      const res = NextResponse.redirect(new URL("/learn", req.url));
      res.cookies.delete("gh_state");
      res.cookies.delete("gh_mode");
      res.cookies.delete("gh_redirect_uri");
      res.cookies.delete("auth_redirect");
      return res;
    }

    // MODE = LOGIN / SIGNUP
    let email = typeof gh.email === "string" && gh.email ? gh.email : null;

    // Private emails are not on /user — ask the emails endpoint for a verified primary.
    if (!email) {
      const emails = (await (await fetch("https://api.github.com/user/emails", { headers: ghHeaders })).json()) as
        | { email: string; primary: boolean; verified: boolean }[]
        | undefined;
      const primary = Array.isArray(emails) ? emails.find((e) => e.primary && e.verified) : undefined;
      email = primary?.email ?? null;
    }
    const emailVerified = Boolean(email);

    const resolved = await resolveOAuthUser(
      db,
      {
        provider: "GITHUB",
        providerUserId: String(gh.id),
        email,
        emailVerified,
        name: String(gh.name ?? "").trim() || String(gh.login ?? "GitHub User"),
        username: String(gh.login ?? "") || null,
        accessToken,
      },
      mode
    );
    if (!resolved.ok) {
      const errCode = resolved.code === "oauth_no_email" ? "github_no_email" : "github_no_account";
      return fail(errCode);
    }

    const user = await db.user.findUniqueOrThrow({ where: { id: resolved.data.userId } });
    await audit(
      user.orgId,
      user.id,
      resolved.data.linked ? "auth.login_github" : "auth.signup_github"
    );
    await createSession(user.id);
    const authRedirect = req.cookies.get("auth_redirect")?.value;
    const target = authRedirect && authRedirect.startsWith("/") && !authRedirect.startsWith("//")
      ? authRedirect
      : homeFor(user.role);
    const res = NextResponse.redirect(new URL(target, req.url));
    res.cookies.delete("gh_state");
    res.cookies.delete("gh_mode");
    res.cookies.delete("gh_redirect_uri");
    res.cookies.delete("auth_redirect");
    return res;
  } catch (err: unknown) {
    console.error("GitHub OAuth callback exception:", err);
    return fail("github_token_failed");
  }
}
