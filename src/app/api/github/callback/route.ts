import { NextRequest, NextResponse } from "next/server";

// 307 Forwarder to unified OAuth callback endpoint
export async function GET(req: NextRequest) {
  const url = new URL("/api/auth/github/callback", req.url);
  url.search = req.nextUrl.search;
  return NextResponse.redirect(url, 307);
}
