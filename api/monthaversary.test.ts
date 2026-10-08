import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { VercelRequest, VercelResponse } from "@vercel/node";

vi.mock("./lib/mailer.js", () => ({ sendEmail: vi.fn() }));
vi.mock("./lib/delivery-store.js", () => ({
  getDeliveries: vi.fn(),
  markDelivered: vi.fn(),
  deliveryKey: (id: string, month: string) => `${id}:${month}`,
}));

import handler from "./monthaversary.js";
import { sendEmail } from "./lib/mailer.js";
import { getDeliveries, markDelivered } from "./lib/delivery-store.js";

const sendEmailMock = vi.mocked(sendEmail);
const getDeliveriesMock = vi.mocked(getDeliveries);
const markDeliveredMock = vi.mocked(markDelivered);

const SECRET = "test-secret";

/** Calls the handler like Vercel would and returns the status and JSON body it produced. */
async function call(opts: { auth?: string | null; query?: Record<string, string> } = {}) {
  const auth = opts.auth === undefined ? `Bearer ${SECRET}` : opts.auth;
  const req = { headers: auth === null ? {} : { authorization: auth }, query: opts.query ?? {} } as unknown as VercelRequest;
  let status = 0;
  let body: Record<string, unknown> = {};
  const res = {
    status(code: number) {
      status = code;
      return res;
    },
    json(payload: Record<string, unknown>) {
      body = payload;
      return res;
    },
  } as unknown as VercelResponse;
  await handler(req, res);
  return { status, body };
}

const results = (body: Record<string, unknown>) => body.results as { recipientId: string; status: string }[];

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] }); // only freeze "now"; keep real timers for retry back-off
  process.env.CRON_SECRET = SECRET;
  process.env.GMAIL_USER = "sender@gmail.com";
  process.env.GMAIL_APP_PASSWORD = "app-password";
  process.env.SITE_URL = "https://lily.example.com";
  process.env.ANNIVERSARY_RECIPIENTS = JSON.stringify([
    { id: "a", name: "Ana", email: "ana@example.com" },
    { id: "b", name: "Bo", email: "bo@example.com" },
  ]);
  sendEmailMock.mockReset().mockResolvedValue({ messageId: "<m1@gmail.com>" });
  getDeliveriesMock.mockReset().mockResolvedValue({});
  markDeliveredMock.mockReset().mockResolvedValue(undefined);
});

afterEach(() => {
  vi.useRealTimers();
});

const setNow = (iso: string) => vi.setSystemTime(new Date(iso));

describe("auth and config", () => {
  it("rejects a missing or wrong secret", async () => {
    setNow("2026-10-11T09:05:00Z");
    expect((await call({ auth: null })).status).toBe(401);
    expect((await call({ auth: "Bearer nope" })).status).toBe(401);
    expect(sendEmailMock).not.toHaveBeenCalled();
  });

  it("refuses to run without CRON_SECRET configured", async () => {
    delete process.env.CRON_SECRET;
    expect((await call()).status).toBe(500);
  });

  it("only allows asOf together with dryRun", async () => {
    expect((await call({ query: { asOf: "2026-10-11" } })).status).toBe(400);
  });

  it("fails clearly when SITE_URL is missing instead of sending a broken link", async () => {
    delete process.env.SITE_URL;
    delete process.env.VERCEL_PROJECT_PRODUCTION_URL;
    setNow("2026-10-11T09:05:00Z");
    expect((await call()).status).toBe(500);
    expect(sendEmailMock).not.toHaveBeenCalled();
  });
});

describe("when it is due", () => {
  it("does nothing on a normal day", async () => {
    setNow("2026-10-12T09:05:00Z");
    const { status, body } = await call();
    expect(status).toBe(200);
    expect(body.reason).toBe("not due");
    expect(sendEmailMock).not.toHaveBeenCalled();
  });

  it("waits until 10:00 Belgrade time on the anniversary day", async () => {
    setNow("2026-10-11T07:00:00Z"); // 09:00 CEST
    expect((await call()).body.reason).toBe("not due");
    setNow("2026-10-11T08:00:00Z"); // 10:00 CEST
    expect(results((await call()).body)).toHaveLength(2);
  });

  it("is due at the real cron time (09:00-09:59 UTC) in both summer and winter", async () => {
    for (const iso of ["2026-10-11T09:05:00Z", "2026-12-11T09:05:00Z", "2027-02-11T09:59:00Z"]) {
      setNow(iso);
      sendEmailMock.mockClear();
      expect(results((await call()).body).map((r) => r.status)).toEqual(["sent", "sent"]);
    }
  });

  it("does not send before the first full month", async () => {
    setNow("2026-05-11T09:05:00Z"); // start date itself: 0 months completed
    expect((await call()).body.reason).toBe("not due");
  });
});

