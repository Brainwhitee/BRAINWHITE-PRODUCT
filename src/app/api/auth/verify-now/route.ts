import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  await db.user.update({
    where: { id: user.id },
    data: { emailVerifiedAt: new Date() },
  });

  return NextResponse.json({ success: true });
}
