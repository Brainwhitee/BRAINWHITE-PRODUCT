import { NextRequest, NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import { db } from "@/lib/db";
import { processGithubEvent } from "@/lib/domain/github";

// GitHub App / repo webhook receiver. Signature is mandatory in production.
export async function POST(req: NextRequest) {
  const raw = await req.text();
  const secret = process.env.GITHUB_WEBHOOK_SECRET;
  if (secret) {
    const sig = req.headers.get("x-hub-signature-256") ?? "";
    const expected = "sha256=" + createHmac("sha256", secret).update(raw).digest("hex");
    const ok = sig.length === expected.length && timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
    if (!ok) return NextResponse.json({ error: "bad signature" }, { status: 401 });
  } else if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "webhook secret not configured" }, { status: 503 });
  }

  const event = req.headers.get("x-github-event") ?? "";
  const payload = JSON.parse(raw);
  const full = payload.repository?.full_name;
  if (!full) return NextResponse.json({ ok: true, note: "no repository" });
  const repos = await db.repository.findMany({ where: { source: "github", location: full } });
  const results: string[] = [];
  for (const r of repos) results.push(await processGithubEvent(r.orgId, event, payload));
  return NextResponse.json({ ok: true, results });
}
