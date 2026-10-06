interface WateringCanIconProps {
  size?: number;
  /** Shows falling droplets from the spout. */
  pouring?: boolean;
}

/** Small two-tone watering can used on the button; `currentColor` tints the body. */
export function WateringCanIcon({ size = 26, pouring = false }: WateringCanIconProps) {
  return (
    <svg viewBox="0 0 48 40" width={size} height={size * (40 / 48)} aria-hidden="true" focusable="false" overflow="visible">
      {/* handle */}
      <path d="M8,14 C-1,12 -1,26 9,28" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" fill="none" opacity="0.8" />
      {/* spout */}
      <path d="M26,24 L40,10" stroke="currentColor" strokeWidth="4" strokeLinecap="round" fill="none" />
      {/* rose */}
      <path d="M38,5 L46,9 L42,16 Z" fill="currentColor" />
      {/* body */}
      <rect x="6" y="14" width="24" height="20" rx="6" fill="currentColor" />
      <rect x="6" y="14" width="24" height="7" rx="3.5" fill="#fff" opacity="0.22" />
      <path d="M11,19 C11,17.6 12,17 13,17" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" fill="none" opacity="0.55" />
      {pouring && (
        <g fill="#bfe8f7">
          <circle className="can-drop can-drop--1" cx="44" cy="19" r="1.6" />
          <circle className="can-drop can-drop--2" cx="47" cy="21" r="1.3" />
          <circle className="can-drop can-drop--3" cx="41" cy="21" r="1.4" />
        </g>
      )}
    </svg>
  );
}
