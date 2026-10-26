import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { db } from "@/lib/db";

// Serves (redacted) file content for the workspace code pane, scoped to the caller's org.
export async function GET(req: NextRequest) {
  const me = await getUser();
  if (!me) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const repoId = req.nextUrl.searchParams.get("repoId") ?? "";
  const path = req.nextUrl.searchParams.get("path") ?? "";
  const f = await db.file.findFirst({ where: { repoId, path, repo: { orgId: me.orgId } }, select: { content: true, language: true, path: true } });
  if (!f) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(f);
}
