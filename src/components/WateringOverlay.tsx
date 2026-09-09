import { motion } from "motion/react";

interface WateringOverlayProps {
  /** Increments on every "Water me" tap; used as a remount key to replay the animation. */
  pulse: number;
  reducedMotion: boolean;
}

const SPOUT_TIP = { x: 246, y: 95 };
const SOIL_TARGET = { x: 210, y: 410 };

export function WateringOverlay({ pulse, reducedMotion }: WateringOverlayProps) {
  if (pulse === 0) return null;

  const duration = reducedMotion ? 0.01 : 1.6;

  return (
    <svg
      key={pulse}
      viewBox="0 0 400 450"
      className="watering-overlay"
      aria-hidden="true"
      focusable="false"
    >
      <motion.g
        initial={{ opacity: 0, x: 40, y: -20, rotate: -6 }}
        animate={
          reducedMotion
            ? { opacity: 0 }
            : { opacity: [0, 1, 1, 0], x: [40, 0, 0, -6], y: [-20, 0, 0, -4], rotate: [-6, -38, -34, -6] }
        }
        transition={{ duration, times: [0, 0.28, 0.72, 1], ease: "easeInOut" }}
        style={{ transformOrigin: `${SPOUT_TIP.x}px ${SPOUT_TIP.y}px` }}
      >
        <g transform="translate(216, 37)">
          <rect x="0" y="18" width="58" height="40" rx="12" fill="var(--can-body)" />
          <rect x="8" y="4" width="24" height="18" rx="6" fill="var(--can-body)" />
          <path
            d="M56,30 C78,26 92,34 96,50"
            stroke="var(--can-body)"
            strokeWidth="8"
            strokeLinecap="round"
            fill="none"
          />
          <ellipse cx="98" cy="53" rx="7" ry="6" fill="var(--can-body)" />
          <path
            d="M4,12 C-6,4 -6,-10 6,-14"
            stroke="var(--can-handle)"
            strokeWidth="6"
            strokeLinecap="round"
            fill="none"
          />
        </g>
      </motion.g>

      {!reducedMotion &&
        Array.from({ length: 5 }).map((_, i) => {
          const dropDelay = 0.35 + i * 0.14;
          const dx = (i - 2) * 6;
          return (
            <motion.ellipse
              key={i}
              cx={SPOUT_TIP.x + 10}
              cy={SPOUT_TIP.y + 4}
              rx={3.2}
              ry={4.6}
              fill="var(--droplet-color)"
              initial={{ opacity: 0, x: 0, y: 0 }}
              animate={{
                opacity: [0, 1, 1, 0],
                x: [0, dx * 0.4, dx],
                y: [0, (SOIL_TARGET.y - SPOUT_TIP.y) * 0.6, SOIL_TARGET.y - SPOUT_TIP.y],
              }}
              transition={{ duration: 0.7, delay: dropDelay, ease: "easeIn" }}
            />
          );
        })}

      {!reducedMotion && (
        <motion.ellipse
          cx={SOIL_TARGET.x}
          cy={SOIL_TARGET.y + 6}
          rx={26}
          ry={6}
          fill="var(--droplet-color)"
          initial={{ opacity: 0, scale: 0.4 }}
          animate={{ opacity: [0, 0.35, 0], scale: [0.4, 1.15, 1.3] }}
          transition={{ duration: 0.8, delay: 0.9, ease: "easeOut" }}
        />
      )}
    </svg>
  );
}
