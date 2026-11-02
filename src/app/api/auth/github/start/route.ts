import { NextResponse, NextRequest } from "next/server";
import { encrypt, newToken } from "@/lib/crypto";
import { appUrl } from "@/lib/config";
import { getUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const mode = searchParams.get("mode") ?? "login";
    const redirectParam = searchParams.get("redirect");

    if (!process.env.GITHUB_CLIENT_ID) {
      const url = new URL("/login", req.url);
      url.searchParams.set("error", "github_not_configured");
      return NextResponse.redirect(url);
    }

    // Accurate protocol and host resolution behind Vercel / Cloudflare edge proxies
    const host = req.headers.get("x-forwarded-host") || req.nextUrl.host;
    const proto = req.headers.get("x-forwarded-proto") || (host.includes("localhost") ? "http" : "https");
    const base = host && !host.includes("0.0.0.0") ? `${proto}://${host}` : appUrl();
    const redirectUri = `${base}/api/auth/github/callback`;

    // Attempt to identify current user if linking
    const me = await getUser();

    // Cryptographically signed self-contained state payload (AES-256-GCM)
    // Ensures immunity against cookie drops across browsers, mobile webviews, or strict privacy modes
    const statePayload = {
      nonce: newToken(),
      mode,
      userId: me?.id ?? null,
      redirectUri,
      authRedirect: redirectParam && redirectParam.startsWith("/") && !redirectParam.startsWith("//") ? redirectParam : null,
      createdAt: Date.now(),
    };
    const state = encrypt(JSON.stringify(statePayload));

    const url = new URL("https://github.com/login/oauth/authorize");
    url.searchParams.set("client_id", process.env.GITHUB_CLIENT_ID.trim());
    url.searchParams.set("scope", "read:user user:email");
    url.searchParams.set("state", state);
    url.searchParams.set("redirect_uri", redirectUri);

    const res = NextResponse.redirect(url);
    const cookieOpts = {
      httpOnly: true,
      sameSite: "lax" as const,
      secure: process.env.NODE_ENV === "production",
      maxAge: 900,
      path: "/",
    };

    res.cookies.set("gh_state", state, cookieOpts);
    res.cookies.set("gh_mode", mode, cookieOpts);
    res.cookies.set("gh_redirect_uri", redirectUri, cookieOpts);
    if (statePayload.authRedirect) {
      res.cookies.set("auth_redirect", statePayload.authRedirect, cookieOpts);
    }

    return res;
  } catch (err: unknown) {
    console.error("GitHub OAuth start error:", err);
    const url = new URL("/login", req.url);
    url.searchParams.set("error", "github_token_failed");
    return NextResponse.redirect(url);
  }
}
