import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { issueEmailVerification } from "@/lib/domain/auth";

export async function POST(req: NextRequest) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const sent = await issueEmailVerification(db, user.id);
  if (!sent) {
    return NextResponse.json(
      { error: "Verification email is not available. Add a Resend key or you are already verified." },
      { status: 400 }
    );
  }

  return NextResponse.json({ success: true });
}