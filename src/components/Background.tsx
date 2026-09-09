import { AnimatePresence, motion } from "motion/react";
import type { TimeOfDay } from "../hooks/useTimeOfDay";
import { Butterfly } from "./Butterfly";

interface BackgroundProps {
  timeOfDay: TimeOfDay;
  reducedMotion: boolean;
}

const STARS = [
  { x: 8, y: 10, size: 1.6, delay: 0 },
  { x: 18, y: 22, size: 1.1, delay: 0.6 },
  { x: 28, y: 8, size: 1.8, delay: 1.2 },
  { x: 40, y: 16, size: 1.2, delay: 0.3 },
  { x: 52, y: 6, size: 1.5, delay: 1.6 },
  { x: 63, y: 20, size: 1.1, delay: 0.9 },
  { x: 74, y: 10, size: 1.7, delay: 0.2 },
  { x: 85, y: 24, size: 1.3, delay: 1.4 },
  { x: 92, y: 12, size: 1.5, delay: 0.7 },
  { x: 15, y: 32, size: 1.0, delay: 1.9 },
  { x: 47, y: 28, size: 1.2, delay: 1.1 },
  { x: 70, y: 30, size: 1.0, delay: 0.4 },
  { x: 33, y: 18, size: 1.3, delay: 2.1 },
  { x: 58, y: 34, size: 1.1, delay: 1.7 },
  { x: 4, y: 26, size: 1.4, delay: 0.5 },
];

const CLOUDS = [
  { top: 10, scale: 1, duration: 70, delay: 0, opacity: 0.55 },
  { top: 20, scale: 0.7, duration: 90, delay: -30, opacity: 0.4 },
];

function CloudShape({ opacity }: { opacity: number }) {
  return (
    <svg viewBox="0 0 120 40" width="140" height="46" style={{ opacity }}>
      <ellipse cx="30" cy="26" rx="26" ry="14" fill="var(--cloud-color)" />
      <ellipse cx="60" cy="18" rx="32" ry="18" fill="var(--cloud-color)" />
      <ellipse cx="92" cy="26" rx="24" ry="13" fill="var(--cloud-color)" />
    </svg>
  );
}

export function Background({ timeOfDay, reducedMotion }: BackgroundProps) {
  const showStars = timeOfDay === "night";
  const showClouds = timeOfDay !== "night";
  const showButterflies = timeOfDay === "day";

  return (
    <div className="garden-background" aria-hidden="true">
      <AnimatePresence>
        {showStars && (
          <motion.div
            key="stars"
            className="stars-layer"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2 }}
          >
            {STARS.map((star, i) => (
              <motion.div
                key={i}
                className="star"
                style={{
                  left: `${star.x}%`,
                  top: `${star.y}%`,
                  width: star.size * 3,
                  height: star.size * 3,
                }}
                animate={reducedMotion ? { opacity: 0.75 } : { opacity: [0.35, 1, 0.35] }}
                transition={
                  reducedMotion
                    ? undefined
                    : { duration: 3 + star.size, repeat: Infinity, delay: star.delay, ease: "easeInOut" }
                }
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="celestial-layer">
        <AnimatePresence mode="wait">
          {timeOfDay === "day" && (
            <motion.div
              key="sun"
              className="sun"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.4 }}
            />
          )}
          {timeOfDay === "evening" && (
            <motion.div
              key="evening-sun"
              className="sun evening-sun"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.4 }}
            />
          )}
          {timeOfDay === "night" && (
            <motion.div
              key="moon"
              className="moon"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.4 }}
            >
              <svg viewBox="0 0 60 60" width="100%" height="100%">
                <path
                  d="M30,4 A26,26 0 1 0 30,56 A20,20 0 0 1 30,4 Z"
                  fill="var(--moon-color)"
                />
              </svg>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {showClouds && (
        <div className="clouds-layer">
          {CLOUDS.map((cloud, i) => (
            <motion.div
              key={i}
              className="cloud"
              style={{ top: `${cloud.top}%`, scale: cloud.scale }}
              initial={{ x: "-20vw" }}
              animate={reducedMotion ? { x: "40vw" } : { x: "120vw" }}
              transition={
                reducedMotion
                  ? { duration: 0 }
                  : { duration: cloud.duration, delay: cloud.delay, repeat: Infinity, ease: "linear" }
              }
            >
              <CloudShape opacity={cloud.opacity} />
            </motion.div>
          ))}
        </div>
      )}

      {showButterflies && (
        <div className="butterflies-layer">
          <Butterfly lane={0} delay={2} duration={14} color="var(--butterfly-a)" reducedMotion={reducedMotion} />
          <Butterfly lane={1} delay={9} duration={17} color="var(--butterfly-b)" reducedMotion={reducedMotion} />
        </div>
      )}
    </div>
  );
}
