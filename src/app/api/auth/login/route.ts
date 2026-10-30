import { NextRequest, NextResponse } from "next/server";
import { loginTx } from "@/lib/domain/auth";
import { createSession, homeFor } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { rateLimitDb } from "@/lib/rate-limit";
import { headers } from "next/headers";

async function clientIp(): Promise<string> {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for") ?? h.get("x-real-ip");
  return (forwarded ?? "unknown").split(",")[0].trim();
}

export async function POST(req: NextRequest) {
  const ipLimit = await rateLimitDb(`login:ip:${await clientIp()}`, 20, 15 * 60 * 1000);
  if (!ipLimit.ok) {
    return NextResponse.json({ error: "Too many attempts from this network. Try again later." }, { status: 429 });
  }

  const contentType = req.headers.get("content-type") ?? "";
  let data: Record<string, unknown>;
  if (contentType.includes("application/json")) {
    data = await req.json();
  } else {
    const fd = await req.formData();
    data = Object.fromEntries(fd) as Record<string, unknown>;
  }

  const result = await loginTx({
    email: String(data.email ?? ""),
    password: String(data.password ?? ""),
  });
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 401 });
  }
  await audit(result.data.orgId, result.data.userId, "auth.login");
  await createSession(result.data.userId);
  return NextResponse.json({ success: true, home: homeFor(result.data.role) });
}