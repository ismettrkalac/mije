import { describe, expect, it } from "vitest";
import { computeAnniversaryStatus, daysInMonth, getHourInTimezone, monthKey } from "./anniversary.js";

const TZ = "Europe/Belgrade";
const status = (start: string, bloom: string, iso: string) =>
  computeAnniversaryStatus(start, bloom, TZ, new Date(`${iso}T12:00:00Z`));

describe("computeAnniversaryStatus", () => {
  it("flags the same day of the month and counts completed months", () => {
    const s = status("2026-05-11", "2027-05-11", "2026-09-11");
    expect(s.isAnniversaryDay).toBe(true);
    expect(s.monthsCompleted).toBe(4);
    expect(s.daysUntilBloom).toBe(242);
    expect(s.isBeforeBloom).toBe(true);
  });

  it("does not flag other days", () => {
    expect(status("2026-05-11", "2027-05-11", "2026-09-12").isAnniversaryDay).toBe(false);
  });

  it("flags bloom day, which is also a monthaversary", () => {
    const s = status("2026-05-11", "2027-05-11", "2027-05-11");
    expect(s.isBloomDay).toBe(true);
    expect(s.isAnniversaryDay).toBe(true);
    expect(s.monthsCompleted).toBe(12);
    expect(s.isBeforeBloom).toBe(false);
  });

  it("uses the last day of shorter months when the start day is 29-31", () => {
    expect(status("2026-01-31", "2027-01-31", "2026-02-28").isAnniversaryDay).toBe(true);
    expect(status("2026-01-31", "2027-01-31", "2026-02-27").isAnniversaryDay).toBe(false);
    expect(status("2026-01-31", "2027-01-31", "2026-04-30").isAnniversaryDay).toBe(true);
    // Leap year: Feb 29 is the last day, so Feb 28 is not the anniversary.
    expect(status("2027-01-31", "2028-01-31", "2028-02-29").isAnniversaryDay).toBe(true);
    expect(status("2027-01-31", "2028-01-31", "2028-02-28").isAnniversaryDay).toBe(false);
    // Months that do have a 31st still use it, and only it.
    expect(status("2026-01-31", "2027-01-31", "2026-03-31").isAnniversaryDay).toBe(true);
    expect(status("2026-01-31", "2027-01-31", "2026-03-30").isAnniversaryDay).toBe(false);
  });
});

describe("daysInMonth", () => {
  it("knows month lengths and leap years", () => {
    expect(daysInMonth(2026, 2)).toBe(28);
    expect(daysInMonth(2028, 2)).toBe(29);
    expect(daysInMonth(2026, 4)).toBe(30);
    expect(daysInMonth(2026, 12)).toBe(31);
  });
});

describe("getHourInTimezone", () => {
  it("handles summer and winter offsets (09:00 UTC is always >= 10:00 in Belgrade)", () => {
    expect(getHourInTimezone(new Date("2026-07-11T09:00:00Z"), TZ)).toBe(11);
    expect(getHourInTimezone(new Date("2026-12-11T09:00:00Z"), TZ)).toBe(10);
  });
});

describe("monthKey", () => {
  it("keeps the YYYY-MM prefix", () => {
    expect(monthKey("2026-09-11")).toBe("2026-09");
  });
});
