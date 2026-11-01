import { NextResponse } from "next/server";
import { Resend } from "resend";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, company, teamSize, message } = body;

    if (!name || !email || !company) {
      return NextResponse.json(
        { error: "Name, email, and company are required fields." },
        { status: 400 }
      );
    }

    const recipient = "partnerbrainwhite@gmail.com";
    const subject = `Architecture Demo Request: ${name} (${company})`;

    const contentHtml = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; color: #0f172a;">
        <div style="background-color: #090d16; padding: 20px 24px; border-radius: 8px; margin-bottom: 24px;">
          <h2 style="margin: 0; font-size: 18px; color: #ffffff; letter-spacing: -0.5px;">Brain<span style="color: #38bdf8;">White</span> — Architecture Demo</h2>
        </div>
        <h3 style="margin-top: 0; color: #0f172a; font-size: 16px;">New Candidate / Company Demo Request Received</h3>
        <table style="width: 100%; border-collapse: collapse; font-size: 14px; margin-top: 16px;">
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 10px 0; font-weight: 600; width: 150px; color: #64748b;">Full Name:</td>
            <td style="padding: 10px 0; color: #0f172a; font-weight: 500;">${name}</td>
          </tr>
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 10px 0; font-weight: 600; color: #64748b;">Work Email:</td>
            <td style="padding: 10px 0; color: #0284c7;"><a href="mailto:${email}" style="color: #0284c7; text-decoration: none;">${email}</a></td>
          </tr>
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 10px 0; font-weight: 600; color: #64748b;">Company / Org:</td>
            <td style="padding: 10px 0; color: #0f172a;">${company}</td>
          </tr>
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 10px 0; font-weight: 600; color: #64748b;">Engineering Scope:</td>
            <td style="padding: 10px 0; color: #0f172a;">${teamSize || "10-50 engineers"}</td>
          </tr>
          <tr>
            <td style="padding: 10px 0; font-weight: 600; color: #64748b; vertical-align: top;">Codebase &amp; Notes:</td>
            <td style="padding: 10px 0; color: #334155; white-space: pre-wrap;">${message || "No additional notes provided."}</td>
          </tr>
        </table>
        <div style="margin-top: 28px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8; text-align: center;">
          Dispatched from BrainWhite Demo Gateway &bull; Receiver: ${recipient}
        </div>
      </div>
    `;

    if (process.env.RESEND_API_KEY) {
      const resend = new Resend(process.env.RESEND_API_KEY);
      const fromEmail = process.env.FROM_EMAIL || "BrainWhite <onboarding@brainwhite.com>";
      await resend.emails.send({
        from: fromEmail,
        to: recipient,
        replyTo: email,
        subject,
        html: contentHtml,
      });
    } else {
      console.log(`[book-demo-email] To: ${recipient} | Subject: ${subject}`);
    }

    // Attempt to log for auditing if DB available
    try {
      await db.emailLog.create({
        data: {
          orgId: "system",
          to: recipient,
          subject,
          body: `From: ${name} <${email}>, Org: ${company}, Team: ${teamSize}\n\n${message || ""}`,
        },
      });
    } catch {
      // Ignore DB log failures for public unauthenticated demo leads
    }

    return NextResponse.json({
      success: true,
      message: "Architecture demo request dispatched successfully.",
      recipient,
    });
  } catch (err: unknown) {
    console.error("[book-demo-api-error]:", err);
    return NextResponse.json(
      { error: "Failed to dispatch demo request. Please try again or email partnerbrainwhite@gmail.com directly." },
      { status: 500 }
    );
  }
}
