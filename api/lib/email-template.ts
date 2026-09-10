import type { Recipient } from "./recipients";

export interface EmailContent {
  subject: string;
  html: string;
}

function shell(bodyHtml: string): string {
  return `<!doctype html>
<html>
  <body style="margin:0;padding:32px 16px;background:#fdf5f7;font-family:Georgia,'Times New Roman',serif;color:#3a2c30;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center">
          <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="max-width:480px;background:#ffffff;border-radius:16px;overflow:hidden;">
            <tr>
              <td style="padding:40px 36px;">
                ${bodyHtml}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function button(siteUrl: string, label: string): string {
  return `<a href="${siteUrl}" style="display:inline-block;margin-top:28px;padding:12px 28px;background:#d68fa3;color:#ffffff;text-decoration:none;border-radius:999px;font-family:Georgia,'Times New Roman',serif;font-size:15px;">${label}</a>`;
}

export function renderMonthlyEmail(
  recipient: Recipient,
  opts: { monthsCompleted: number; daysUntilBloom: number | null; siteUrl: string },
): EmailContent {
  const monthsLabel = opts.monthsCompleted === 1 ? "1 month" : `${opts.monthsCompleted} months`;
  const subject = `Happy monthaversary! ${monthsLabel} together`;

  const countdownHtml =
    opts.daysUntilBloom !== null
      ? `<p style="margin:20px 0 0;font-size:15px;line-height:1.6;color:#7a5c66;">
           Our lily has ${opts.daysUntilBloom} ${opts.daysUntilBloom === 1 ? "day" : "days"} left before it blooms.
         </p>`
      : "";

  const bodyHtml = `
    <p style="margin:0;font-size:14px;letter-spacing:0.08em;text-transform:uppercase;color:#c98ea3;">Happy monthaversary</p>
    <h1 style="margin:12px 0 0;font-size:26px;font-weight:normal;color:#3a2c30;">${monthsLabel} together, ${escapeHtml(recipient.name)}</h1>
    <p style="margin:20px 0 0;font-size:16px;line-height:1.6;color:#4a3a3f;">
      Another month down, and I'd choose every single one of them with you again. Here's to the next one.
    </p>
    ${countdownHtml}
    ${button(opts.siteUrl, "Visit our lily")}
  `;

  return { subject, html: shell(bodyHtml) };
}

export function renderBloomEmail(
  recipient: Recipient,
  opts: { monthsCompleted: number; siteUrl: string },
): EmailContent {
  const monthsLabel = opts.monthsCompleted === 1 ? "1 month" : `${opts.monthsCompleted} months`;
  const subject = "Our lily has bloomed";

  const bodyHtml = `
    <p style="margin:0;font-size:14px;letter-spacing:0.08em;text-transform:uppercase;color:#c98ea3;">It bloomed</p>
    <h1 style="margin:12px 0 0;font-size:26px;font-weight:normal;color:#3a2c30;">Our lily has bloomed, ${escapeHtml(recipient.name)}</h1>
    <p style="margin:20px 0 0;font-size:16px;line-height:1.6;color:#4a3a3f;">
      ${monthsLabel} of growing it together, a little more each day, and today it's finally open. Happy monthaversary.
    </p>
    ${button(opts.siteUrl, "See it bloom")}
  `;

  return { subject, html: shell(bodyHtml) };
}

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
