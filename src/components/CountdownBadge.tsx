interface CountdownBadgeProps {
  daysUntilBloom: number;
  isBloomed: boolean;
}

export function CountdownBadge({ daysUntilBloom, isBloomed }: CountdownBadgeProps) {
  if (isBloomed) {
    return <p className="countdown-badge countdown-badge--bloomed">For you, in full bloom.</p>;
  }

  const days = Math.max(0, daysUntilBloom);
  const label = days === 1 ? "1 day until bloom" : `${days} days until bloom`;

  return <p className="countdown-badge">{label}</p>;
}
