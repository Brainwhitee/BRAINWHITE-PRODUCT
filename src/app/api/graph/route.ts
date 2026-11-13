import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { can } from "@/lib/rbac";
import { loadGraph } from "@/lib/graph-data";
import { loadMap, loadLearningOverlay } from "@/lib/graph-map";
import type { GraphLevel } from "@/lib/graph";

// Graph for the explorer, scoped to the caller's org. Staff (codebase:view) and candidates with an assignment may read it.
export async function GET(req: NextRequest) {
  const me = await getUser();
  if (!me) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const sp = req.nextUrl.searchParams;
  const repoId = sp.get("repoId") ?? "";
  const levelParam = sp.get("level") ?? "module";
  const level = levelParam as GraphLevel;
  if (!["module", "file", "symbol", "full"].includes(levelParam)) return NextResponse.json({ error: "bad level" }, { status: 400 });

  const repo = await db.repository.findFirst({ where: { id: repoId, orgId: me.orgId }, select: { id: true } });
  if (!repo) return NextResponse.json({ error: "not found" }, { status: 404 });
  if (!can(me.role, "codebase:view") && !(await db.assignment.findFirst({ where: { userId: me.id, orgId: me.orgId }, select: { id: true } })))
    return NextResponse.json({ error: "forbidden" }, { status: 403 });

  if (levelParam === "full") {
    const map = await loadMap(repo.id);
    const aid = sp.get("assignmentId");
    if (aid) {
      const own = await db.assignment.findFirst({ where: { id: aid, userId: me.id, orgId: me.orgId }, select: { id: true } });
      if (own) map.learning = await loadLearningOverlay(own.id, repo.id);
    }
    return NextResponse.json(map);
  }

  const data = await loadGraph(repo.id, level, sp.get("focus"));
  if (!data) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(data);
}
