import { db } from "./db";

// MVP: emails are logged to EmailLog and printed to the server console.
// Swap the body of sendEmail for Resend/SES later (PLT-07); callers stay the same.
export async function sendEmail(orgId: string, to: string, subject: string, body: string) {
  console.log(`\n[email] to=${to} subject="${subject}"\n${body}\n`);
  await db.emailLog.create({ data: { orgId, to, subject, body } });
}

export async function notify(userId: string, title: string, body: string) {
  await db.notification.create({ data: { userId, title, body } });
}
