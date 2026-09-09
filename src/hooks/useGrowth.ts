import { useEffect, useMemo, useState } from "react";
import { computeGrowth, type GrowthState } from "../lib/growth";
import { gardenConfig } from "../config";

/**
 * Tracks growth against real wall-clock time. Recomputes on an interval and
 * whenever the tab regains focus/visibility, so growth advances correctly if
 * the page is left open across midnight or reopened days later.
 *
 * Passing `previewDate` (dev tool only) freezes growth to that instant
 * without touching any real saved state.
 */
export function useGrowth(previewDate?: Date | null): GrowthState {
  const [now, setNow] = useState<Date>(() => previewDate ?? new Date());

  useEffect(() => {
    if (previewDate) {
      setNow(previewDate);
      return;
    }

    setNow(new Date());
    const intervalId = window.setInterval(() => setNow(new Date()), 60_000);

    const handleRefresh = () => {
      if (document.visibilityState === "visible") {
        setNow(new Date());
      }
    };
    document.addEventListener("visibilitychange", handleRefresh);
    window.addEventListener("focus", handleRefresh);

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", handleRefresh);
      window.removeEventListener("focus", handleRefresh);
    };
  }, [previewDate]);

  return useMemo(() => computeGrowth(gardenConfig, now), [now]);
}
