import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";

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
  const clickCountRef = useRef(0);
  const timeoutRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    };
  }, []);

  const handleClick = () => {
    onWater();
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
        className="water-button"
        onClick={handleClick}
        whileTap={reducedMotion ? undefined : { scale: 0.94 }}
      >
        <svg viewBox="0 0 40 32" width="22" height="18" aria-hidden="true">
          <rect x="2" y="12" width="20" height="16" rx="5" fill="currentColor" />
          <rect x="6" y="4" width="10" height="9" rx="3" fill="currentColor" />
          <path d="M20,16 C28,14 34,18 36,26" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" fill="none" />
        </svg>
        <span>Water me</span>
      </motion.button>
      <p className="water-feedback" role="status" aria-live="polite">
        {statusText || " "}
      </p>
    </div>
  );
}
