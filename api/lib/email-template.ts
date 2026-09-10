import type { Recipient } from "./recipients.js";

export interface EmailContent {
  subject: string;
  html: string;
}

/** Serbian noun agreement for "mesec" (month): 1 mesec, 2-4 meseca, else meseci. */
function monthWord(n: number): string {
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 14) return "meseci";
  const mod10 = n % 10;
  if (mod10 === 1) return "mesec";
  if (mod10 >= 2 && mod10 <= 4) return "meseca";
  return "meseci";
}

/** Serbian noun agreement for "dan" (day): 1 dan, else dana. */
function dayWord(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  return mod10 === 1 && mod100 !== 11 ? "dan" : "dana";
}

function monthsLabel(n: number): string {
  return `${n} ${monthWord(n)}`;
}

function shell(bodyHtml: string): string {
  return `<!doctype html>
<html lang="sr">
  <head>
    <meta charset="utf-8" />
  </head>
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
  const months = monthsLabel(opts.monthsCompleted);
  const subject = `Srećna mesečnica! ${months} zajedno`;

  const countdownHtml =
    opts.daysUntilBloom !== null
      ? `<p style="margin:20px 0 0;font-size:15px;line-height:1.6;color:#7a5c66;">
           Našem ljiljanu je ostalo još ${opts.daysUntilBloom} ${dayWord(opts.daysUntilBloom)} do cvetanja.
         </p>`
      : "";

  const bodyHtml = `
    <p style="margin:0;font-size:14px;letter-spacing:0.08em;text-transform:uppercase;color:#c98ea3;">Srećna mesečnica</p>
    <h1 style="margin:12px 0 0;font-size:26px;font-weight:normal;color:#3a2c30;">${months} zajedno, ${escapeHtml(recipient.name)}</h1>
    <p style="margin:20px 0 0;font-size:16px;line-height:1.6;color:#4a3a3f;">
      Još jedan mesec nas. Hvala ti što si moja ljubav. Jedva čekam sve što nas još čeka. Srećna nam mesečnica 🤍
    </p>
    ${countdownHtml}
    ${button(opts.siteUrl, "Poseti naš ljiljan")}
  `;

  return { subject, html: shell(bodyHtml) };
}

export function renderBloomEmail(
  recipient: Recipient,
  opts: { monthsCompleted: number; siteUrl: string },
): EmailContent {
  const months = monthsLabel(opts.monthsCompleted);
  const subject = "Naš ljiljan je procvetao";

  const bodyHtml = `
    <p style="margin:0;font-size:14px;letter-spacing:0.08em;text-transform:uppercase;color:#c98ea3;">Procvetalo je</p>
    <h1 style="margin:12px 0 0;font-size:26px;font-weight:normal;color:#3a2c30;">Naš ljiljan je procvetao, ${escapeHtml(recipient.name)}</h1>
    <p style="margin:20px 0 0;font-size:16px;line-height:1.6;color:#4a3a3f;">
      ${months} zajedničkog gajenja, malo po malo svakog dana, i danas se konačno otvorio. Srećna mesečnica.
    </p>
    ${button(opts.siteUrl, "Pogledaj cvet")}
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
