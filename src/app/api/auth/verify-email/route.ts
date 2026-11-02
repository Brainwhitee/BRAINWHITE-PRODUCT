import { NextRequest, NextResponse } from "next/server";
import { verifyEmailWithToken } from "@/lib/domain/auth";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  const wantsJson =
    req.headers.get("accept")?.includes("application/json") ||
    req.nextUrl.searchParams.get("format") === "json";

  if (!token) {
    if (wantsJson) {
      return NextResponse.json({ error: "missing_token" }, { status: 400 });
    }
    return NextResponse.redirect(new URL("/verify-email?error=missing_token", req.url));
  }

  const result = await verifyEmailWithToken(db, token);
  if (!result.ok) {
    const code = result.code ?? "verify_failed";
    if (wantsJson) {
      return NextResponse.json({ error: code }, { status: 400 });
    }
    return NextResponse.redirect(
      new URL(`/verify-email?error=${encodeURIComponent(code)}`, req.url)
    );
  }

  // If called via client-side fetch (JSON expected)
  if (wantsJson) {
    return NextResponse.json({ success: true, verified: true });
  }

  // If clicked directly in email (browser GET), redirect to verified success view
  return NextResponse.redirect(
    new URL(`/verify-email?token=${encodeURIComponent(token)}&verified=true`, req.url)
  );
}
