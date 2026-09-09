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

  const length = 26 + swell * 34;
  const width = 10 + swell * 12;
  const blush = swell; // 0 = green sepal-like bud, 1 = pink-flushed bud

  const budPath = `M0,0
    C ${-width},${-length * 0.3} ${-width * 0.7},${-length * 0.85} 0,${-length}
    C ${width * 0.7},${-length * 0.85} ${width},${-length * 0.3} 0,0 Z`;

  const seamPath = `M0,-2 Q ${width * 0.15},${-length * 0.5} 0,${-length * 0.96}`;

  return (
    <motion.g
      style={{ transformOrigin: `${tip.x}px ${tip.y}px` }}
      transform={`translate(${tip.x}, ${tip.y}) rotate(${angle + 90})`}
      initial={{ scale: 0, opacity: 0 }}
      animate={
        reducedMotion
          ? { scale: 1, opacity: 1 }
          : { scale: [0, swell * 1.05, swell], opacity: 1 }
      }
      transition={{ duration: reducedMotion ? 0.3 : 0.9, ease: "easeOut" }}
    >
      <path
        d={budPath}
        fill={`color-mix(in srgb, var(--bud-green) ${100 - blush * 70}%, var(--bud-pink) ${blush * 70}%)`}
        stroke="var(--bud-edge)"
        strokeWidth={1}
      />
      <path d={seamPath} stroke="var(--bud-edge)" strokeWidth={0.8} fill="none" opacity={0.4} />
    </motion.g>
  );
}
