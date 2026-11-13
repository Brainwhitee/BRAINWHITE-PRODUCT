import { NextRequest, NextResponse } from "next/server";
import { loginTx } from "@/lib/domain/auth";
import { createSession, homeFor } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { rateLimitDb } from "@/lib/rate-limit";
import { headers } from "next/headers";

async function clientIp(): Promise<string> {
  try {
    const h = await headers();
    const forwarded = h.get("x-forwarded-for") ?? h.get("x-real-ip");
    return (forwarded ?? "unknown").split(",")[0].trim();
  } catch {
    return "unknown";
  }
}

export async function POST(req: NextRequest) {
  try {
    const ip = await clientIp();
    const ipLimit = await rateLimitDb(`login:ip:${ip}`, 20, 15 * 60 * 1000);
    if (!ipLimit.ok) {
      return NextResponse.json(
        { error: "Too many attempts from this network. Try again later." },
        { status: 429 }
      );
    }

    const contentType = req.headers.get("content-type") ?? "";
    let data: Record<string, unknown> = {};
    if (contentType.includes("application/json")) {
      data = await req.json();
    } else {
      const fd = await req.formData();
      data = Object.fromEntries(fd) as Record<string, unknown>;
    }

    const email = String(data.email ?? "").trim();
    const password = String(data.password ?? "");

    if (!email || !password) {
      return NextResponse.json({ error: "Enter your email and password" }, { status: 400 });
    }

    const result = await loginTx({ email, password });
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 401 });
    }

    try {
      await audit(result.data.orgId, result.data.userId, "auth.login");
    } catch (auditErr) {
      console.warn("Audit log warning (non-fatal):", auditErr);
    }

    await createSession(result.data.userId);
    return NextResponse.json({ success: true, home: homeFor(result.data.role) });
  } catch (err: unknown) {
    console.error("Login route error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal login error" },
      { status: 500 }
    );
  }
}
