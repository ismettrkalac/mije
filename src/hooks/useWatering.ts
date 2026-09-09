import { useCallback, useState } from "react";
import { readString, writeString, STORAGE_KEYS } from "../lib/storage";

export interface WateringState {
  /** Whether today's watering has already been recorded (in the garden's timezone). */
  wateredToday: boolean;
  /** Record today's watering. Safe to call repeatedly — only writes once per day. */
  recordWatering: () => void;
}

/** Tracks the "watered today" record, keyed to the same calendar day used for growth. */
export function useWatering(todayStr: string): WateringState {
  const [lastWateredDate, setLastWateredDate] = useState<string | null>(() =>
    readString(STORAGE_KEYS.lastWateredDate),
  );

  const recordWatering = useCallback(() => {
    setLastWateredDate((current) => {
      if (current === todayStr) return current;
      writeString(STORAGE_KEYS.lastWateredDate, todayStr);
      return todayStr;
    });
  }, [todayStr]);

  return {
    wateredToday: lastWateredDate === todayStr,
    recordWatering,
  };
}
