interface PotProps {
  /** y coordinate of the soil surface (top of the pot). */
  soilY: number;
}

/** A terracotta pot with a soft rim highlight and a textured soil surface. */
export function Pot({ soilY }: PotProps) {
  const potTop = soilY + 6;
  const potBottom = potTop + 118;
  const rimHalfWidth = 108;
  const baseHalfWidth = 84;
  const cx = 200;

  return (
    <g aria-hidden="true">
      <ellipse
        cx={cx}
        cy={potBottom + 6}
        rx={rimHalfWidth * 0.82}
        ry={14}
        fill="var(--shadow-color)"
        opacity={0.28}
      />

      <path
        d={`M ${cx - rimHalfWidth} ${potTop}
            L ${cx - baseHalfWidth} ${potBottom}
            Q ${cx} ${potBottom + 16} ${cx + baseHalfWidth} ${potBottom}
            L ${cx + rimHalfWidth} ${potTop}
            Q ${cx} ${potTop + 22} ${cx - rimHalfWidth} ${potTop} Z`}
        fill="url(#potGradient)"
      />

      <path
        d={`M ${cx - baseHalfWidth + 10} ${potBottom - 14}
            Q ${cx} ${potBottom - 4} ${cx + baseHalfWidth - 10} ${potBottom - 14}`}
        stroke="var(--pot-shade)"
        strokeWidth={3}
        strokeLinecap="round"
        fill="none"
        opacity={0.5}
      />

      <ellipse cx={cx} cy={potTop} rx={rimHalfWidth} ry={20} fill="url(#rimGradient)" />
      <ellipse
        cx={cx}
        cy={potTop - 2}
        rx={rimHalfWidth - 10}
        ry={14}
        fill="var(--soil-dark)"
      />
      <ellipse cx={cx} cy={potTop - 3} rx={rimHalfWidth - 14} ry={11} fill="url(#soilGradient)" />

      <g opacity={0.55}>
        <path
          d={`M ${cx - 62} ${potTop - 4} q 10 -5 22 -1`}
          stroke="var(--soil-fleck)"
          strokeWidth={2.2}
          strokeLinecap="round"
          fill="none"
        />
        <path
          d={`M ${cx - 10} ${potTop - 8} q 12 -3 24 2`}
          stroke="var(--soil-fleck)"
          strokeWidth={2}
          strokeLinecap="round"
          fill="none"
        />
        <path
          d={`M ${cx + 22} ${potTop - 3} q 10 -4 20 0`}
          stroke="var(--soil-fleck)"
          strokeWidth={2}
          strokeLinecap="round"
          fill="none"
        />
        <circle cx={cx - 40} cy={potTop - 6} r={1.6} fill="var(--soil-fleck)" />
        <circle cx={cx + 46} cy={potTop - 7} r={1.4} fill="var(--soil-fleck)" />
        <circle cx={cx + 6} cy={potTop - 2} r={1.4} fill="var(--soil-fleck)" />
      </g>
    </g>
  );
}
