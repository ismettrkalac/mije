/**
 * Monthly anniversary emails.
 *
 * Triggered hourly by Vercel Cron (see vercel.json) so it can check "is it
 * currently 09:00 in Europe/Belgrade, on the relationship's anniversary day
 * of the month" without depending on a scheduler that understands
 * timezones or DST — see the timezone note in README for the tradeoffs on
 * plans that only allow daily cron invocations.
 *
 * Auth: Vercel automatically sends `Authorization: Bearer $CRON_SECRET`
 * when it invokes this via Cron (as long as CRON_SECRET is set as an env
 * var). Manual/dry-run calls must send the same header themselves. There
 * is no way to reach this endpoint, send an email, or change a recipient
 * without that secret.
 */
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { gardenConfig } from "../src/config";
import { computeAnniversaryStatus, getHourInTimezone, monthKey } from "./lib/anniversary";
import { loadRecipients } from "./lib/recipients";
import { renderBloomEmail, renderMonthlyEmail } from "./lib/email-template";
import { getDelivery, markDelivered } from "./lib/delivery-store";
import { sendEmail } from "./lib/resend";

const SEND_FROM_HOUR = 9;

interface RecipientResult {
  recipientId: string;
  status: "sent" | "skipped-already-sent" | "error" | "previewed";
  detail?: string;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    res.status(500).json({ error: "CRON_SECRET is not configured." });
    return;
  }
  if (req.headers.authorization !== `Bearer ${cronSecret}`) {
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
  const siteUrl = process.env.SITE_URL ?? `https://${process.env.VERCEL_URL ?? ""}`;

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

  const results: RecipientResult[] = [];
  const previews: { recipientId: string; subject: string; html: string }[] = [];
  const key = monthKey(status.todayStr);

  for (const recipient of recipients) {
    const content = status.isBloomDay
      ? renderBloomEmail(recipient, { monthsCompleted: status.monthsCompleted, siteUrl })
      : renderMonthlyEmail(recipient, {
          monthsCompleted: status.monthsCompleted,
          daysUntilBloom: status.isBeforeBloom ? status.daysUntilBloom : null,
          siteUrl,
        });

    if (dryRun) {
      results.push({ recipientId: recipient.id, status: "previewed" });
      previews.push({ recipientId: recipient.id, subject: content.subject, html: content.html });
      continue;
    }

    const existing = await getDelivery(recipient.id, key);
    if (existing) {
      results.push({ recipientId: recipient.id, status: "skipped-already-sent" });
      continue;
    }

    const resendApiKey = process.env.RESEND_API_KEY;
    const resendFrom = process.env.RESEND_FROM;
    if (!resendApiKey || !resendFrom) {
      results.push({ recipientId: recipient.id, status: "error", detail: "RESEND_API_KEY/RESEND_FROM not configured" });
      continue;
    }

    try {
      const sent = await sendEmail(resendApiKey, {
        from: resendFrom,
        to: recipient.email,
        subject: content.subject,
        html: content.html,
        idempotencyKey: `monthaversary-${recipient.id}-${key}`,
      });
      await markDelivered(recipient.id, key, sent.id);
      results.push({ recipientId: recipient.id, status: "sent" });
    } catch (err) {
      results.push({ recipientId: recipient.id, status: "error", detail: (err as Error).message });
    }
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
