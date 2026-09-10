/**
 * Durable per-recipient, per-month delivery tracking, backed by a Redis
 * store (Upstash, connected via the Vercel Marketplace "Redis" storage
 * integration). A record only ever gets written after a confirmed
 * successful send, so a missing record always means "safe to (re)try" —
 * the Resend idempotency key is what protects against an actual duplicate
 * email if a previous attempt sent successfully but this function crashed
 * before recording it.
 */
import { Redis } from "@upstash/redis";

// Vercel's Redis/KV storage integrations have used a couple of different
// env var names over time — accept either so this works regardless of
// which one provisioned the store.
const url = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;

function getRedis(): Redis {
  if (!url || !token) {
    throw new Error(
      "No Redis store configured. Connect a Redis storage integration to this Vercel project " +
        "(or set KV_REST_API_URL/KV_REST_API_TOKEN) — see README.md.",
    );
  }
  return new Redis({ url, token });
}

export interface DeliveryRecord {
  status: "sent";
  resendId: string;
  sentAt: string;
}

function deliveryKey(recipientId: string, monthKey: string): string {
  return `monthaversary:sent:${recipientId}:${monthKey}`;
}

export async function getDelivery(recipientId: string, monthKey: string): Promise<DeliveryRecord | null> {
  const record = await getRedis().get<DeliveryRecord>(deliveryKey(recipientId, monthKey));
  return record ?? null;
}

export async function markDelivered(recipientId: string, monthKey: string, resendId: string): Promise<void> {
  const record: DeliveryRecord = { status: "sent", resendId, sentAt: new Date().toISOString() };
  // Kept indefinitely (no `ex`) — this is the audit trail of what's been sent.
  await getRedis().set(deliveryKey(recipientId, monthKey), record);
}
