import { motion } from "motion/react";
import type { Point } from "./geometry";

export interface FlowerProps {
  center: Point;
  angle: number;
  /** Play the full opening animation (first bloom visit, motion allowed). */
  playOpeningAnimation: boolean;
  reducedMotion: boolean;
}

const OUTER_PETAL_COUNT = 6;
const INNER_PETAL_COUNT = 3;

/** A recurved, lily-like tepal: narrow claw at the base, widening past the middle, with a gently notched, backward-curling tip. */
function petalPath(length: number, width: number): string {
  const w = width;
  const l = length;
  return `M0,0
    C ${-w * 0.82},${-l * 0.2} ${-w},${-l * 0.5} ${-w * 0.56},${-l * 0.79}
    C ${-w * 0.32},${-l * 0.95} ${-w * 0.14},${-l * 1.04} 0,${-l * 0.97}
    C ${w * 0.14},${-l * 1.04} ${w * 0.32},${-l * 0.95} ${w * 0.56},${-l * 0.79}
    C ${w},${-l * 0.5} ${w * 0.82},${-l * 0.2} 0,0 Z`;
}

/** The deeper-hued blush stripe running up the petal's centerline, fading out before the paler tip. */
function blushPath(length: number, width: number): string {
  const w = width * 0.34;
  const l = length * 0.86;
  return `M0,${-length * 0.04}
    C ${w * 0.7},${-l * 0.36} ${w * 0.45},${-l * 0.72} 0,${-l}
    C ${-w * 0.45},${-l * 0.72} ${-w * 0.7},${-l * 0.36} 0,${-length * 0.04} Z`;
}

/** Fixed, deterministic speckle layout (fractions of petal width/length) shared by every petal. */
const SPECKLES: { dx: number; dy: number; r: number }[] = [
  { dx: 0.05, dy: 0.18, r: 1.6 },
  { dx: -0.18, dy: 0.24, r: 1.3 },
  { dx: 0.2, dy: 0.28, r: 1.4 },
  { dx: -0.08, dy: 0.32, r: 1.7 },
  { dx: 0.12, dy: 0.38, r: 1.2 },
  { dx: -0.22, dy: 0.4, r: 1.1 },
  { dx: 0.02, dy: 0.45, r: 1.5 },
  { dx: -0.1, dy: 0.5, r: 1.0 },
  { dx: 0.24, dy: 0.48, r: 1.0 },
  { dx: -0.02, dy: 0.24, r: 1.1 },
];

function Petal({ length, width, gradientId, speckled }: { length: number; width: number; gradientId: string; speckled: boolean }) {
  return (
    <>
      <path d={petalPath(length, width)} fill={`url(#${gradientId})`} stroke="var(--petal-shade)" strokeWidth={0.5} opacity={0.98} />
      <path d={blushPath(length, width)} fill="var(--petal-outer)" opacity={0.5} />
      {speckled &&
        SPECKLES.map((s, i) => (
          <ellipse
            key={i}
            cx={s.dx * width}
            cy={-s.dy * length}
            rx={s.r}
            ry={s.r * 1.3}
            fill="var(--petal-speckle)"
            opacity={0.65}
          />
        ))}
    </>
  );
}

export function Flower({ center, angle, playOpeningAnimation, reducedMotion }: FlowerProps) {
  const shouldAnimate = playOpeningAnimation && !reducedMotion;

  return (
    <g transform={`translate(${center.x}, ${center.y})`}>
      {Array.from({ length: OUTER_PETAL_COUNT }).map((_, i) => {
        const petalAngle = angle + 90 + (360 / OUTER_PETAL_COUNT) * i;
        return (
          <g key={`outer-${i}`} transform={`rotate(${petalAngle})`}>
            <motion.g
              style={{ transformOrigin: "0px 0px" }}
              initial={shouldAnimate ? { scaleY: 0.12, scaleX: 0.5, opacity: 0.3 } : false}
              animate={{ scaleY: 1, scaleX: 1, opacity: 1 }}
              transition={
                shouldAnimate
                  ? {
                      type: "spring",
                      stiffness: 60,
                      damping: 11,
                      delay: 0.15 + i * 0.09,
                    }
                  : { duration: 0 }
              }
            >
              <Petal length={64} width={17} gradientId="petalGradientOuter" speckled />
            </motion.g>
          </g>
        );
      })}

      {Array.from({ length: INNER_PETAL_COUNT }).map((_, i) => {
        const petalAngle = angle + 90 + 60 + (360 / INNER_PETAL_COUNT) * i;
        return (
          <g key={`inner-${i}`} transform={`rotate(${petalAngle})`}>
            <motion.g
              style={{ transformOrigin: "0px 0px" }}
              initial={shouldAnimate ? { scaleY: 0.1, scaleX: 0.4, opacity: 0.3 } : false}
              animate={{ scaleY: 1, scaleX: 1, opacity: 1 }}
              transition={
                shouldAnimate
                  ? {
                      type: "spring",
                      stiffness: 65,
                      damping: 11,
                      delay: 0.45 + i * 0.09,
                    }
                  : { duration: 0 }
              }
            >
              <Petal length={44} width={12} gradientId="petalGradientInner" speckled={false} />
            </motion.g>
          </g>
        );
      })}

      <motion.g
        initial={shouldAnimate ? { opacity: 0, scale: 0.4 } : false}
        animate={{ opacity: 1, scale: 1 }}
        transition={shouldAnimate ? { delay: 0.9, duration: 0.5 } : { duration: 0 }}
      >
        {Array.from({ length: 6 }).map((_, i) => {
          const filamentAngle = (360 / 6) * i + 18;
          const rad = (filamentAngle * Math.PI) / 180;
          const midX = Math.sin(rad) * 13;
          const midY = -Math.cos(rad) * 13;
          const endX = Math.sin(rad) * 23;
          const endY = -Math.cos(rad) * 23 + 5;
          return (
            <g key={`stamen-${i}`}>
              <path
                d={`M0,0 Q${midX},${midY} ${endX},${endY}`}
                stroke="var(--stamen-filament)"
                strokeWidth={1.1}
                fill="none"
              />
              <ellipse
                cx={endX}
                cy={endY}
                rx={3.6}
                ry={1.9}
                transform={`rotate(${filamentAngle}, ${endX}, ${endY})`}
                fill="var(--stamen-anther)"
              />
            </g>
          );
        })}

        <path d="M0,0 L0,-27" stroke="var(--stamen-filament)" strokeWidth={1.2} opacity={0.85} />
        <circle cx={-1.4} cy={-27} r={1.3} fill="var(--leaf-mid)" />
        <circle cx={1.4} cy={-27} r={1.3} fill="var(--leaf-mid)" />
        <circle cx={0} cy={-29.5} r={1.3} fill="var(--leaf-mid)" />

        <circle cx={0} cy={0} r={3.2} fill="var(--flower-throat)" />
      </motion.g>
    </g>
  );
}
