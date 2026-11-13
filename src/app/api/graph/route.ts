import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { graphAccess } from "@/lib/domain/graph-access";
import { loadGraph } from "@/lib/graph-data";
import { loadMap, loadLearningOverlay } from "@/lib/graph-map";
import { z } from "zod";
import type { GraphLevel } from "@/lib/graph";

const query = z.object({
  repoId: z.string().min(1).max(64),
  level: z.enum(["module", "file", "symbol", "full"]).default("module"),
  focus: z.string().max(512).nullish(),
  assignmentId: z.string().max(64).nullish(),
});

// Graph for the explorer, scoped to the caller's org. Staff (codebase:view) and candidates with an assignment may read it.
export async function GET(req: NextRequest) {
  const me = await getUser();
  if (!me) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const sp = req.nextUrl.searchParams;
  const parsed = query.safeParse({ repoId: sp.get("repoId") ?? "", level: sp.get("level") ?? undefined, focus: sp.get("focus"), assignmentId: sp.get("assignmentId") });
  if (!parsed.success) return NextResponse.json({ error: "bad request" }, { status: 400 });
  const { repoId, level: levelParam, focus, assignmentId: aid } = parsed.data;
  const level = levelParam as GraphLevel;

  const access = await graphAccess(db, me, repoId);
  if (access === "not_found") return NextResponse.json({ error: "not found" }, { status: 404 });
  if (access === "forbidden") return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const repo = { id: repoId };

  if (levelParam === "full") {
    const map = await loadMap(repo.id);
    if (aid) {
      const own = await db.assignment.findFirst({ where: { id: aid, userId: me.id, orgId: me.orgId }, select: { id: true } });
      if (own) { const l = await loadLearningOverlay(own.id, repo.id); map.learning = l.status; map.learningOrder = l.order; }
    }
    return NextResponse.json(map);
  }

  const data = await loadGraph(repo.id, level, focus ?? null);
  if (!data) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(data);
}
