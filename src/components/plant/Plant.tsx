import { useEffect, useMemo } from "react";
import { motion, useAnimationControls } from "motion/react";
import { Vase, VaseLip } from "./Vase";
import { Leaf } from "./Leaf";
import { Bud } from "./Bud";
import { Flower } from "./Flower";
import {
  cubicBezierPoint,
  cubicBezierTangentAngle,
  easeInOut,
  easeOutBack,
  localProgress,
  taperedStemPath,
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
  /** Receives viewport coordinates of the tap when it came from a pointer. */
  onTap?: (origin?: { x: number; y: number }) => void;
}

const CX = 200;
/** The vase's rim line — where the stem appears to emerge from the illustrated vase. */
const BASE_Y = 355;
const MAX_STEM_HEIGHT = 330;
const CURVE_AMOUNT = 22;

interface LeafSlot {
  t: number;
  side: "left" | "right";
  length: number;
  appearAt: number;
  /** Degrees the leaf splays away from the stem. */
  splay: number;
  /** 0 stiff .. 1 drooping. Lower, older leaves arch over more; new growth stays upright. */
  droop: number;
}

/** Alternating, slightly irregular pairs: older leaves low and long-drooping, new growth near the top upright. */
const LEAF_SLOTS: LeafSlot[] = [
  { t: 0.12, side: "left", length: 44, appearAt: 0.01, splay: 64, droop: 0.55 },
  { t: 0.19, side: "right", length: 40, appearAt: 0.03, splay: 56, droop: 0.5 },
  { t: 0.3, side: "left", length: 72, appearAt: 0.1, splay: 68, droop: 0.74 },
  { t: 0.39, side: "right", length: 84, appearAt: 0.16, splay: 66, droop: 0.74 },
  { t: 0.49, side: "left", length: 92, appearAt: 0.24, splay: 60, droop: 0.68 },
  { t: 0.58, side: "right", length: 96, appearAt: 0.31, splay: 56, droop: 0.62 },
  { t: 0.67, side: "left", length: 96, appearAt: 0.38, splay: 50, droop: 0.52 },
  { t: 0.76, side: "right", length: 92, appearAt: 0.45, splay: 46, droop: 0.44 },
  { t: 0.86, side: "left", length: 62, appearAt: 0.54, splay: 34, droop: 0.22 },
  { t: 0.92, side: "right", length: 48, appearAt: 0.6, splay: 28, droop: 0.15 },
];

function stemHeightForGrowth(growth: number): number {
  if (growth <= 0.15) {
    return 26 + easeInOut(localProgress(growth, 0, 0.15)) * 34;
  }
  if (growth <= 0.75) {
    return 60 + easeInOut(localProgress(growth, 0.15, 0.75)) * (MAX_STEM_HEIGHT * 0.92 - 60);
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
  /** Stems start thin and sturdy up as the plant matures. */
  const baseWidth = growth > 0.15 ? 12.5 : 6.5;
  const tipWidth = growth > 0.15 ? 5.4 : 3.4;

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
      viewBox="0 0 400 630"
      className="plant-illustration"
      role="group"
      aria-label={
        isBloomed
          ? "A fully bloomed pink lily rising from a white vase"
          : "A lily seedling growing from a white vase"
      }
    >
      <defs>
        <linearGradient id="vaseGradient" x1="0" y1="0" x2="1" y2="0.15">
          <stop offset="0%" stopColor="var(--vase-mid)" />
          <stop offset="45%" stopColor="var(--vase-light)" />
          <stop offset="100%" stopColor="var(--vase-dark)" />
        </linearGradient>
        <linearGradient id="vaseRimGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--vase-light)" />
          <stop offset="100%" stopColor="var(--vase-shade)" />
        </linearGradient>
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
        <linearGradient id="petalThroatGradient" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor="#c5d27a" stopOpacity={0.85} />
          <stop offset="100%" stopColor="#e9e39a" stopOpacity={0} />
        </linearGradient>
        <radialGradient id="petalGradientInner" cx="50%" cy="97%" r="110%">
          <stop offset="0%" stopColor="var(--petal-shade)" />
          <stop offset="45%" stopColor="var(--petal-inner-outer)" />
          <stop offset="100%" stopColor="var(--petal-inner-center)" />
        </radialGradient>
      </defs>

      <motion.g
        animate={controls}
        style={{ transformOrigin: `${CX}px ${BASE_Y}px`, cursor: onTap ? "pointer" : undefined }}
        onClick={onTap ? (event) => onTap({ x: event.clientX, y: event.clientY }) : undefined}
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
        <Vase rimY={BASE_Y} />

        <g className={reducedMotion ? undefined : "plant-breeze"}>
        {growth > 0 && (
          <>
            <ellipse cx={CX} cy={BASE_Y + 1} rx={baseWidth * 1.2} ry={2.6} fill="var(--vase-contact-shadow)" opacity={0.4} />
            <path d={taperedStemPath(p0, p1, p2, p3, baseWidth, tipWidth, 28, 9)} fill="url(#stemGradient)" stroke="var(--stem-shade)" strokeWidth={0.5} strokeLinejoin="round" />
            <path d={stemPath} fill="none" stroke="var(--leaf-highlight)" strokeWidth={1.1} strokeLinecap="round" opacity={0.28} transform="translate(-1.2, 0)" />
          </>
        )}

        {growth > 0 &&
          LEAF_SLOTS.filter((slot) => growth >= slot.appearAt).map((slot, index) => {
            const node = cubicBezierPoint(p0, p1, p2, p3, slot.t);
            return <ellipse key={`node-${index}`} cx={node.x} cy={node.y} rx={baseWidth * 0.46} ry={1.5} fill="var(--stem-shade)" opacity={0.45} />;
          })}

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
              splay={slot.splay}
              droop={slot.droop}
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
        </g>
        <VaseLip rimY={BASE_Y} />
      </motion.g>
    </svg>
  );
}
