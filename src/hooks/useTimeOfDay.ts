import { useEffect, useMemo, useState } from "react";
import { gardenConfig } from "../config";

export type TimeOfDay = "day" | "evening" | "night";

function resolveHour(instant: Date, timeZone: string): number {
  const formatted = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    hour: "2-digit",
    hourCycle: "h23",
  }).format(instant);
  return Number.parseInt(formatted, 10);
}

export function hourToTimeOfDay(hour: number): TimeOfDay {
  if (hour >= 7 && hour < 18) return "day";
  if (hour >= 18 && hour < 21) return "evening";
  return "night";
}

/** Resolves the current atmosphere (day / evening / night) in the garden's timezone. */
export function useTimeOfDay(previewHour?: number | null): TimeOfDay {
  const [now, setNow] = useState<Date>(() => new Date());

  useEffect(() => {
    if (previewHour != null) return;
    const intervalId = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(intervalId);
  }, [previewHour]);

  return useMemo(() => {
    const hour = previewHour ?? resolveHour(now, gardenConfig.timezone);
    return hourToTimeOfDay(hour);
  }, [now, previewHour]);
}
