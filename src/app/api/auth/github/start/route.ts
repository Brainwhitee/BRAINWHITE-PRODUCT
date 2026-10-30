import { NextResponse, NextRequest } from "next/server";
import { newToken } from "@/lib/crypto";
import { appUrl } from "@/lib/config";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("mode") ?? "login";
  const redirectParam = searchParams.get("redirect");

  if (!process.env.GITHUB_CLIENT_ID) {
    const url = new URL("/login", req.url);
    url.searchParams.set("error", "github_not_configured");
    return NextResponse.redirect(url);
  }

  const state = newToken();
  const url = new URL("https://github.com/login/oauth/authorize");
  url.searchParams.set("client_id", process.env.GITHUB_CLIENT_ID);
  url.searchParams.set("scope", "read:user user:email");
  url.searchParams.set("state", state);
  url.searchParams.set("redirect_uri", `${appUrl()}/api/auth/github/callback`);
  url.searchParams.set("mode", mode);

  const res = NextResponse.redirect(url);
  res.cookies.set("gh_state", state, { httpOnly: true, sameSite: "lax", maxAge: 600, path: "/" });
  res.cookies.set("gh_mode", mode, { httpOnly: true, sameSite: "lax", maxAge: 600, path: "/" });
  if (redirectParam && redirectParam.startsWith("/") && !redirectParam.startsWith("//")) {
    res.cookies.set("auth_redirect", redirectParam, { httpOnly: true, sameSite: "lax", maxAge: 600, path: "/" });
  }
  return res;
}
