import { useEffect, useRef } from "react";

export interface BurstRequest {
  /** Increments per burst so repeat taps at the same spot still fire. */
  id: number;
  /** Viewport coordinates; falls back to the lower-middle of the screen. */
  x?: number;
  y?: number;
  /** Defaults to petals; sparkles are short golden flecks (used for watering). */
  kind?: "petal" | "sparkle";
}

interface AmbientParticlesProps {
  burst: BurstRequest;
  reducedMotion: boolean;
}

type Kind = "mote" | "petal";

interface Particle {
  kind: Kind;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  rot: number;
  spin: number;
  phase: number;
  /** Seconds left for burst particles; Infinity for ambient ones. */
  life: number;
  maxLife: number;
  hue: string;
}

const PETAL_COLORS = ["#e3a3b3", "#c76b85", "#f0c4cf", "#fbeeee"];
const AMBIENT_COUNT = 22;
const POINTER_RADIUS = 110;

/** Soft pollen glow drawn once and stamped per mote, instead of building a gradient every frame. */
let glowSprite: HTMLCanvasElement | undefined;
const GLOW_SIZE = 64;

function getGlowSprite(): HTMLCanvasElement {
  if (glowSprite) return glowSprite;
  const sprite = document.createElement("canvas");
  sprite.width = GLOW_SIZE;
  sprite.height = GLOW_SIZE;
  const spriteCtx = sprite.getContext("2d");
  if (spriteCtx) {
    const half = GLOW_SIZE / 2;
    const glow = spriteCtx.createRadialGradient(half, half, 0, half, half, half);
    glow.addColorStop(0, "rgba(255, 243, 196, 0.9)");
    glow.addColorStop(1, "rgba(255, 243, 196, 0)");
    spriteCtx.fillStyle = glow;
    spriteCtx.fillRect(0, 0, GLOW_SIZE, GLOW_SIZE);
  }
  glowSprite = sprite;
  return sprite;
}

function rand(min: number, max: number) {
  return min + Math.random() * (max - min);
}

function makeAmbient(w: number, h: number, anywhere: boolean): Particle {
  const kind: Kind = Math.random() < 0.3 ? "petal" : "mote";
  return {
    kind,
    x: rand(0, w),
    y: anywhere ? rand(0, h) : h + 20,
    vx: rand(-6, 6),
    vy: -rand(5, 16),
    size: kind === "petal" ? rand(4, 7) : rand(1.5, 3.5),
    alpha: kind === "petal" ? rand(0.35, 0.6) : rand(0.25, 0.6),
    rot: rand(0, Math.PI * 2),
    spin: rand(-1, 1),
    phase: rand(0, Math.PI * 2),
    life: Infinity,
    maxLife: Infinity,
    hue: kind === "petal" ? PETAL_COLORS[Math.floor(rand(0, PETAL_COLORS.length))] : "#fff3c4",
  };
}

function makeBurstPetal(x: number, y: number): Particle {
  const angle = rand(-Math.PI * 0.95, -Math.PI * 0.05);
  const speed = rand(60, 170);
  const maxLife = rand(1.6, 2.8);
  return {
    kind: "petal",
    x,
    y,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    size: rand(4, 8),
    alpha: 0.9,
    rot: rand(0, Math.PI * 2),
    spin: rand(-4, 4),
    phase: rand(0, Math.PI * 2),
    life: maxLife,
    maxLife,
    hue: PETAL_COLORS[Math.floor(rand(0, PETAL_COLORS.length))],
  };
}

function makeSparkle(x: number, y: number): Particle {
  const angle = rand(-Math.PI * 0.9, -Math.PI * 0.1);
  const speed = rand(25, 90);
  const maxLife = rand(0.9, 1.6);
  return {
    kind: "mote",
    x: x + rand(-18, 18),
    y,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    size: rand(2, 4),
    alpha: 0.95,
    rot: 0,
    spin: 0,
    phase: rand(0, Math.PI * 2),
    life: maxLife,
    maxLife,
    hue: "#fff3c4",
  };
}

