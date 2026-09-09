/**
 * Calendar-day helpers. Everything here works in whole calendar days rather
 * than millisecond timestamps, so daylight-saving transitions never shift a
 * day count by an hour's worth of drift.
 */

const CALENDAR_FORMATTER_CACHE = new Map<string, Intl.DateTimeFormat>();

function getCalendarFormatter(timeZone: string): Intl.DateTimeFormat {
  let formatter = CALENDAR_FORMATTER_CACHE.get(timeZone);
  if (!formatter) {
    // en-CA gives a stable YYYY-MM-DD output.
    formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    CALENDAR_FORMATTER_CACHE.set(timeZone, formatter);
  }
  return formatter;
}

/** Returns the calendar date (YYYY-MM-DD) for `instant` as seen in `timeZone`. */
export function toCalendarDateString(instant: Date, timeZone: string): string {
  return getCalendarFormatter(timeZone).format(instant);
}

/** Parses a YYYY-MM-DD calendar date string into whole days since the Unix epoch. */
export function calendarDateStringToEpochDay(dateStr: string): number {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr);
  if (!match) {
    throw new Error(`Invalid calendar date string: ${dateStr}`);
  }
  const [, y, m, d] = match;
  const utcMs = Date.UTC(Number(y), Number(m) - 1, Number(d));
  return Math.round(utcMs / 86_400_000);
}

/** Whole calendar days between two YYYY-MM-DD strings (b - a). */
export function calendarDaysBetween(aDateStr: string, bDateStr: string): number {
  return calendarDateStringToEpochDay(bDateStr) - calendarDateStringToEpochDay(aDateStr);
}

/** Builds a Date at noon UTC for a given epoch day, safely inside any timezone's calendar day. */
export function epochDayToNoonUtcDate(epochDay: number): Date {
  return new Date(epochDay * 86_400_000 + 12 * 3_600_000);
}

export function clamp01(value: number): number {
  if (Number.isNaN(value)) return 0;
  return Math.min(1, Math.max(0, value));
}
