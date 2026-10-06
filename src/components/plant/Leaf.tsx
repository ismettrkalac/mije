import type { Point } from "./geometry";

interface LeafProps {
  attach: Point;
  /** Stem tangent angle in degrees at the attachment point. */
  stemAngle: number;
  side: "left" | "right";
  length: number;
  /** How far the leaf's own axis splays away from the stem, in degrees. */
  splay: number;
  /** 0 = stiff and upright, 1 = arching over and drooping at the tip. */
  droop: number;
  /** 0..1 local growth progress for this individual leaf (may overshoot slightly). */
  growth: number;
  reducedMotion: boolean;
  /** Seconds; staggers the grow-in and the idle sway between leaves. */
  swayDelay: number;
}

const SAMPLES = 18;

/** Lily leaves are long, narrow and lance-shaped, arching over under their own weight. */
function buildLeaf(length: number, droop: number, dir: 1 | -1) {
  const p0: Point = { x: 0, y: 0 };
  const p1: Point = { x: dir * length * 0.06, y: -length * 0.62 };
  const p2: Point = { x: dir * length * (0.08 + 0.5 * droop), y: -length * (1 - 0.55 * droop) };
  const maxHalfWidth = length * 0.15;

  const center: Point[] = [];
  const sideA: Point[] = [];
  const sideB: Point[] = [];
  for (let i = 0; i <= SAMPLES; i++) {
    const t = i / SAMPLES;
    const mt = 1 - t;
    const x = mt * mt * p0.x + 2 * mt * t * p1.x + t * t * p2.x;
    const y = mt * mt * p0.y + 2 * mt * t * p1.y + t * t * p2.y;
    const dx = 2 * mt * (p1.x - p0.x) + 2 * t * (p2.x - p1.x);
    const dy = 2 * mt * (p1.y - p0.y) + 2 * t * (p2.y - p1.y);
    const len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len;
    const ny = dx / len;
    const half = maxHalfWidth * Math.sin(Math.PI * Math.pow(t, 0.75)) * (1 - 0.3 * t);
    center.push({ x, y });
    sideA.push({ x: x + nx * half, y: y + ny * half });
    sideB.push({ x: x - nx * half, y: y - ny * half });
  }

  const poly = (pts: Point[]) => pts.map((p) => `${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(" L");
  const half = (side: Point[]) => `M${poly(side)} L${poly([...center].reverse())} Z`;

  /** A vein line running parallel to the midrib at `fraction` of the local half-width. */
  const vein = (fraction: number) => {
    const pts = center.slice(2, SAMPLES - 1).map((c, idx) => {
      const i = idx + 2;
      return {
        x: c.x + (sideA[i].x - c.x) * fraction,
        y: c.y + (sideA[i].y - c.y) * fraction,
      };
    });
    return `M${poly(pts)}`;
  };

  return {
    outline: `M${poly(sideA)} L${poly([...sideB].reverse())} Z`,
    halfA: half(sideA),
    halfB: half(sideB),
    midrib: `M${poly(center.slice(0, SAMPLES - 1))}`,
    veins: [vein(0.5), vein(-0.5)],
  };
}

export function Leaf({ attach, stemAngle, side, length, splay, droop, growth, reducedMotion, swayDelay }: LeafProps) {
  if (growth <= 0) return null;

  const dir = side === "left" ? -1 : 1;
  const angle = stemAngle + 90 + dir * splay;
  const { outline, halfA, halfB, midrib, veins } = buildLeaf(length, droop, dir);
  const flip = dir === 1;

  return (
    <g transform={`translate(${attach.x}, ${attach.y}) rotate(${angle}) scale(${Math.max(0, growth)})`}>
      {/* Animated with CSS (see .leaf-in / .leaf-sway in App.css): the pivot is this leaf's base. */}
      <g
        className={reducedMotion ? undefined : "leaf-in"}
        style={{ ["--leaf-delay" as string]: `${swayDelay}s` }}
      >
        <g
          className={reducedMotion ? undefined : "leaf-sway"}
          style={{
            ["--sway-amp" as string]: `${dir * -2.5}deg`,
            ["--sway-dur" as string]: `${5 + swayDelay}s`,
            ["--sway-delay" as string]: `${swayDelay}s`,
          }}
        >
          {/* two halves folded along the midrib: one lit, one in shade */}
          <path d={flip ? halfA : halfB} fill="url(#leafGradient)" />
          <path d={flip ? halfB : halfA} fill="url(#leafGradient)" />
          <path d={flip ? halfB : halfA} fill="var(--leaf-shade)" opacity={0.28} />
          {length > 40 &&
            veins.map((d, i) => (
              <path key={i} d={d} stroke="var(--leaf-highlight)" strokeWidth={0.5} fill="none" opacity={0.3} />
            ))}
          <path d={midrib} stroke="var(--leaf-highlight)" strokeWidth={length > 50 ? 1 : 0.7} fill="none" opacity={0.6} strokeLinecap="round" />
          <path d={outline} fill="none" stroke="var(--leaf-shade)" strokeWidth={0.6} opacity={0.7} />
        </g>
      </g>
    </g>
  );
}