/**
 * Canvas layer between the room photo and the plant: slow drifting pollen and
 * petals that shy away from the pointer, plus a petal burst on demand.
 * Renders nothing when the user prefers reduced motion.
 */
export function AmbientParticles({ burst, reducedMotion }: AmbientParticlesProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const pointerRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (reducedMotion) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    let width = 0;
    let height = 0;
    let frame = 0;
    let last = performance.now();

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();

    const burstParticles = particlesRef.current.filter((p) => p.life !== Infinity);
    particlesRef.current = [
      ...Array.from({ length: AMBIENT_COUNT }, () => makeAmbient(width, height, true)),
      ...burstParticles,
    ];

    const onPointerMove = (event: PointerEvent) => {
      pointerRef.current = { x: event.clientX, y: event.clientY };
    };
    const onPointerLeave = () => {
      pointerRef.current = null;
    };

    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      ctx.clearRect(0, 0, width, height);

      const pointer = pointerRef.current;
      const next: Particle[] = [];

      for (const p of particlesRef.current) {
        const isBurst = p.life !== Infinity;

        if (isBurst) {
          p.life -= dt;
          if (p.life <= 0) continue;
          p.vy += 90 * dt; // gravity
          p.vx *= 1 - 0.8 * dt; // air drag
          p.vy *= 1 - 0.5 * dt;
        } else {
          p.phase += dt;
          p.vx += Math.sin(p.phase * 0.8) * 6 * dt;
        }

        if (pointer) {
          const dx = p.x - pointer.x;
          const dy = p.y - pointer.y;
          const dist = Math.hypot(dx, dy);
          if (dist < POINTER_RADIUS && dist > 0.01) {
            const push = (1 - dist / POINTER_RADIUS) * 260 * dt;
            p.vx += (dx / dist) * push;
            p.vy += (dy / dist) * push;
          }
        }

        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.rot += p.spin * dt;

        if (!isBurst) {
          p.vx *= 1 - 0.4 * dt;
          if (p.y < -20 || p.x < -30 || p.x > width + 30) {
            next.push(makeAmbient(width, height, false));
            continue;
          }
        }

        const fade = isBurst ? Math.min(1, p.life / (p.maxLife * 0.4)) : 1;
        ctx.globalAlpha = p.alpha * fade;
        ctx.fillStyle = p.hue;

        if (p.kind === "petal") {
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rot);
          ctx.scale(1, 0.55 + 0.45 * Math.abs(Math.cos(p.phase + p.rot)));
          ctx.beginPath();
          ctx.ellipse(0, 0, p.size, p.size * 0.6, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        } else {
          const twinkle = 0.65 + 0.35 * Math.sin(p.phase * 2);
          ctx.globalAlpha = p.alpha * twinkle;
          const radius = p.size * 3;
          ctx.drawImage(getGlowSprite(), p.x - radius, p.y - radius, radius * 2, radius * 2);
        }
        next.push(p);
      }

      particlesRef.current = next;
      ctx.globalAlpha = 1;
      frame = requestAnimationFrame(tick);
    };

    const onVisibility = () => {
      cancelAnimationFrame(frame);
      if (!document.hidden) {
        last = performance.now();
        frame = requestAnimationFrame(tick);
      }
    };

    frame = requestAnimationFrame(tick);
    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("pointerup", onPointerLeave);
    document.documentElement.addEventListener("pointerleave", onPointerLeave);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerLeave);
      document.documentElement.removeEventListener("pointerleave", onPointerLeave);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [reducedMotion]);

  useEffect(() => {
    if (reducedMotion || burst.id === 0) return;
    const x = burst.x ?? window.innerWidth / 2;
    const y = burst.y ?? window.innerHeight * 0.45;
    const fresh =
      burst.kind === "sparkle"
        ? Array.from({ length: 16 }, () => makeSparkle(x, y))
        : Array.from({ length: 22 }, () => makeBurstPetal(x, y));
    particlesRef.current = [...particlesRef.current, ...fresh];
  }, [burst, reducedMotion]);

  if (reducedMotion) return null;

  return <canvas ref={canvasRef} className="ambient-particles" aria-hidden="true" />;
}
