/**
 * Pure date math for the monthaversary emails. Built on the same
 * timezone-safe calendar-day helpers the frontend uses (src/lib/date.ts),
 * so "today" in Europe/Belgrade is resolved identically everywhere and DST
 * transitions never shift it by an hour.
 */
import {
  calendarDaysBetween,
  toCalendarDateString,
} from "../../src/lib/date.js";

export interface AnniversaryStatus {
  /** Today's calendar date (YYYY-MM-DD) as seen in the configured timezone. */
  todayStr: string;
  /** Whole months between the relationship start date and today. */
  monthsCompleted: number;
  /** True when today is the start date's day-of-month (or the month's last day, if it is shorter). */
  isAnniversaryDay: boolean;
  /** True when today is exactly the bloom date. */
  isBloomDay: boolean;
  /** True while today is strictly before the bloom date. */
  isBeforeBloom: boolean;
  /** Days remaining until the bloom date (negative once it has passed). */
  daysUntilBloom: number;
}

function splitDateStr(dateStr: string): { year: number; month: number; day: number } {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr);
  if (!match) {
    throw new Error(`Invalid calendar date string: ${dateStr}`);
  }
  const [, y, m, d] = match;
  return { year: Number(y), month: Number(m), day: Number(d) };
}

/** Number of days in a 1-based `month` of `year`. */
export function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

export function computeAnniversaryStatus(
  startDate: string,
  bloomDate: string,
  timezone: string,
  now: Date,
): AnniversaryStatus {
  const todayStr = toCalendarDateString(now, timezone);
  const today = splitDateStr(todayStr);
  const start = splitDateStr(startDate);

  // A start day of 29-31 falls on the last day of shorter months (e.g. the 31st -> Feb 28/29).
  const isAnniversaryDay = today.day === Math.min(start.day, daysInMonth(today.year, today.month));
  const monthsCompleted = (today.year - start.year) * 12 + (today.month - start.month);
  const daysUntilBloom = calendarDaysBetween(todayStr, bloomDate);
  const isBloomDay = todayStr === bloomDate;
  const isBeforeBloom = daysUntilBloom > 0;

  return { todayStr, monthsCompleted, isAnniversaryDay, isBloomDay, isBeforeBloom, daysUntilBloom };
}

/** The local hour (0-23) for `now` as seen in `timeZone`. */
export function getHourInTimezone(now: Date, timeZone: string): number {
  const formatted = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    hour: "2-digit",
    hourCycle: "h23",
  }).format(now);
  return Number(formatted);
}

/** The YYYY-MM month key for `dateStr`, used as the delivery-dedup key. */
export function monthKey(dateStr: string): string {
  return dateStr.slice(0, 7);
}
