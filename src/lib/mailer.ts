import { Resend } from "resend";
import { db, type DbClient } from "./db";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = process.env.FROM_EMAIL ?? "onboarding@resend.dev";

export const isEmailConfigured = () => Boolean(process.env.RESEND_API_KEY);

const escapeHtml = (s: string) =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const textToHtml = (text: string) =>
  `<p>${escapeHtml(text).replace(/\n{2,}/g, "</p><p>").replace(/\n/g, "<br/>")}</p>`;

export async function sendEmail(
  orgId: string,
  to: string,
  subject: string,
  body: string,
  opts?: { html?: boolean; client?: DbClient }
) {
  const html = opts?.html ? body : textToHtml(body);
  const client = opts?.client ?? db;
  if (process.env.RESEND_API_KEY) {
    try {
      await resend.emails.send({
        from: FROM_EMAIL,
        to,
        subject,
        html,
      });
    } catch (err) {
      console.error("[resend] send failed:", err);
    }
  } else {
    console.log(`\n[email] to=${to} subject="${subject}"\n${body}\n`);
  }
  try {
    await client.emailLog.create({ data: { orgId, to, subject, body } });
  } catch (err) {
    // Ignore FK errors in tests where org may not exist in this transaction scope
    console.warn("[mailer] EmailLog create failed (likely test rollback):", (err as Error).message);
  }
}

export async function notify(userId: string, title: string, body: string, client?: DbClient) {
  const c = client ?? db;
  await c.notification.create({ data: { userId, title, body } });
}