import { motion } from "motion/react";

interface ButterflyProps {
  /** 0-1 horizontal starting lane, used to vary flight paths deterministically. */
  lane: number;
  delay: number;
  duration: number;
  color: string;
  reducedMotion: boolean;
}

export function Butterfly({ lane, delay, duration, color, reducedMotion }: ButterflyProps) {
  if (reducedMotion) return null;

  const startX = -10;
  const endX = 110;
  const baseY = 18 + lane * 55;
  const wobble = 10 + lane * 6;

  return (
    <motion.div
      className="butterfly"
      style={{ top: `${baseY}%` }}
      initial={{ left: `${startX}%`, opacity: 0 }}
      animate={{
        left: [`${startX}%`, `${endX}%`],
        top: [`${baseY}%`, `${baseY - wobble}%`, `${baseY + wobble}%`, `${baseY}%`],
        opacity: [0, 1, 1, 0],
      }}
      transition={{
        duration,
        delay,
        repeat: Infinity,
        repeatDelay: 6 + lane * 4,
        ease: "easeInOut",
      }}
      aria-hidden="true"
    >
      <svg viewBox="0 0 40 30" width="26" height="20">
        <motion.g
          animate={{ scaleX: [1, 0.55, 1] }}
          transition={{ duration: 0.5, repeat: Infinity, ease: "easeInOut" }}
          style={{ transformOrigin: "20px 15px" }}
        >
          <path d="M20,15 C10,2 -2,4 4,16 C-2,26 12,26 20,15 Z" fill={color} opacity={0.85} />
          <path d="M20,15 C30,2 42,4 36,16 C42,26 28,26 20,15 Z" fill={color} opacity={0.85} />
        </motion.g>
        <line x1="20" y1="9" x2="20" y2="21" stroke="var(--butterfly-body)" strokeWidth={2} strokeLinecap="round" />
      </svg>
    </motion.div>
  );
}
