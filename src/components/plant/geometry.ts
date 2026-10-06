export interface Point {
  x: number;
  y: number;
}

/** Point at parameter t (0..1) along a cubic Bezier curve. */
export function cubicBezierPoint(p0: Point, p1: Point, p2: Point, p3: Point, t: number): Point {
  const mt = 1 - t;
  const a = mt * mt * mt;
  const b = 3 * mt * mt * t;
  const c = 3 * mt * t * t;
  const d = t * t * t;
  return {
    x: a * p0.x + b * p1.x + c * p2.x + d * p3.x,
    y: a * p0.y + b * p1.y + c * p2.y + d * p3.y,
  };
}

/** Tangent angle in degrees at parameter t (0 = pointing along +x). */
export function cubicBezierTangentAngle(p0: Point, p1: Point, p2: Point, p3: Point, t: number): number {
  const mt = 1 - t;
  const dx =
    3 * mt * mt * (p1.x - p0.x) + 6 * mt * t * (p2.x - p1.x) + 3 * t * t * (p3.x - p2.x);
  const dy =
    3 * mt * mt * (p1.y - p0.y) + 6 * mt * t * (p2.y - p1.y) + 3 * t * t * (p3.y - p2.y);
  return (Math.atan2(dy, dx) * 180) / Math.PI;
}

export function pointToPath(p: Point): string {
  return `${p.x.toFixed(2)},${p.y.toFixed(2)}`;
}

/** Smoothstep-style ease for gentle, natural-feeling growth interpolation. */
export function easeInOut(t: number): number {
  const clamped = Math.min(1, Math.max(0, t));
  return clamped * clamped * (3 - 2 * clamped);
}

/** A soft overshoot ease used for leaves/petals perking into place. */
export function easeOutBack(t: number): number {
  const clamped = Math.min(1, Math.max(0, t));
  const c1 = 1.4;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(clamped - 1, 3) + c1 * Math.pow(clamped - 1, 2);
}

/** Maps growth (0..1) into a local 0..1 progress within [from, to]. */
export function localProgress(growth: number, from: number, to: number): number {
  if (to <= from) return growth >= to ? 1 : 0;
  return Math.min(1, Math.max(0, (growth - from) / (to - from)));
}

/** Linear interpolation. */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/**
 * Closed outline of a tapering stem: a filled ribbon that follows the cubic Bezier and narrows
 * from `baseWidth` to `tipWidth`, instead of a constant-width stroke.
 */
export function taperedStemPath(
  p0: Point,
  p1: Point,
  p2: Point,
  p3: Point,
  baseWidth: number,
  tipWidth: number,
  samples = 28,
  /** How far the stem continues backwards past p0 (e.g. down into the vase). */
  baseExtension = 0,
): string {
  const left: Point[] = [];
  const right: Point[] = [];
  if (baseExtension > 0) {
    const startAngle = (cubicBezierTangentAngle(p0, p1, p2, p3, 0) * Math.PI) / 180;
    const half = baseWidth / 2;
    const base = {
      x: p0.x - Math.cos(startAngle) * baseExtension,
      y: p0.y - Math.sin(startAngle) * baseExtension,
    };
    left.push({ x: base.x - Math.sin(startAngle) * half, y: base.y + Math.cos(startAngle) * half });
    right.push({ x: base.x + Math.sin(startAngle) * half, y: base.y - Math.cos(startAngle) * half });
  }
  for (let i = 0; i <= samples; i++) {
    const t = i / samples;
    const c = cubicBezierPoint(p0, p1, p2, p3, t);
    const angle = (cubicBezierTangentAngle(p0, p1, p2, p3, t) * Math.PI) / 180;
    const half = lerp(baseWidth, tipWidth, Math.pow(t, 0.8)) / 2;
    const nx = -Math.sin(angle);
    const ny = Math.cos(angle);
    left.push({ x: c.x + nx * half, y: c.y + ny * half });
    right.push({ x: c.x - nx * half, y: c.y - ny * half });
  }
  const pts = [...left, ...right.reverse()];
  return `M${pts.map((p) => `${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(" L")} Z`;
}
