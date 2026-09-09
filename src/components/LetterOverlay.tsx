import { useEffect, useRef } from "react";
import { motion } from "motion/react";

interface LetterOverlayProps {
  onClose: () => void;
  title: string;
  bodyText: string;
  signature: string;
  recipientName: string;
  reducedMotion: boolean;
}

const FOCUSABLE_SELECTOR =
  'button, [href], input, textarea, select, [tabindex]:not([tabindex="-1"])';

export function LetterOverlay({
  onClose,
  title,
  bodyText,
  signature,
  recipientName,
  reducedMotion,
}: LetterOverlayProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  useEffect(() => {
    previouslyFocused.current = document.activeElement as HTMLElement | null;
    const dialog = dialogRef.current;
    const focusable = dialog?.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
    focusable?.[0]?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
        return;
      }
      if (event.key === "Tab" && focusable && focusable.length > 0) {
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      previouslyFocused.current?.focus();
    };
  }, [onClose]);

  const transition = reducedMotion ? { duration: 0.15 } : { duration: 0.35, ease: "easeOut" as const };

  return (
    <motion.div
      className="letter-backdrop"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={transition}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <motion.div
        className="letter-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="letter-title"
        ref={dialogRef}
        initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 16, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 10, scale: 0.98 }}
        transition={transition}
      >
        <button type="button" className="letter-close" onClick={onClose} aria-label="Close letter">
          <svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true">
            <path d="M4,4 L16,16 M16,4 L4,16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
        <h2 id="letter-title">{title}</h2>
        <p className="letter-greeting">Dear {recipientName},</p>
        <p className="letter-body">{bodyText}</p>
        <p className="letter-signature">{signature}</p>
      </motion.div>
    </motion.div>
  );
}
