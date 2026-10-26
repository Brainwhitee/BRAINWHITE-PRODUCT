import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { readFile } from "@/lib/storage";

// Private files: only members of the owning org can fetch. Candidates must have the path assigned.
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const me = await getUser();
  if (!me) return new NextResponse("Unauthorized", { status: 401 });
  const { id } = await params;
  const h = await db.handout.findFirst({ where: { id, orgId: me.orgId } });
  if (!h) return new NextResponse("Not found", { status: 404 });
  if (me.role === "CANDIDATE") {
    const a = await db.assignment.findFirst({ where: { userId: me.id, pathId: h.pathId } });
    if (!a) return new NextResponse("Forbidden", { status: 403 });
    // viewer events feed "handouts read" (ADM-21)
    if (h.itemId) await db.progressEvent.create({ data: { assignmentId: a.id, userId: me.id, itemId: h.itemId, type: `HANDOUT:${h.id}` } });
  }
  const bytes = await readFile(h.storageKey);
  return new NextResponse(new Uint8Array(bytes), {
    headers: {
      "Content-Type": h.mime,
      "Content-Disposition": `inline; filename="${encodeURIComponent(h.filename)}"`,
      "X-Content-Type-Options": "nosniff",
    },
  });
}
