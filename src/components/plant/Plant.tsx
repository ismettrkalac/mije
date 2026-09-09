import { useEffect, useMemo } from "react";
import { motion, useAnimationControls } from "motion/react";
import { Leaf } from "./Leaf";
import { Bud } from "./Bud";
import { Flower } from "./Flower";
import {
  cubicBezierPoint,
  cubicBezierTangentAngle,
  easeInOut,
  easeOutBack,
  localProgress,
  type Point,
} from "./geometry";

export interface PlantProps {
  growth: number;
  isBloomed: boolean;
  playOpeningAnimation: boolean;
  reducedMotion: boolean;
  /** Increment to trigger the "watered" perk-up animation. */
  waterPulse: number;
  /** Increment to trigger a tap wiggle. */
  tapPulse: number;
  onTap?: () => void;
}

const CX = 200;
/** The vase's rim line — where the stem appears to emerge from the real photographed vase. */
const BASE_Y = 430;
const MAX_STEM_HEIGHT = 300;
const CURVE_AMOUNT = 22;

interface LeafSlot {
  t: number;
  side: "left" | "right";
  length: number;
  appearAt: number;
}

const LEAF_SLOTS: LeafSlot[] = [
  { t: 0.16, side: "left", length: 30, appearAt: 0.01 },
  { t: 0.21, side: "right", length: 30, appearAt: 0.03 },
  { t: 0.45, side: "left", length: 56, appearAt: 0.18 },
  { t: 0.53, side: "right", length: 60, appearAt: 0.25 },
  { t: 0.74, side: "left", length: 70, appearAt: 0.42 },
  { t: 0.82, side: "right", length: 74, appearAt: 0.5 },
];

function stemHeightForGrowth(growth: number): number {
  if (growth <= 0.15) {
    return 18 + easeInOut(localProgress(growth, 0, 0.15)) * 32;
  }
  if (growth <= 0.75) {
    return 50 + easeInOut(localProgress(growth, 0.15, 0.75)) * (MAX_STEM_HEIGHT * 0.92 - 50);
  }
  return (
    MAX_STEM_HEIGHT * 0.92 +
    easeInOut(localProgress(growth, 0.75, 1)) * (MAX_STEM_HEIGHT * 0.08)
  );
}

export function Plant({
  growth,
  isBloomed,
  playOpeningAnimation,
  reducedMotion,
  waterPulse,
  tapPulse,
  onTap,
}: PlantProps) {
  const controls = useAnimationControls();

  const stemHeight = useMemo(() => stemHeightForGrowth(growth), [growth]);

  const p0: Point = { x: CX, y: BASE_Y };
  const p1: Point = { x: CX + CURVE_AMOUNT, y: BASE_Y - stemHeight * 0.35 };
  const p2: Point = { x: CX - CURVE_AMOUNT * 0.7, y: BASE_Y - stemHeight * 0.7 };
  const p3: Point = { x: CX + CURVE_AMOUNT * 0.25, y: BASE_Y - stemHeight };

  const stemPath = `M${p0.x},${p0.y} C${p1.x},${p1.y} ${p2.x},${p2.y} ${p3.x},${p3.y}`;
  const tipAngle = cubicBezierTangentAngle(p0, p1, p2, p3, 1);
  const budSwell = localProgress(growth, 0.75, 1);

  useEffect(() => {
    if (tapPulse === 0) return;
    if (reducedMotion) return;
    void controls.start({
      rotate: [0, -3.5, 2.5, -1.5, 1, 0],
      transition: { duration: 0.7, ease: "easeInOut" },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tapPulse]);

  useEffect(() => {
    if (waterPulse === 0) return;
    if (reducedMotion) {
      void controls.start({ scale: 1, y: 0 });
      return;
    }
    void controls.start({
      scale: [1, 1.05, 0.98, 1.02, 1],
      y: [0, -8, 2, -3, 0],
      transition: { duration: 0.9, ease: "easeInOut" },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [waterPulse]);

  return (
    <svg
      viewBox="0 0 400 450"
      className="plant-illustration"
      role="img"
      aria-label={
        isBloomed
          ? "A fully bloomed pink lily rising from the vase"
          : "A lily seedling growing from the vase"
      }
    >
      <defs>
        <linearGradient id="leafGradient" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor="var(--leaf-dark)" />
          <stop offset="55%" stopColor="var(--leaf-mid)" />
          <stop offset="100%" stopColor="var(--leaf-tip)" />
        </linearGradient>
        <linearGradient id="stemGradient" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor="var(--stem-shade)" />
          <stop offset="55%" stopColor="var(--stem-base)" />
          <stop offset="100%" stopColor="var(--stem-tip)" />
        </linearGradient>
        <linearGradient id="budGradient" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor="var(--bud-shade)" />
          <stop offset="60%" stopColor="var(--bud-green)" />
          <stop offset="100%" stopColor="var(--bud-highlight)" />
        </linearGradient>
        <radialGradient id="petalGradientOuter" cx="50%" cy="96%" r="110%">
          <stop offset="0%" stopColor="var(--petal-deep)" />
          <stop offset="30%" stopColor="var(--petal-outer)" />
          <stop offset="70%" stopColor="var(--petal-mid)" />
          <stop offset="100%" stopColor="var(--petal-center)" />
        </radialGradient>
        <radialGradient id="petalGradientInner" cx="50%" cy="97%" r="110%">
          <stop offset="0%" stopColor="var(--petal-shade)" />
          <stop offset="45%" stopColor="var(--petal-inner-outer)" />
          <stop offset="100%" stopColor="var(--petal-inner-center)" />
        </radialGradient>
      </defs>

      <motion.g
        animate={controls}
        style={{ transformOrigin: `${CX}px ${BASE_Y}px`, cursor: onTap ? "pointer" : undefined }}
        onClick={onTap}
        tabIndex={onTap ? 0 : undefined}
        role={onTap ? "button" : undefined}
        aria-label={onTap ? "Tap the lily" : undefined}
        onKeyDown={
          onTap
            ? (event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  onTap();
                }
              }
            : undefined
        }
      >
        {growth > 0 && (
          <path
            d={stemPath}
            fill="none"
            stroke="url(#stemGradient)"
            strokeWidth={growth > 0.15 ? 7 : 4}
            strokeLinecap="round"
          />
        )}

        {LEAF_SLOTS.map((slot, index) => {
          const point = cubicBezierPoint(p0, p1, p2, p3, slot.t);
          const angle = cubicBezierTangentAngle(p0, p1, p2, p3, slot.t);
          const localGrowth = easeOutBack(localProgress(growth, slot.appearAt, slot.appearAt + 0.16));
          return (
            <Leaf
              key={index}
              attach={point}
              stemAngle={angle}
              side={slot.side}
              length={slot.length}
              growth={localGrowth}
              reducedMotion={reducedMotion}
              swayDelay={index * 0.35}
            />
          );
        })}

        {isBloomed ? (
          <Flower
            center={p3}
            angle={tipAngle}
            playOpeningAnimation={playOpeningAnimation}
            reducedMotion={reducedMotion}
          />
        ) : (
          <Bud tip={p3} angle={tipAngle} swell={budSwell} reducedMotion={reducedMotion} />
        )}
      </motion.g>
    </svg>
  );
}
