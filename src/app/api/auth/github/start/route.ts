import { NextResponse, NextRequest } from "next/server";
import { newToken } from "@/lib/crypto";

export async function GET(req: NextRequest) {
  if (!process.env.GITHUB_CLIENT_ID) {
    const url = new URL("/login", req.url);
    url.searchParams.set("error", "GitHub authentication is not configured yet. Please use email login instead.");
    return NextResponse.redirect(url);
  }

  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("mode") ?? "login";

  const state = newToken();
  const url = new URL("https://github.com/login/oauth/authorize");
  url.searchParams.set("client_id", process.env.GITHUB_CLIENT_ID);
  url.searchParams.set("scope", "read:user user:email");
  url.searchParams.set("state", state);
  url.searchParams.set("redirect_uri", `${process.env.APP_URL}/api/auth/github/callback`);
  url.searchParams.set("mode", mode);

  const res = NextResponse.redirect(url);
  res.cookies.set("gh_state", state, { httpOnly: true, sameSite: "lax", maxAge: 600, path: "/" });
  res.cookies.set("gh_mode", mode, { httpOnly: true, sameSite: "lax", maxAge: 600, path: "/" });
  return res;
}
