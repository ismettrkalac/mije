import { calendarDateStringToEpochDay, clamp01, toCalendarDateString } from "./date";
import type { GardenConfig } from "../config";

export type GrowthStageId = "sprout" | "stem" | "mature" | "bud" | "bloom";

export interface GrowthStage {
  id: GrowthStageId;
  /** Progress through this specific stage, 0..1. */
  progress: number;
}

export interface GrowthState {
  /** Overall growth, 0 (nothing planted yet) to 1 (bloom day or later). */
  growth: number;
  /** Today's calendar date string, resolved in the configured timezone. */
  todayStr: string;
  /** Whole days from today until the bloom date (can be negative after bloom). */
  daysUntilBloom: number;
  /** True once today is on or after the bloom date. */
  isBloomed: boolean;
  /** True while today is before the configured start date. */
  isBeforeStart: boolean;
  stage: GrowthStage;
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
  const isBeforeStart = todayDay < startDay;

  return {
    growth,
    todayStr,
    daysUntilBloom,
    isBloomed,
    isBeforeStart,
    stage: growthToStage(growth),
  };
}

const STAGE_BOUNDS: { id: GrowthStageId; from: number; to: number }[] = [
  { id: "sprout", from: 0, to: 0.15 },
  { id: "stem", from: 0.15, to: 0.45 },
  { id: "mature", from: 0.45, to: 0.75 },
  { id: "bud", from: 0.75, to: 1 },
];

export function growthToStage(growth: number): GrowthStage {
  if (growth >= 1) {
    return { id: "bloom", progress: 1 };
  }
  for (const bound of STAGE_BOUNDS) {
    if (growth >= bound.from && growth < bound.to) {
      const span = bound.to - bound.from;
      const progress = span > 0 ? (growth - bound.from) / span : 1;
      return { id: bound.id, progress: clamp01(progress) };
    }
  }
  return { id: "sprout", progress: 0 };
}
