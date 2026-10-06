/**
 * Monthly anniversary emails.
 *
 * Triggered once a day by Vercel Cron (see vercel.json) at 09:00 UTC. The handler resolves the
 * current time in Europe/Belgrade (DST-aware) and only sends on the anniversary day of the month,
 * once the local hour is 10 or later — see the timezone note in the README for the tradeoffs of
 * plans that only allow daily cron invocations.
 *
 * Auth: Vercel automatically sends `Authorization: Bearer $CRON_SECRET` when it invokes this via
 * Cron (as long as CRON_SECRET is set as an env var). Manual/dry-run calls must send the same
 * header themselves. There is no way to reach this endpoint, send an email, or change a recipient
 * without that secret.
 *
 * Failures: a cron run can't be retried the same day on Hobby plans, so any failed send also
 * emails an alert to the sending Gmail account itself.
 */
import { timingSafeEqual } from "node:crypto";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { gardenConfig } from "../src/config.js";
import { computeAnniversaryStatus, getHourInTimezone, monthKey } from "./lib/anniversary.js";
import { loadRecipients } from "./lib/recipients.js";
import { renderBloomEmail, renderMonthlyEmail } from "./lib/email-template.js";
import { deliveryKey, getDeliveries, markDelivered } from "./lib/delivery-store.js";
import { sendEmail } from "./lib/mailer.js";

const SEND_FROM_HOUR = 10;
const RECORD_ATTEMPTS = 3;

interface RecipientResult {
  recipientId: string;
  /** `sent-unrecorded`: the email WAS sent but saving the delivery record failed — do not resend. */
  status: "sent" | "sent-unrecorded" | "skipped-already-sent" | "error" | "previewed";
  detail?: string;
}

