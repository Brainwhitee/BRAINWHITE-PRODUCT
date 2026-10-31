import { Resend } from "resend";
import { db, type DbClient } from "./db";

const resend = new Resend(process.env.RESEND_API_KEY);
const getFromEmail = () => process.env.FROM_EMAIL || "BrainWhite <onboarding@brainwhite.com>";

export const isEmailConfigured = () => Boolean(process.env.RESEND_API_KEY);

const escapeHtml = (s: string) =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const textToHtml = (text: string) =>
  `<p>${escapeHtml(text).replace(/\n{2,}/g, "</p><p>").replace(/\n/g, "<br/>")}</p>`;

export function wrapInEmailTemplate(contentHtml: string, title?: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title || "BrainWhite")}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #0f172a; line-height: 1.6;">
  <div style="max-width: 580px; margin: 30px auto; background-color: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
    <div style="background-color: #090d16; padding: 24px 32px; border-bottom: 1px solid #1e293b;">
      <h1 style="margin: 0; font-size: 20px; font-weight: 700; color: #ffffff; letter-spacing: -0.5px;">Brain<span style="color: #6366f1;">White</span></h1>
    </div>
    <div style="padding: 32px; font-size: 15px; color: #334155;">
      ${contentHtml}
    </div>
    <div style="background-color: #f8fafc; padding: 20px 32px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8; text-align: center;">
      <p style="margin: 0;">BrainWhite Enterprise Learning &amp; AI Onboarding Platform</p>
      <p style="margin: 4px 0 0 0;">brainwhite.com</p>
    </div>
  </div>
</body>
</html>`;
}

export async function sendEmail(
  orgId: string,
  to: string,
  subject: string,
  body: string,
  opts?: { html?: boolean; client?: DbClient }
) {
  const contentHtml = opts?.html ? body : textToHtml(body);
  const html = wrapInEmailTemplate(contentHtml, subject);
  const client = opts?.client ?? db;
  const from = getFromEmail();

  if (process.env.RESEND_API_KEY) {
    try {
      await resend.emails.send({
        from,
        to,
        subject,
        html,
      });
    } catch (err) {
      console.error("[resend] send failed:", err);
    }
  } else {
    console.log(`\n[email] from=${from} to=${to} subject="${subject}"\n${body}\n`);
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