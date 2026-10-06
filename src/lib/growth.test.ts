import { describe, expect, it } from "vitest";
import { computeGrowth } from "./growth";
import type { GardenConfig } from "../config";

const config: GardenConfig = {
  startDate: "2026-05-11",
  bloomDate: "2027-05-11",
  timezone: "Europe/Belgrade",
  recipientName: "x",
  heading: "x",
  caption: "x",
  letterTitle: "x",
  letterText: "x",
  letterSignature: "x",
};

const at = (iso: string) => new Date(`${iso}T12:00:00Z`);

describe("computeGrowth", () => {
  it("is 0 before and on the start date, and never negative", () => {
    expect(computeGrowth(config, at("2026-05-01")).growth).toBe(0);
    expect(computeGrowth(config, at("2026-05-11")).growth).toBe(0);
  });

  it("grows linearly by whole days", () => {
    const halfway = computeGrowth(config, at("2026-11-10"));
    expect(halfway.growth).toBeCloseTo(183 / 365, 5);
    expect(halfway.isBloomed).toBe(false);
  });

  it("blooms exactly on the bloom date", () => {
    const dayBefore = computeGrowth(config, at("2027-05-10"));
    expect(dayBefore.isBloomed).toBe(false);
    expect(dayBefore.daysUntilBloom).toBe(1);

    const bloomDay = computeGrowth(config, at("2027-05-11"));
    expect(bloomDay.isBloomed).toBe(true);
    expect(bloomDay.growth).toBe(1);
    expect(bloomDay.daysUntilBloom).toBe(0);
  });

  it("stays fully bloomed afterwards", () => {
    const later = computeGrowth(config, at("2028-01-01"));
    expect(later.isBloomed).toBe(true);
    expect(later.growth).toBe(1);
    expect(later.daysUntilBloom).toBeLessThan(0);
  });

  it("uses the configured timezone to decide what 'today' is", () => {
    // 22:30 UTC on 10 May 2027 is already 11 May (bloom day) in Belgrade.
    expect(computeGrowth(config, new Date("2027-05-10T22:30:00Z")).isBloomed).toBe(true);
  });
});
