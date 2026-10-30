import { NextRequest, NextResponse } from "next/server";
import { resetTx } from "@/lib/domain/auth";
import { createSession, homeFor } from "@/lib/auth";
import { z } from "zod";

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type") ?? "";
    let data: Record<string, unknown> = {};
    if (contentType.includes("application/json")) {
      data = await req.json();
    } else {
      const fd = await req.formData();
      data = Object.fromEntries(fd) as Record<string, unknown>;
    }

    const parsed = z
      .object({ token: z.string().min(1), password: z.string(), confirm: z.string() })
      .safeParse(data);
    if (!parsed.success) {
      return NextResponse.json({ error: "Fill in every field" }, { status: 400 });
    }
    if (parsed.data.password !== parsed.data.confirm) {
      return NextResponse.json({ error: "Passwords do not match" }, { status: 400 });
    }
    const result = await resetTx({ token: parsed.data.token, password: parsed.data.password });
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    await createSession(result.data.userId);
    const { db } = await import("@/lib/db");
    const user = await db.user.findUniqueOrThrow({ where: { id: result.data.userId } });
    return NextResponse.json({ success: true, home: homeFor(user.role) });
  } catch (err: unknown) {
    console.error("Reset password route error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}
