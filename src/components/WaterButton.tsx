import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { WateringCanIcon } from "./WateringCanIcon";

interface WaterButtonProps {
  wateredToday: boolean;
  reducedMotion: boolean;
  onWater: () => void;
}

const MESSAGES = [
  "Ahh, refreshing!",
  "A little sip, a little happiness.",
  "Droplets of love, right where they're needed.",
  "The soil says thank you.",
];

export function WaterButton({ wateredToday, reducedMotion, onWater }: WaterButtonProps) {
  const [messageIndex, setMessageIndex] = useState<number | null>(null);
  const [rippleKey, setRippleKey] = useState(0);
  const [pouring, setPouring] = useState(false);
  const pourTimeoutRef = useRef<number | undefined>(undefined);
  const clickCountRef = useRef(0);
  const timeoutRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
      if (pourTimeoutRef.current) window.clearTimeout(pourTimeoutRef.current);
    };
  }, []);

  const handleClick = () => {
    onWater();
    setRippleKey((key) => key + 1);
    setPouring(true);
    if (pourTimeoutRef.current) window.clearTimeout(pourTimeoutRef.current);
    pourTimeoutRef.current = window.setTimeout(() => setPouring(false), 1400);
    const nextIndex = clickCountRef.current % MESSAGES.length;
    clickCountRef.current += 1;
    setMessageIndex(nextIndex);

    if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    timeoutRef.current = window.setTimeout(() => setMessageIndex(null), 3200);
  };

  const statusText = messageIndex !== null ? MESSAGES[messageIndex] : wateredToday ? "Watered with love today." : "";

  return (
    <div className="water-control">
      <motion.button
        type="button"
        className={`water-button${wateredToday ? " water-button--done" : ""}`}
        onClick={handleClick}
        whileHover={reducedMotion ? undefined : { y: -2 }}
        whileTap={reducedMotion ? undefined : { scale: 0.94 }}
      >
        {rippleKey > 0 && !reducedMotion && <span key={`ripple-${rippleKey}`} className="water-ripple" aria-hidden="true" />}
        <motion.span
          className="water-icon"
          key={`icon-${rippleKey}`}
          initial={{ rotate: 0 }}
          animate={reducedMotion || rippleKey === 0 ? { rotate: 0 } : { rotate: [0, -24, -24, 0] }}
          transition={{ duration: 1.1, times: [0, 0.25, 0.75, 1], ease: "easeInOut" }}
        >
          <WateringCanIcon pouring={pouring && !reducedMotion} />
        </motion.span>
        <span>{wateredToday ? "Water again" : "Water me"}</span>
        {wateredToday && (
          <svg className="water-check" viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
            <circle cx="8" cy="8" r="8" fill="#fff" opacity="0.9" />
            <path d="M4.5 8.4 7 10.8 11.5 5.6" stroke="#5a8a4f" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          </svg>
        )}
      </motion.button>
      <p className="water-feedback" role="status" aria-live="polite">
        {statusText || " "}
      </p>
    </div>
  );
}
