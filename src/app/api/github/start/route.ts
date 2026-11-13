import { NextRequest, NextResponse } from "next/server";

// 307 Forwarder to unified OAuth start endpoint
export async function GET(req: NextRequest) {
  const url = new URL("/api/auth/github/start", req.url);
  url.searchParams.set("mode", "link");
  return NextResponse.redirect(url, 307);
}
