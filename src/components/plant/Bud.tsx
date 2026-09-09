import { motion } from "motion/react";
import type { Point } from "./geometry";

export interface BudProps {
  tip: Point;
  angle: number;
  /** 0..1 swelling progress (maps from growth 0.75 -> 1). */
  swell: number;
  reducedMotion: boolean;
}

/** A closed lily bud that gradually swells and blushes pink as bloom nears. */
export function Bud({ tip, angle, swell, reducedMotion }: BudProps) {
  if (swell <= 0) return null;

  const length = 24 + swell * 38;
  const width = 7 + swell * 8;
  const blush = swell; // 0 = fully green, 1 = pink visibly emerging at the tip

  const budPath = `M0,0
    C ${-width},${-length * 0.32} ${-width * 0.6},${-length * 0.88} 0,${-length}
    C ${width * 0.6},${-length * 0.88} ${width},${-length * 0.32} 0,0 Z`;

  const seamPath = `M0,-2 Q ${width * 0.12},${-length * 0.5} 0,${-length * 0.96}`;

  const tipBlushPath = `M${-width * 0.55},${-length * 0.62}
    C ${-width * 0.4},${-length * 0.82} ${-width * 0.25},${-length * 0.96} 0,${-length}
    C ${width * 0.25},${-length * 0.96} ${width * 0.4},${-length * 0.82} ${width * 0.55},${-length * 0.62}
    C ${width * 0.3},${-length * 0.78} ${-width * 0.3},${-length * 0.78} ${-width * 0.55},${-length * 0.62} Z`;

  return (
    <g transform={`translate(${tip.x}, ${tip.y}) rotate(${angle + 90})`}>
      <motion.g
        style={{ transformOrigin: "0px 0px" }}
        initial={{ scale: 0, opacity: 0 }}
        animate={
          reducedMotion ? { scale: 1, opacity: 1 } : { scale: [0, 1.08, 1], opacity: 1 }
        }
        transition={{ duration: reducedMotion ? 0.3 : 0.9, ease: "easeOut" }}
      >
        <path d={budPath} fill="url(#budGradient)" stroke="var(--bud-shade)" strokeWidth={0.6} />
        {blush > 0.35 && (
          <path
            d={tipBlushPath}
            fill="var(--bud-pink)"
            opacity={Math.min(1, (blush - 0.35) / 0.4)}
          />
        )}
        <path d={seamPath} stroke="var(--bud-shade)" strokeWidth={0.7} fill="none" opacity={0.4} />
      </motion.g>
    </g>
  );
}
