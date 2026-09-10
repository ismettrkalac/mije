/**
 * Durable per-recipient, per-month delivery tracking, stored as a single
 * JSON file committed to this GitHub repo via the Contents API — no paid
 * storage service needed. A record only ever gets written after a
 * confirmed successful send, so a missing record always means "safe to
 * (re)try". This is the only duplicate-send guard (Gmail SMTP has no
 * idempotency-key concept), which is safe because a single Vercel Cron job
 * never runs two invocations concurrently.
 *
 * Every write is a real commit to the repo (via GITHUB_BRANCH, default
 * `main`) — a side effect worth knowing about: since Vercel auto-deploys
 * on push, each month's delivery record also triggers a tiny redeploy of
 * the site.
 */
const GITHUB_API = "https://api.github.com";

export interface DeliveryRecord {
  status: "sent";
  messageId: string;
  sentAt: string;
}

interface DeliveryFile {
  [key: string]: DeliveryRecord;
}

interface GitHubConfig {
  token: string;
  repo: string;
  path: string;
  branch: string;
}

function getConfig(): GitHubConfig {
  const token = process.env.GITHUB_DATA_TOKEN;
  const repo = process.env.GITHUB_DATA_REPO;
  if (!token || !repo) {
    throw new Error(
      "GITHUB_DATA_TOKEN/GITHUB_DATA_REPO are not configured — see README.md → " +
        '"Monthly anniversary emails" for setup.',
    );
  }
  return {
    token,
    repo,
    path: process.env.GITHUB_DATA_PATH ?? "data/monthaversary-deliveries.json",
    branch: process.env.GITHUB_DATA_BRANCH ?? "main",
  };
}

function deliveryStoreKey(recipientId: string, monthKey: string): string {
  return `${recipientId}:${monthKey}`;
}

async function githubRequest(config: GitHubConfig, path: string, init?: RequestInit): Promise<Response> {
  return fetch(`${GITHUB_API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${config.token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      ...init?.headers,
    },
  });
}

async function readDeliveryFile(config: GitHubConfig): Promise<{ data: DeliveryFile; sha: string | null }> {
  const res = await githubRequest(config, `/repos/${config.repo}/contents/${config.path}?ref=${config.branch}`);
  if (res.status === 404) {
    return { data: {}, sha: null };
  }
  if (!res.ok) {
    throw new Error(`GitHub read failed (${res.status}): ${await res.text()}`);
  }
  const json = (await res.json()) as { content: string; sha: string };
  const data = JSON.parse(Buffer.from(json.content, "base64").toString("utf8")) as DeliveryFile;
  return { data, sha: json.sha };
}

async function writeDeliveryFile(config: GitHubConfig, data: DeliveryFile, sha: string | null, message: string): Promise<void> {
  const res = await githubRequest(config, `/repos/${config.repo}/contents/${config.path}`, {
    method: "PUT",
    body: JSON.stringify({
      message,
      content: Buffer.from(`${JSON.stringify(data, null, 2)}\n`).toString("base64"),
      branch: config.branch,
      ...(sha ? { sha } : {}),
    }),
  });
  if (!res.ok) {
    throw new Error(`GitHub write failed (${res.status}): ${await res.text()}`);
  }
}

export async function getDelivery(recipientId: string, monthKey: string): Promise<DeliveryRecord | null> {
  const config = getConfig();
  const { data } = await readDeliveryFile(config);
  return data[deliveryStoreKey(recipientId, monthKey)] ?? null;
}

export async function markDelivered(recipientId: string, monthKey: string, messageId: string): Promise<void> {
  const config = getConfig();
  const { data, sha } = await readDeliveryFile(config);
  const key = deliveryStoreKey(recipientId, monthKey);
  data[key] = { status: "sent", messageId, sentAt: new Date().toISOString() };
  await writeDeliveryFile(config, data, sha, `chore: record monthaversary delivery (${key})`);
}
