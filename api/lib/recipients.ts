/**
 * Recipient list for the monthaversary emails. Kept server-side only (env
 * var, never bundled into the frontend) since it contains real email
 * addresses.
 */
export interface Recipient {
  /** Stable identifier used as part of the KV dedup key. Change it and the
   * recipient will be treated as new (re-sent) for the current month. */
  id: string;
  name: string;
  email: string;
}

export function loadRecipients(): Recipient[] {
  const raw = process.env.ANNIVERSARY_RECIPIENTS;
  if (!raw) {
    throw new Error(
      "ANNIVERSARY_RECIPIENTS env var is not set. Expected a JSON array like " +
        '[{"id":"a","name":"Alex","email":"alex@example.com"}, ...].',
    );
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    throw new Error(`ANNIVERSARY_RECIPIENTS is not valid JSON: ${(err as Error).message}`);
  }

  if (!Array.isArray(parsed) || parsed.length === 0) {
    throw new Error("ANNIVERSARY_RECIPIENTS must be a non-empty JSON array.");
  }

  return parsed.map((entry, i) => {
    if (
      typeof entry !== "object" ||
      entry === null ||
      typeof (entry as Recipient).id !== "string" ||
      typeof (entry as Recipient).name !== "string" ||
      typeof (entry as Recipient).email !== "string"
    ) {
      throw new Error(`ANNIVERSARY_RECIPIENTS[${i}] must be {id, name, email} strings.`);
    }
    return entry as Recipient;
  });
}
