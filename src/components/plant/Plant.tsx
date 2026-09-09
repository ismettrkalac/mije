import { useEffect, useMemo } from "react";
import { motion, useAnimationControls } from "motion/react";
import { Pot } from "./Pot";
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
const SOIL_Y = 430;
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
    return 8 + easeInOut(localProgress(growth, 0, 0.15)) * 42;
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

  const p0: Point = { x: CX, y: SOIL_Y };
  const p1: Point = { x: CX + CURVE_AMOUNT, y: SOIL_Y - stemHeight * 0.35 };
  const p2: Point = { x: CX - CURVE_AMOUNT * 0.7, y: SOIL_Y - stemHeight * 0.7 };
  const p3: Point = { x: CX + CURVE_AMOUNT * 0.25, y: SOIL_Y - stemHeight };

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
      viewBox="0 0 400 620"
      className="plant-illustration"
      role="img"
      aria-label={
        isBloomed
          ? "A fully bloomed pink lily in a terracotta pot"
          : "A lily seedling growing in a terracotta pot"
      }
    >
      <defs>
        <linearGradient id="potGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--pot-light)" />
          <stop offset="100%" stopColor="var(--pot-dark)" />
        </linearGradient>
        <linearGradient id="rimGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--pot-rim-light)" />
          <stop offset="100%" stopColor="var(--pot-shade)" />
        </linearGradient>
        <radialGradient id="soilGradient" cx="50%" cy="30%" r="80%">
          <stop offset="0%" stopColor="var(--soil-light)" />
          <stop offset="100%" stopColor="var(--soil-dark)" />
        </radialGradient>
        <linearGradient id="leafGradient" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor="var(--leaf-base)" />
          <stop offset="100%" stopColor="var(--leaf-tip)" />
        </linearGradient>
        <linearGradient id="stemGradient" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor="var(--stem-base)" />
          <stop offset="100%" stopColor="var(--stem-tip)" />
        </linearGradient>
        <radialGradient id="petalGradientOuter" cx="50%" cy="90%" r="100%">
          <stop offset="0%" stopColor="var(--petal-center)" />
          <stop offset="100%" stopColor="var(--petal-outer)" />
        </radialGradient>
        <radialGradient id="petalGradientInner" cx="50%" cy="95%" r="100%">
          <stop offset="0%" stopColor="var(--petal-inner-center)" />
          <stop offset="100%" stopColor="var(--petal-inner-outer)" />
        </radialGradient>
      </defs>

      <ellipse cx={CX} cy={SOIL_Y + 96} rx={150} ry={22} fill="var(--ground-shadow)" opacity={0.18} />

      <motion.g
        animate={controls}
        style={{ transformOrigin: `${CX}px ${SOIL_Y}px`, cursor: onTap ? "pointer" : undefined }}
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
        <Pot soilY={SOIL_Y} />

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
