import { motion } from "motion/react";

interface WateringOverlayProps {
  /** Increments on every "Water me" tap; used as a remount key to replay the animation. */
  pulse: number;
  reducedMotion: boolean;
}

/** The can pivots around its spout tip, so drops always leave from this point (SVG viewBox units). */
const SPOUT_TIP = { x: 244, y: 282 };
/** Centre of the vase opening (see Plant.tsx BASE_Y / Vase.tsx) where drops land. */
const SOIL = { x: 200, y: 354 };

const DROP_COUNT = 8;
const CAN_SCALE = 1.15;
const DROP_START = 0.6;
const DROP_STAGGER = 0.09;
const DROP_FALL = 0.5;

export function WateringOverlay({ pulse, reducedMotion }: WateringOverlayProps) {
  if (pulse === 0) return null;

  return (
    <svg
      key={pulse}
      viewBox="0 0 400 630"
      className="watering-overlay"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id="canBodyGradient" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="var(--can-light)" />
          <stop offset="55%" stopColor="var(--can-body)" />
          <stop offset="100%" stopColor="var(--can-dark)" />
        </linearGradient>
      </defs>

      {/* The can is animated with CSS keyframes (.watering-can in App.css) rather than Motion: Motion
          rewrites SVG transform origins relative to the element's bounding box, which moved the pivot
          off the spout tip. Here the pivot is exactly SPOUT_TIP in viewBox units. */}
      {!reducedMotion && (
      <g
        className="watering-can"
        style={{ transformOrigin: `${SPOUT_TIP.x}px ${SPOUT_TIP.y}px` }}
      >
        {/* Local coordinates: the spout tip is the origin, the can extends right and down. */}
        <g transform={`translate(${SPOUT_TIP.x} ${SPOUT_TIP.y}) scale(${CAN_SCALE})`}>
          {/* soft shadow under the can */}
          <ellipse cx="60" cy="70" rx="40" ry="5" fill="#000" opacity="0.1" />

          {/* spout */}
          <path d="M36,58 Q24,14 0,0" stroke="var(--can-dark)" strokeWidth="9" strokeLinecap="round" fill="none" />
          <path d="M36,58 Q24,14 0,0" stroke="var(--can-body)" strokeWidth="5.5" strokeLinecap="round" fill="none" />

          {/* sprinkler rose */}
          <ellipse cx="0" cy="0" rx="10" ry="4.2" transform="rotate(-60)" fill="var(--can-dark)" />
          <ellipse cx="0" cy="0" rx="8" ry="2.6" transform="rotate(-60)" fill="var(--can-light)" />

          {/* top handle arch */}
          <path
            d="M44,16 C48,-6 80,-6 84,16"
            stroke="var(--can-dark)"
            strokeWidth="5"
            strokeLinecap="round"
            fill="none"
          />

          {/* back handle */}
          <path
            d="M88,26 C112,24 112,62 86,60"
            stroke="var(--can-dark)"
            strokeWidth="6"
            strokeLinecap="round"
            fill="none"
          />

          {/* body */}
          <path
            d="M32,24 Q32,16 40,16 H82 Q90,16 90,24 V62 Q90,70 82,70 H40 Q32,70 32,62 Z"
            fill="url(#canBodyGradient)"
          />
          {/* rim bands */}
          <rect x="32" y="16" width="58" height="6" rx="3" fill="#fff" opacity="0.28" />
          <rect x="32" y="62" width="58" height="8" rx="4" fill="#000" opacity="0.12" />
          {/* highlight */}
          <path d="M40,28 V56" stroke="#fff" strokeWidth="3.2" strokeLinecap="round" opacity="0.4" />
          {/* filler hole */}
          <ellipse cx="62" cy="16" rx="11" ry="2.8" fill="var(--can-dark)" />
        </g>
      </g>
      )}

      {!reducedMotion &&
        Array.from({ length: DROP_COUNT }).map((_, i) => {
          const delay = DROP_START + i * DROP_STAGGER;
          const targetX = SOIL.x + (i % 4 - 1.5) * 5;
          return (
            <motion.ellipse
              key={i}
              cx={0}
              cy={0}
              rx={2.8}
              ry={4.2}
              fill="var(--droplet-color)"
              initial={{ opacity: 0, x: SPOUT_TIP.x, y: SPOUT_TIP.y }}
              animate={{
                opacity: [0, 1, 1, 0],
                x: [SPOUT_TIP.x, SPOUT_TIP.x - (SPOUT_TIP.x - targetX) * 0.6, targetX],
                y: [SPOUT_TIP.y, SPOUT_TIP.y + (SOIL.y - SPOUT_TIP.y) * 0.22, SOIL.y],
              }}
              transition={{ duration: DROP_FALL, delay, ease: "linear", times: [0, 0.45, 1] }}
            />
          );
        })}

      {!reducedMotion &&
        [0, 1, 2].map((i) => (
          <motion.ellipse
            key={`ripple-${i}`}
            cx={SOIL.x}
            cy={SOIL.y}
            fill="none"
            stroke="var(--droplet-color)"
            strokeWidth={1.6}
            initial={{ opacity: 0, rx: 6, ry: 1.2 }}
            animate={{ opacity: [0, 0.8, 0], rx: [6, 22, 30], ry: [1.2, 4.5, 6] }}
            transition={{ duration: 0.6, delay: DROP_START + DROP_FALL + i * 0.22, ease: "easeOut" }}
          />
        ))}
    </svg>
  );
}
