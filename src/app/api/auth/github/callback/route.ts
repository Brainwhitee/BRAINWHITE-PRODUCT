import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createSession, getUser, homeFor } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { resolveOAuthUser } from "@/lib/domain/auth";
import { decrypt, encrypt } from "@/lib/crypto";
import { appUrl } from "@/lib/config";

interface StatePayload {
  nonce?: string;
  mode?: "login" | "signup" | "link";
  userId?: string | null;
  redirectUri?: string | null;
  authRedirect?: string | null;
  createdAt?: number;
}

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  const rawCookieMode = req.cookies.get("gh_mode")?.value;
  const expectedStateCookie = req.cookies.get("gh_state")?.value;

  // 1. Decrypt state payload if encrypted (resilient to cookie drops across webviews/mobile browsers)
  let statePayload: StatePayload | null = null;
  if (state) {
    try {
      const decrypted = decrypt(state);
      statePayload = JSON.parse(decrypted) as StatePayload;
    } catch {
      // State may be plain random token from older sessions
    }
  }

  // Determine mode: prioritize verified payload, fallback to cookie, fallback to "login"
  const mode: "login" | "signup" | "link" =
    statePayload?.mode === "link" || rawCookieMode === "link"
      ? "link"
      : statePayload?.mode === "signup" || rawCookieMode === "signup"
      ? "signup"
      : "login";

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
    if (!code || !state) {
      return fail("github_state_invalid");
    }

    // Validate state integrity: either verified via AES-256-GCM payload or matching cookie
    const isPayloadValid =
      statePayload?.createdAt && Date.now() - statePayload.createdAt < 15 * 60 * 1000;
    const isCookieMatch = expectedStateCookie && state === expectedStateCookie;

    if (!isPayloadValid && !isCookieMatch) {
      return fail("github_state_invalid");
    }

    if (!process.env.GITHUB_CLIENT_ID || !process.env.GITHUB_CLIENT_SECRET) {
      return fail("github_not_configured");
    }

    // Determine redirectUri used during start (required to match by GitHub OAuth RFC 6749)
    const base = req.nextUrl.origin && !req.nextUrl.origin.includes("0.0.0.0")
      ? req.nextUrl.origin
      : appUrl();
    const redirectUri =
      statePayload?.redirectUri ||
      req.cookies.get("gh_redirect_uri")?.value ||
      `${base}/api/auth/github/callback`;

    // 2. Exchange authorization code for access token (with redirect_uri included)
    const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
        redirect_uri: redirectUri,
      }),
    });

    const tokenJson = await tokenRes.json();
    const accessToken = tokenJson.access_token as string | undefined;
    if (!accessToken) {
      console.error("GitHub token exchange error:", tokenJson);
      return fail("github_token_failed");
    }

    // 3. Fetch GitHub User Profile
    const ghHeaders = {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/vnd.github+json",
      "User-Agent": "brainwhite",
    };
    const ghRes = await fetch("https://api.github.com/user", { headers: ghHeaders });
    if (!ghRes.ok) {
      console.error("GitHub API /user fetch failed:", await ghRes.text());
      return fail("github_token_failed");
    }
    const gh = await ghRes.json();

    // 4. MODE = LINK (candidate or user connecting their GitHub account)
    if (mode === "link") {
      let me = await getUser();

      // If session was dropped during cross-site navigation, restore it using verified state userId
      if (!me && statePayload?.userId) {
        const found = await db.user.findUnique({
          where: { id: statePayload.userId },
          include: { org: true },
        });
        if (found && found.status === "ACTIVE") {
          me = found;
          await createSession(me.id);
        }
      }

      if (!me) {
        return fail("unauthorized");
      }

      // Update user with GitHub identity and encrypted token
      await db.user.update({
        where: { id: me.id },
        data: {
          githubUserId: String(gh.id),
          githubUsername: gh.login,
          githubTokenEnc: encrypt(accessToken),
        },
      });

      // Keep OAuthAccount in sync for future 1-click login
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

    // 5. MODE = LOGIN / SIGNUP
    let email = typeof gh.email === "string" && gh.email ? gh.email : null;

    // Fetch verified primary email if not visible on profile
    if (!email) {
      try {
        const emails = (await (
          await fetch("https://api.github.com/user/emails", { headers: ghHeaders })
        ).json()) as { email: string; primary: boolean; verified: boolean }[] | undefined;
        const primary = Array.isArray(emails) ? emails.find((e) => e.primary && e.verified) : undefined;
        email = primary?.email ?? null;
      } catch (e) {
        console.warn("Could not fetch user emails from GitHub:", e);
      }
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

    const authRedirect =
      statePayload?.authRedirect || req.cookies.get("auth_redirect")?.value;
    const target =
      authRedirect && authRedirect.startsWith("/") && !authRedirect.startsWith("//")
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
