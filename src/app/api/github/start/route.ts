import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { newToken } from "@/lib/crypto";

export async function GET() {
  await requireUser();
  const state = newToken();
  const url = new URL("https://github.com/login/oauth/authorize");
  url.searchParams.set("client_id", process.env.GITHUB_CLIENT_ID ?? "");
  url.searchParams.set("scope", "read:user user:email"); // identity only
  url.searchParams.set("state", state);
  url.searchParams.set("redirect_uri", `${process.env.APP_URL}/api/github/callback`);
  const res = NextResponse.redirect(url);
  res.cookies.set("gh_state", state, { httpOnly: true, sameSite: "lax", maxAge: 600, path: "/" });
  return res;
}
