import { NextRequest, NextResponse } from "next/server";
import { requestResetTx } from "@/lib/domain/auth";
import { rateLimitDb } from "@/lib/rate-limit";
import { headers } from "next/headers";
import { z } from "zod";

async function clientIp(): Promise<string> {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for") ?? h.get("x-real-ip");
  return (forwarded ?? "unknown").split(",")[0].trim();
}

export async function POST(req: NextRequest) {
  const ipLimit = await rateLimitDb(`reset:ip:${await clientIp()}`, 5, 15 * 60 * 1000);
  if (!ipLimit.ok) {
    return NextResponse.json({ error: "Too many reset requests from this network. Try again later." }, { status: 429 });
  }

  const contentType = req.headers.get("content-type") ?? "";
  let data: Record<string, unknown>;
  if (contentType.includes("application/json")) {
    data = await req.json();
  } else {
    const fd = await req.formData();
    data = Object.fromEntries(fd) as Record<string, unknown>;
  }

  const email = z.string().email().safeParse(String(data.email ?? "").trim());
  if (!email.success) {
    return NextResponse.json({ error: "Enter a valid email address" }, { status: 400 });
  }
  const result = await requestResetTx(email.data);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json({ success: true });
}