function isAuthorized(header: string | undefined, secret: string): boolean {
  const expected = Buffer.from(`Bearer ${secret}`);
  const actual = Buffer.from(header ?? "");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

function resolveSiteUrl(): string | null {
  const configured = process.env.SITE_URL ?? process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (!configured) return null;
  const withProtocol = /^https?:\/\//.test(configured) ? configured : `https://${configured}`;
  try {
    return new URL(withProtocol).toString();
  } catch {
    return null;
  }
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Saving the record is what prevents duplicates, so retry it before giving up. */
async function recordDelivery(recipientId: string, key: string, messageId: string): Promise<void> {
  for (let attempt = 1; ; attempt++) {
    try {
      await markDelivered(recipientId, key, messageId);
      return;
    } catch (err) {
      if (attempt >= RECORD_ATTEMPTS) throw err;
      await sleep(attempt * 800);
    }
  }
}

async function sendFailureAlert(gmailUser: string, gmailAppPassword: string, todayStr: string, results: RecipientResult[]) {
  const problems = results.filter((r) => r.status === "error" || r.status === "sent-unrecorded");
  const lines = problems.map((r) => `<li><b>${r.recipientId}</b>: ${r.status}${r.detail ? ` — ${r.detail}` : ""}</li>`);
  try {
    await sendEmail(gmailUser, gmailAppPassword, {
      from: gmailUser,
      to: gmailUser,
      subject: `Monthaversary email problem (${todayStr})`,
      html: `<p>The monthaversary job ran on ${todayStr} and hit a problem. It will not retry until the next anniversary, so resend manually if needed.</p><ul>${lines.join("")}</ul>`,
    });
  } catch {
    // Nothing more we can do; the problem is still in the response body and the Vercel logs.
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    res.status(500).json({ error: "CRON_SECRET is not configured." });
    return;
  }
  if (!isAuthorized(req.headers.authorization, cronSecret)) {
    res.status(401).json({ error: "Unauthorized." });
    return;
  }

  const dryRun = req.query.dryRun === "1" || req.query.dryRun === "true";
  const asOfParam = typeof req.query.asOf === "string" ? req.query.asOf : undefined;
  if (asOfParam && !dryRun) {
    res.status(400).json({ error: "asOf is only allowed with dryRun." });
    return;
  }

  const now = asOfParam ? new Date(`${asOfParam}T12:00:00Z`) : new Date();
  const { timezone, startDate, bloomDate } = gardenConfig;

  const siteUrl = resolveSiteUrl();
  if (!siteUrl && !dryRun) {
    res.status(500).json({ error: "SITE_URL is not configured (or is not a valid URL)." });
    return;
  }

  const status = computeAnniversaryStatus(startDate, bloomDate, timezone, now);
  const belgradeHour = getHourInTimezone(now, timezone);
  const isDue = status.isAnniversaryDay && status.monthsCompleted >= 1 && belgradeHour >= SEND_FROM_HOUR;

  if (!dryRun && !isDue) {
    res.status(200).json({
      dryRun: false,
      sent: false,
      reason: "not due",
      todayStr: status.todayStr,
      belgradeHour,
    });
    return;
  }

  let recipients;
  try {
    recipients = loadRecipients();
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
    return;
  }

  const gmailUser = process.env.GMAIL_USER;
  const gmailAppPassword = process.env.GMAIL_APP_PASSWORD;

  const results: RecipientResult[] = [];
  const previews: { recipientId: string; subject: string; html: string }[] = [];
  const key = monthKey(status.todayStr);

  let deliveries: Awaited<ReturnType<typeof getDeliveries>> = {};
  if (!dryRun) {
    try {
      deliveries = await getDeliveries();
    } catch (err) {
      // Without the delivery record we can't rule out duplicates, so don't send anything.
      const detail = `Could not read delivery records: ${(err as Error).message}`;
      if (gmailUser && gmailAppPassword) {
        await sendFailureAlert(gmailUser, gmailAppPassword, status.todayStr, [{ recipientId: "all", status: "error", detail }]);
      }
      res.status(500).json({ error: detail });
      return;
    }
  }

  for (const recipient of recipients) {
    const content = status.isBloomDay
      ? renderBloomEmail(recipient, { monthsCompleted: status.monthsCompleted, siteUrl: siteUrl ?? "" })
      : renderMonthlyEmail(recipient, {
          monthsCompleted: status.monthsCompleted,
          daysUntilBloom: status.isBeforeBloom ? status.daysUntilBloom : null,
          siteUrl: siteUrl ?? "",
        });

    if (dryRun) {
      results.push({ recipientId: recipient.id, status: "previewed" });
      previews.push({ recipientId: recipient.id, subject: content.subject, html: content.html });
      continue;
    }

    if (deliveries[deliveryKey(recipient.id, key)]) {
      results.push({ recipientId: recipient.id, status: "skipped-already-sent" });
      continue;
    }

    if (!gmailUser || !gmailAppPassword) {
      results.push({ recipientId: recipient.id, status: "error", detail: "GMAIL_USER/GMAIL_APP_PASSWORD not configured" });
      continue;
    }

    let messageId: string;
    try {
      messageId = (
        await sendEmail(gmailUser, gmailAppPassword, {
          from: gmailUser,
          to: recipient.email,
          subject: content.subject,
          html: content.html,
        })
      ).messageId;
    } catch (err) {
      results.push({ recipientId: recipient.id, status: "error", detail: (err as Error).message });
      continue;
    }

    try {
      await recordDelivery(recipient.id, key, messageId);
      results.push({ recipientId: recipient.id, status: "sent" });
    } catch (err) {
      results.push({
        recipientId: recipient.id,
        status: "sent-unrecorded",
        detail: `Email sent (${messageId}) but the delivery record failed: ${(err as Error).message}`,
      });
    }
  }

  if (!dryRun && gmailUser && gmailAppPassword && results.some((r) => r.status === "error" || r.status === "sent-unrecorded")) {
    await sendFailureAlert(gmailUser, gmailAppPassword, status.todayStr, results);
  }

  res.status(200).json({
    dryRun,
    todayStr: status.todayStr,
    monthsCompleted: status.monthsCompleted,
    isBloomDay: status.isBloomDay,
    daysUntilBloom: status.isBeforeBloom ? status.daysUntilBloom : null,
    results,
    ...(dryRun ? { preview: previews } : {}),
  });
}
