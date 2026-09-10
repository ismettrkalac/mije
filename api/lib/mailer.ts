/**
 * Sends mail through the sender's own Gmail account over SMTP, using an
 * App Password (not the account password) generated under
 * Google Account → Security → 2-Step Verification → App Passwords.
 *
 * Unlike Resend, Gmail's SMTP has no server-side idempotency-key concept —
 * duplicate-send protection here relies entirely on checking
 * `delivery-store.ts` before sending. That's safe in practice because a
 * single Vercel Cron job never runs two invocations concurrently.
 */
import nodemailer from "nodemailer";

export interface SendEmailInput {
  from: string;
  to: string;
  subject: string;
  html: string;
}

export interface SendEmailResult {
  messageId: string;
}

let transporter: ReturnType<typeof nodemailer.createTransport> | undefined;

function getTransporter(user: string, appPassword: string) {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user, pass: appPassword },
    });
  }
  return transporter;
}

export async function sendEmail(
  gmailUser: string,
  gmailAppPassword: string,
  input: SendEmailInput,
): Promise<SendEmailResult> {
  const info = await getTransporter(gmailUser, gmailAppPassword).sendMail({
    from: input.from,
    to: input.to,
    subject: input.subject,
    html: input.html,
  });
  return { messageId: info.messageId };
}
