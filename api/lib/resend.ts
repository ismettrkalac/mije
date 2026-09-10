/**
 * Minimal Resend REST client — no SDK dependency, just `fetch`, so the
 * `Idempotency-Key` header (Resend's documented duplicate-send guard) is
 * always sent exactly as specified regardless of SDK version.
 */
export interface SendEmailInput {
  from: string;
  to: string;
  subject: string;
  html: string;
  idempotencyKey: string;
}

export interface SendEmailResult {
  id: string;
}

export async function sendEmail(apiKey: string, input: SendEmailInput): Promise<SendEmailResult> {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "Idempotency-Key": input.idempotencyKey,
    },
    body: JSON.stringify({
      from: input.from,
      to: input.to,
      subject: input.subject,
      html: input.html,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Resend send failed (${res.status}): ${body}`);
  }

  return (await res.json()) as SendEmailResult;
}
