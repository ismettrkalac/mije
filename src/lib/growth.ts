import { calendarDateStringToEpochDay, clamp01, toCalendarDateString } from "./date";
import type { GardenConfig } from "../config";

export interface GrowthState {
  /** Overall growth, 0 (nothing planted yet) to 1 (bloom day or later). */
  growth: number;
  /** Today's calendar date string, resolved in the configured timezone. */
  todayStr: string;
  /** Whole days from today until the bloom date (can be negative after bloom). */
  daysUntilBloom: number;
  /** True once today is on or after the bloom date. */
  isBloomed: boolean;
}

/**
 * Growth is a pure function of calendar days elapsed between the configured
 * start and bloom dates. It deliberately ignores time-of-day and wall-clock
 * milliseconds so the same calendar date always yields the same growth value
 * on every device, and DST transitions never nudge it.
 */
export function computeGrowth(config: GardenConfig, now: Date): GrowthState {
  const todayStr = toCalendarDateString(now, config.timezone);

  const startDay = calendarDateStringToEpochDay(config.startDate);
  const bloomDay = calendarDateStringToEpochDay(config.bloomDate);
  const todayDay = calendarDateStringToEpochDay(todayStr);

  const totalSpan = Math.max(1, bloomDay - startDay);
  const elapsed = todayDay - startDay;
  const growth = clamp01(elapsed / totalSpan);

  const daysUntilBloom = bloomDay - todayDay;
  const isBloomed = todayDay >= bloomDay;

  return {
    growth,
    todayStr,
    daysUntilBloom,
    isBloomed,
  };
}
