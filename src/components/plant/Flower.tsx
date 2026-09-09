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

function petalPath(length: number, width: number): string {
  return `M0,0
    C ${-width},${-length * 0.32} ${-width * 0.85},${-length * 0.82} 0,${-length}
    C ${width * 0.85},${-length * 0.82} ${width},${-length * 0.32} 0,0 Z`;
}

export function Flower({ center, angle, playOpeningAnimation, reducedMotion }: FlowerProps) {
  const outerPath = petalPath(58, 20);
  const innerPath = petalPath(40, 13);

  const shouldAnimate = playOpeningAnimation && !reducedMotion;

  return (
    <g transform={`translate(${center.x}, ${center.y})`}>
      {Array.from({ length: OUTER_PETAL_COUNT }).map((_, i) => {
        const petalAngle = angle + 90 + (360 / OUTER_PETAL_COUNT) * i;
        return (
          <motion.g
            key={`outer-${i}`}
            style={{ transformOrigin: "0px 0px" }}
            transform={`rotate(${petalAngle})`}
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
            <path d={outerPath} fill="url(#petalGradientOuter)" stroke="var(--petal-edge)" strokeWidth={1} />
            <path
              d={`M0,-4 Q6,${-58 * 0.5} 0,${-58 * 0.9}`}
              stroke="var(--petal-vein)"
              strokeWidth={0.8}
              fill="none"
              opacity={0.4}
            />
          </motion.g>
        );
      })}

      {Array.from({ length: INNER_PETAL_COUNT }).map((_, i) => {
        const petalAngle = angle + 90 + 60 + (360 / INNER_PETAL_COUNT) * i;
        return (
          <motion.g
            key={`inner-${i}`}
            style={{ transformOrigin: "0px 0px" }}
            transform={`rotate(${petalAngle})`}
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
            <path d={innerPath} fill="url(#petalGradientInner)" stroke="var(--petal-edge)" strokeWidth={0.8} />
          </motion.g>
        );
      })}

      <motion.g
        initial={shouldAnimate ? { opacity: 0, scale: 0.4 } : false}
        animate={{ opacity: 1, scale: 1 }}
        transition={shouldAnimate ? { delay: 0.9, duration: 0.5 } : { duration: 0 }}
      >
        {Array.from({ length: 6 }).map((_, i) => {
          const filamentAngle = (360 / 6) * i + 20;
          const rad = (filamentAngle * Math.PI) / 180;
          const fx = Math.sin(rad) * 16;
          const fy = -Math.cos(rad) * 16;
          return (
            <g key={`stamen-${i}`}>
              <line x1={0} y1={0} x2={fx} y2={fy} stroke="var(--stamen-filament)" strokeWidth={1} />
              <ellipse
                cx={fx}
                cy={fy}
                rx={2.6}
                ry={1.6}
                transform={`rotate(${filamentAngle}, ${fx}, ${fy})`}
                fill="var(--stamen-anther)"
              />
            </g>
          );
        })}
        <circle cx={0} cy={0} r={3.5} fill="var(--flower-throat)" />
      </motion.g>
    </g>
  );
}
