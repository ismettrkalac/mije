interface CountdownBadgeProps {
  daysUntilBloom: number;
  /** 0–1 progress from start date to bloom date. */
  growth: number;
}

export function CountdownBadge({ daysUntilBloom, growth }: CountdownBadgeProps) {
  const days = Math.max(0, daysUntilBloom);
  const label = days === 1 ? "1 day until bloom" : `${days} days until bloom`;
  const percent = Math.round(Math.min(1, Math.max(0, growth)) * 100);

  return (
    <div className="countdown-badge">
      <p className="countdown-label">{label}</p>
      <div
        className="countdown-track"
        role="progressbar"
        aria-label="Progress until bloom"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
      >
        <div className="countdown-fill" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}
