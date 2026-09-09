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

  const bulge = length * 0.4;
  const tip = length;
  const leafPath = `M0,0
    C ${dir * bulge * 0.5},${-tip * 0.38} ${dir * bulge},${-tip * 0.72} 0,${-tip}
    C ${-dir * bulge * 0.55},${-tip * 0.72} ${-dir * bulge * 0.3},${-tip * 0.38} 0,0 Z`;

  const midrib = `M0,-2 Q ${dir * bulge * 0.18},${-tip * 0.5} 0,${-tip * 0.94}`;

  return (
    <motion.g
      style={{ transformOrigin: `${attach.x}px ${attach.y}px` }}
      transform={`translate(${attach.x}, ${attach.y}) rotate(${angle})`}
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
      <path d={leafPath} fill="url(#leafGradient)" stroke="var(--leaf-edge)" strokeWidth={1} />
      <path d={midrib} stroke="var(--leaf-vein)" strokeWidth={1.1} fill="none" opacity={0.55} />
    </motion.g>
  );
}
