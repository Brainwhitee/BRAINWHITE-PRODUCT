import { NextResponse, NextRequest } from "next/server";
import { newToken } from "@/lib/crypto";
import { appUrl } from "@/lib/config";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const mode = searchParams.get("mode") === "signup" ? "signup" : "login";
    const redirectParam = searchParams.get("redirect");

    if (!process.env.GOOGLE_CLIENT_ID) {
      const url = new URL("/login", req.url);
      url.searchParams.set("error", "google_not_configured");
      return NextResponse.redirect(url);
    }

    // Determine the base URL: prefer incoming request origin so it works in any preview/custom domain
    const base = req.nextUrl.origin && !req.nextUrl.origin.includes("0.0.0.0")
      ? req.nextUrl.origin
      : appUrl();
    const redirectUri = `${base}/api/auth/google/callback`;

    const state = newToken();
    const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    url.searchParams.set("client_id", process.env.GOOGLE_CLIENT_ID);
    url.searchParams.set("response_type", "code");
    url.searchParams.set("scope", "openid email profile");
    url.searchParams.set("state", state);
    url.searchParams.set("redirect_uri", redirectUri);
    url.searchParams.set("prompt", "select_account");

    const res = NextResponse.redirect(url);
    res.cookies.set("g_state", state, { httpOnly: true, sameSite: "lax", maxAge: 600, path: "/" });
    res.cookies.set("g_mode", mode, { httpOnly: true, sameSite: "lax", maxAge: 600, path: "/" });
    res.cookies.set("g_redirect_uri", redirectUri, { httpOnly: true, sameSite: "lax", maxAge: 600, path: "/" });
    if (redirectParam && redirectParam.startsWith("/") && !redirectParam.startsWith("//")) {
      res.cookies.set("auth_redirect", redirectParam, { httpOnly: true, sameSite: "lax", maxAge: 600, path: "/" });
    }
    return res;
  } catch (err: unknown) {
    console.error("Google OAuth start error:", err);
    const url = new URL("/login", req.url);
    url.searchParams.set("error", "google_token_failed");
    return NextResponse.redirect(url);
  }
}