describe("sending", () => {
  beforeEach(() => setNow("2026-10-11T09:05:00Z"));

  it("emails each recipient once and records each delivery", async () => {
    const { body } = await call();
    expect(results(body).map((r) => r.status)).toEqual(["sent", "sent"]);
    expect(sendEmailMock.mock.calls.map((c) => c[2].to)).toEqual(["ana@example.com", "bo@example.com"]);
    expect(markDeliveredMock.mock.calls.map((c) => [c[0], c[1]])).toEqual([
      ["a", "2026-10"],
      ["b", "2026-10"],
    ]);
  });

  it("skips anyone already recorded for this month (no duplicates on a re-run)", async () => {
    getDeliveriesMock.mockResolvedValue({
      "a:2026-10": { status: "sent", messageId: "x", sentAt: "2026-10-11T09:00:00Z" },
    });
    const { body } = await call();
    expect(results(body).map((r) => r.status)).toEqual(["skipped-already-sent", "sent"]);
    expect(sendEmailMock).toHaveBeenCalledTimes(1);
  });

  it("does not skip someone recorded for a different month", async () => {
    getDeliveriesMock.mockResolvedValue({
      "a:2026-09": { status: "sent", messageId: "x", sentAt: "2026-09-11T09:00:00Z" },
    });
    expect(results((await call()).body).map((r) => r.status)).toEqual(["sent", "sent"]);
  });

  it("uses the bloom email on bloom day", async () => {
    setNow("2027-05-11T09:05:00Z");
    await call();
    expect(sendEmailMock.mock.calls[0][2].subject).toBe("Naš ljiljan je procvetao");
  });

  it("includes the countdown before bloom and not after", async () => {
    await call();
    expect(sendEmailMock.mock.calls[0][2].html).toContain("do cvetanja");
    sendEmailMock.mockClear();
    setNow("2027-06-11T09:05:00Z");
    await call();
    expect(sendEmailMock.mock.calls[0][2].html).not.toContain("do cvetanja");
  });
});

describe("failures", () => {
  beforeEach(() => setNow("2026-10-11T09:05:00Z"));

  it("keeps going after one recipient fails, doesn't record it, and alerts the sender", async () => {
    sendEmailMock.mockImplementation(async (_u, _p, input) => {
      if (input.to === "ana@example.com") throw new Error("smtp down");
      return { messageId: "<ok@gmail.com>" };
    });
    const { body } = await call();
    expect(results(body).map((r) => r.status)).toEqual(["error", "sent"]);
    expect(markDeliveredMock).toHaveBeenCalledTimes(1);
    expect(markDeliveredMock.mock.calls[0][0]).toBe("b");
    const alert = sendEmailMock.mock.calls.at(-1)![2];
    expect(alert.to).toBe("sender@gmail.com");
    expect(alert.subject).toContain("problem");
    expect(alert.html).toContain("smtp down");
  });

  it("retries saving the record, and reports sent-unrecorded (not a duplicate send) if it keeps failing", async () => {
    markDeliveredMock.mockRejectedValue(new Error("github 500"));
    const { body } = await call();
    expect(results(body).map((r) => r.status)).toEqual(["sent-unrecorded", "sent-unrecorded"]);
    expect(markDeliveredMock).toHaveBeenCalledTimes(6); // 3 attempts x 2 recipients
    expect(sendEmailMock.mock.calls.filter((c) => c[2].to !== "sender@gmail.com")).toHaveLength(2); // sent once each
    expect(sendEmailMock.mock.calls.at(-1)![2].to).toBe("sender@gmail.com");
  }, 15_000);

  it("recovers when saving the record succeeds on a retry", async () => {
    markDeliveredMock.mockRejectedValueOnce(new Error("blip")).mockResolvedValue(undefined);
    const { body } = await call();
    expect(results(body).map((r) => r.status)).toEqual(["sent", "sent"]);
    expect(sendEmailMock).toHaveBeenCalledTimes(2); // no alert needed
  });

  it("sends nothing if the delivery records can't be read (can't rule out duplicates)", async () => {
    getDeliveriesMock.mockRejectedValue(new Error("github down"));
    const { status } = await call();
    expect(status).toBe(500);
    expect(sendEmailMock.mock.calls.every((c) => c[2].to === "sender@gmail.com")).toBe(true);
  });

  it("reports an error per recipient when Gmail credentials are missing", async () => {
    delete process.env.GMAIL_APP_PASSWORD;
    const { body } = await call();
    expect(results(body).map((r) => r.status)).toEqual(["error", "error"]);
    expect(sendEmailMock).not.toHaveBeenCalled();
  });
});

describe("dry run", () => {
  it("previews any date without sending or touching delivery records", async () => {
    setNow("2026-10-12T09:05:00Z"); // not an anniversary day
    const { status, body } = await call({ query: { dryRun: "1", asOf: "2027-05-11" } });
    expect(status).toBe(200);
    expect(results(body).map((r) => r.status)).toEqual(["previewed", "previewed"]);
    expect(body.isBloomDay).toBe(true);
    expect(sendEmailMock).not.toHaveBeenCalled();
    expect(getDeliveriesMock).not.toHaveBeenCalled();
    expect(markDeliveredMock).not.toHaveBeenCalled();
  });
});
