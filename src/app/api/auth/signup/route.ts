import { NextRequest, NextResponse } from "next/server";
import { signupTx } from "@/lib/domain/auth";
import { createSession } from "@/lib/auth";
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
    const ipLimit = await rateLimitDb(`signup:ip:${ip}`, 10, 15 * 60 * 1000);
    if (!ipLimit.ok) {
      return NextResponse.json(
        { error: "Too many sign-up attempts from this network. Try again later." },
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

    const result = await signupTx({
      orgName: String(data.orgName ?? "").trim(),
      name: String(data.name ?? "").trim(),
      email: String(data.email ?? "").trim(),
      password: String(data.password ?? ""),
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    try {
      await audit(result.data.orgId, result.data.userId, "org.created");
    } catch (auditErr) {
      console.warn("Audit log warning (non-fatal):", auditErr);
    }

    await createSession(result.data.userId);
    return NextResponse.json({
      success: true,
      home: "/dashboard",
      emailSent: result.data.verificationSent,
    });
  } catch (err: unknown) {
    console.error("Signup route error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal signup error" },
      { status: 500 }
    );
  }
}
