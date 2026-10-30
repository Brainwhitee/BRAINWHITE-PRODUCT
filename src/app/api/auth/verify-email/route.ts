import { NextRequest, NextResponse } from "next/server";
import { verifyEmailWithToken } from "@/lib/domain/auth";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  if (!token) {
    return NextResponse.redirect(new URL("/verify-email?error=missing_token", req.url));
  }

  const result = await verifyEmailWithToken(db, token);
  if (!result.ok) {
    return NextResponse.redirect(new URL(`/verify-email?error=${encodeURIComponent(result.code ?? "verify_failed")}`, req.url));
  }

  // Success: redirect to verify page with token so client shows success state
  return NextResponse.redirect(new URL(`/verify-email?token=${encodeURIComponent(token)}`, req.url));
}