interface VaseProps {
  /** y coordinate of the rim opening — the stem's base point. */
  rimY: number;
}

const CX = 200;

/**
 * An illustrated white ceramic vase matching the one in the background
 * photo, so the stem always aligns with a real opening regardless of how
 * the photo itself gets cropped on a given screen.
 */
export function Vase({ rimY }: VaseProps) {
  const rimHalfWidth = 42;
  const shoulderHalfWidth = 84;
  const shoulderY = rimY + 50;
  const waistY = rimY + 160;
  const footHalfWidth = 54;
  const footY = rimY + 270;

  const bodyPath = `
    M ${CX - rimHalfWidth},${rimY}
    C ${CX - shoulderHalfWidth * 0.86},${rimY + 22} ${CX - shoulderHalfWidth},${shoulderY - 14} ${CX - shoulderHalfWidth},${shoulderY + 6}
    C ${CX - shoulderHalfWidth},${waistY + 16} ${CX - (shoulderHalfWidth + footHalfWidth) / 2},${footY - 34} ${CX - footHalfWidth},${footY}
    Q ${CX},${footY + 10} ${CX + footHalfWidth},${footY}
    C ${CX + (shoulderHalfWidth + footHalfWidth) / 2},${footY - 34} ${CX + shoulderHalfWidth},${waistY + 16} ${CX + shoulderHalfWidth},${shoulderY + 6}
    C ${CX + shoulderHalfWidth},${shoulderY - 14} ${CX + shoulderHalfWidth * 0.86},${rimY + 22} ${CX + rimHalfWidth},${rimY}
    Z
  `;

  const speckles: { x: number; y: number; r: number }[] = [
    { x: -66, y: 40, r: 1.6 }, { x: -35, y: 68, r: 1.1 }, { x: 24, y: 26, r: 1.3 },
    { x: 62, y: 74, r: 1.5 }, { x: -80, y: 112, r: 1.2 }, { x: -12, y: 124, r: 1.6 },
    { x: 46, y: 118, r: 1.1 }, { x: 80, y: 136, r: 1.3 }, { x: -52, y: 160, r: 1.4 },
    { x: 6, y: 178, r: 1.2 }, { x: 58, y: 172, r: 1.5 }, { x: -24, y: 202, r: 1.1 },
    { x: 34, y: 208, r: 1.3 }, { x: -70, y: 74, r: 1.0 }, { x: 74, y: 38, r: 1.0 },
    { x: -8, y: 88, r: 1.2 }, { x: 20, y: 196, r: 1.1 }, { x: -44, y: 220, r: 1.0 },
  ];

  return (
    <g aria-hidden="true">
      <ellipse cx={CX + 4} cy={footY + 18} rx={footHalfWidth + 30} ry={13} fill="var(--vase-contact-shadow)" opacity={0.3} />

      <path d={bodyPath} fill="url(#vaseGradient)" stroke="var(--vase-shade)" strokeWidth={0.6} />

      <g opacity={0.35}>
        {speckles.map((s, i) => (
          <circle key={i} cx={CX + s.x} cy={rimY + s.y} r={s.r} fill="var(--vase-speckle)" />
        ))}
      </g>

      <path
        d={`M ${CX - shoulderHalfWidth * 0.55},${shoulderY + 20} Q ${CX - shoulderHalfWidth * 0.75},${waistY + 30} ${CX - shoulderHalfWidth * 0.5},${footY - 20}`}
        stroke="var(--vase-highlight)"
        strokeWidth={10}
        strokeLinecap="round"
        fill="none"
        opacity={0.25}
      />

      <ellipse cx={CX} cy={rimY} rx={rimHalfWidth} ry={9} fill="url(#vaseRimGradient)" />
      <ellipse cx={CX} cy={rimY - 1} rx={rimHalfWidth - 8} ry={6} fill="var(--vase-opening)" />
    </g>
  );
}
