import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { db } from "@/lib/db";

// Active-time heartbeats (client sends only while the tab is visible and the user was recently active) and notes.
export async function POST(req: NextRequest) {
  const me = await getUser();
  if (!me) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const b = await req.json();
  const a = await db.assignment.findFirst({ where: { id: String(b.assignmentId), userId: me.id } });
  const item = a && (await db.pathItem.findFirst({ where: { id: String(b.itemId), section: { pathId: a.pathId } } }));
  if (!a || !item) return NextResponse.json({ error: "not found" }, { status: 404 });

  if (b.type === "TIME") {
    const secs = Math.min(Math.max(Number(b.value) || 0, 0), 60);
    await db.progressEvent.create({ data: { assignmentId: a.id, userId: me.id, itemId: item.id, type: "TIME", value: secs } });
  } else if (b.type === "NOTE") {
    await db.note.upsert({
      where: { userId_itemId: { userId: me.id, itemId: item.id } },
      update: { body: String(b.body ?? "").slice(0, 20000) },
      create: { userId: me.id, itemId: item.id, body: String(b.body ?? "").slice(0, 20000) },
    });
  }
  return NextResponse.json({ ok: true });
}
