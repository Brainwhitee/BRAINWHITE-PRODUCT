import { Resend } from "resend";
import { db } from "./db";

// Created lazily: `new Resend()` throws at import time when the key is empty, which broke build, seed and login.
let client: Resend | null = null;
const resend = () => (client ??= new Resend(process.env.RESEND_API_KEY));
const FROM_EMAIL = process.env.FROM_EMAIL ?? "onboarding@resend.dev";

// Production email sender via Resend. Falls back gracefully if key is missing:
// emails are still logged to console + EmailLog table so nothing is lost.
export async function sendEmail(orgId: string, to: string, subject: string, body: string) {
  if (process.env.RESEND_API_KEY) {
    try {
      await resend().emails.send({
        from: FROM_EMAIL,
        to,
        subject,
        html: body,
      });
    } catch (err) {
      console.error("[resend] send failed:", err);
    }
  } else {
    console.log(`\n[email] to=${to} subject="${subject}"\n${body}\n`);
  }
  await db.emailLog.create({ data: { orgId, to, subject, body } });
}

export async function notify(userId: string, title: string, body: string) {
  await db.notification.create({ data: { userId, title, body } });
}
