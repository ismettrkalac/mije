import { motion } from "motion/react";
import type { Point } from "./geometry";

interface LeafProps {
  attach: Point;
  /** Stem tangent angle in degrees at the attachment point. */
  stemAngle: number;
  side: "left" | "right";
  length: number;
  /** 0..1 local growth progress for this individual leaf. */
  growth: number;
  reducedMotion: boolean;
  swayDelay: number;
}

export function Leaf({ attach, stemAngle, side, length, growth, reducedMotion, swayDelay }: LeafProps) {
  if (growth <= 0) return null;

  const dir = side === "left" ? -1 : 1;
  const splay = side === "left" ? -58 : 58;
  const angle = stemAngle + 90 + splay;

  const bulge = length * 0.19;
  const tip = length;
  const leafPath = `M0,0
    C ${dir * bulge * 0.95},${-tip * 0.26} ${dir * bulge * 1.05},${-tip * 0.66} ${dir * bulge * 0.12},${-tip}
    C ${-dir * bulge * 0.4},${-tip * 0.68} ${-dir * bulge * 0.55},${-tip * 0.28} 0,0 Z`;

  const highlight = `M0,${-tip * 0.06}
    C ${dir * bulge * 0.3},${-tip * 0.32} ${dir * bulge * 0.24},${-tip * 0.64} ${dir * bulge * 0.08},${-tip * 0.9}
    C ${dir * bulge * 0.05},${-tip * 0.64} ${dir * bulge * 0.02},${-tip * 0.32} 0,${-tip * 0.06} Z`;

  return (
    <g transform={`translate(${attach.x}, ${attach.y}) rotate(${angle})`}>
      <motion.g
        style={{ transformOrigin: "0px 0px" }}
        initial={{ scale: 0, opacity: 0 }}
        animate={
          reducedMotion
            ? { scale: growth, opacity: 1, rotate: 0 }
            : {
                scale: growth,
                opacity: 1,
                rotate: [0, side === "left" ? -3 : 3, 0],
              }
        }
        transition={
          reducedMotion
            ? { duration: 0.4 }
            : {
                scale: { type: "spring", stiffness: 90, damping: 14 },
                opacity: { duration: 0.6 },
                rotate: {
                  duration: 4.5 + swayDelay,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: swayDelay,
                },
              }
        }
      >
        <path d={leafPath} fill="url(#leafGradient)" stroke="var(--leaf-shade)" strokeWidth={0.6} opacity={0.97} />
        <path d={highlight} fill="var(--leaf-highlight)" opacity={0.4} />
      </motion.g>
    </g>
  );
}
