import { describe, expect, it } from "vitest";
import { calendarDateStringToEpochDay, calendarDaysBetween, clamp01, toCalendarDateString } from "./date";

describe("toCalendarDateString", () => {
  it("resolves the calendar day in the given timezone, not UTC", () => {
    // 23:30 UTC on 10 May is already 01:30 on 11 May in Belgrade (CEST, UTC+2).
    const instant = new Date("2026-05-10T23:30:00Z");
    expect(toCalendarDateString(instant, "Europe/Belgrade")).toBe("2026-05-11");
    expect(toCalendarDateString(instant, "UTC")).toBe("2026-05-10");
  });

  it("is stable across the spring DST change", () => {
    expect(toCalendarDateString(new Date("2026-03-29T00:30:00Z"), "Europe/Belgrade")).toBe("2026-03-29");
    expect(toCalendarDateString(new Date("2026-03-29T23:30:00Z"), "Europe/Belgrade")).toBe("2026-03-30");
  });
});

describe("calendarDaysBetween", () => {
  it("counts whole days, including leap years", () => {
    expect(calendarDaysBetween("2026-05-11", "2027-05-11")).toBe(365);
    expect(calendarDaysBetween("2027-12-31", "2028-03-01")).toBe(61);
  });

  it("is not affected by DST (a day is still a day)", () => {
    expect(calendarDaysBetween("2026-03-28", "2026-03-30")).toBe(2);
    expect(calendarDaysBetween("2026-10-24", "2026-10-26")).toBe(2);
  });

  it("is negative when the second date is earlier", () => {
    expect(calendarDaysBetween("2026-05-12", "2026-05-11")).toBe(-1);
  });
});

describe("calendarDateStringToEpochDay", () => {
  it("rejects malformed input", () => {
    expect(() => calendarDateStringToEpochDay("2026-5-1")).toThrow();
    expect(() => calendarDateStringToEpochDay("tomorrow")).toThrow();
  });
});

describe("clamp01", () => {
  it("clamps and treats NaN as 0", () => {
    expect(clamp01(-1)).toBe(0);
    expect(clamp01(2)).toBe(1);
    expect(clamp01(0.4)).toBe(0.4);
    expect(clamp01(Number.NaN)).toBe(0);
  });
});
