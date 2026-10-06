import { useEffect, useState } from "react";
import { AnimatePresence } from "motion/react";
import { gardenConfig } from "./config";
import { useGrowth } from "./hooks/useGrowth";
import { usePrefersReducedMotion } from "./hooks/usePrefersReducedMotion";
import { useWatering } from "./hooks/useWatering";
import { Background } from "./components/Background";
import { AmbientParticles, type BurstRequest } from "./components/AmbientParticles";
import { Plant } from "./components/plant/Plant";
import { WaterButton } from "./components/WaterButton";
import { WateringOverlay } from "./components/WateringOverlay";
import { CountdownBadge } from "./components/CountdownBadge";
import { LetterOverlay } from "./components/LetterOverlay";
import { DevDatePanel } from "./components/DevDatePanel";
import { readString, writeString, STORAGE_KEYS } from "./lib/storage";
import "./App.css";

export default function App() {
  const [previewDate, setPreviewDate] = useState<Date | null>(null);
  const isPreview = previewDate !== null;

  const growthState = useGrowth(previewDate);
  const reducedMotion = usePrefersReducedMotion();
  const watering = useWatering(growthState.todayStr);

  const [waterPulse, setWaterPulse] = useState(0);
  const [tapPulse, setTapPulse] = useState(0);
  const [burst, setBurst] = useState<BurstRequest>({ id: 0 });
  const [showLetter, setShowLetter] = useState(false);
  const [bloomAnimationPlayed, setBloomAnimationPlayed] = useState<boolean>(
    () => readString(STORAGE_KEYS.bloomAnimationPlayed) === "1",
  );

  const isBloomDay = growthState.todayStr === gardenConfig.bloomDate;
  const playOpeningAnimation = isBloomDay && !bloomAnimationPlayed && !isPreview;

  useEffect(() => {
    if (playOpeningAnimation) {
      writeString(STORAGE_KEYS.bloomAnimationPlayed, "1");
      setBloomAnimationPlayed(true);
    }
  }, [playOpeningAnimation]);

  const handleWater = () => {
    setWaterPulse((count) => count + 1);
    const stage = document.querySelector(".garden-stage")?.getBoundingClientRect();
    if (stage) {
      // Vase opening in the plant SVG's 400x630 viewBox (matches WateringOverlay's SOIL); sparkles rise as the first drops land.
      const x = stage.left + (200 / 400) * stage.width;
      const y = stage.top + (354 / 630) * stage.height;
      window.setTimeout(() => setBurst((prev) => ({ id: prev.id + 1, x, y, kind: "sparkle" })), 1100);
    }
    if (!isPreview) {
      watering.recordWatering();
    }
  };

  const handleTapPlant = (origin?: { x: number; y: number }) => {
    setTapPulse((count) => count + 1);
    setBurst((prev) => ({ id: prev.id + 1, x: origin?.x, y: origin?.y }));
  };

  return (
    <div className="app-root">
      <Background />
      <AmbientParticles burst={burst} reducedMotion={reducedMotion} />

      <main className="garden-content">
        <header className="garden-header">
          <div className="garden-title-card">
            <h1>{gardenConfig.heading}</h1>
            <p className="garden-caption">{gardenConfig.caption}</p>
          </div>

          {growthState.isBloomed ? (
            <button type="button" className="open-letter-button" onClick={() => setShowLetter(true)}>
              Open your letter
            </button>
          ) : (
            <CountdownBadge daysUntilBloom={growthState.daysUntilBloom} growth={growthState.growth} />
          )}
        </header>

        <div className="garden-stage">
          {growthState.isBloomed && <div className="bloom-glow" aria-hidden="true" />}
          <Plant
            growth={growthState.growth}
            isBloomed={growthState.isBloomed}
            playOpeningAnimation={playOpeningAnimation}
            reducedMotion={reducedMotion}
            waterPulse={waterPulse}
            tapPulse={tapPulse}
            onTap={handleTapPlant}
          />
          <WateringOverlay pulse={waterPulse} reducedMotion={reducedMotion} />
        </div>

        <div className="garden-footer">
          <WaterButton
            wateredToday={!isPreview && watering.wateredToday}
            reducedMotion={reducedMotion}
            onWater={handleWater}
          />
        </div>
      </main>

      <AnimatePresence>
        {showLetter && (
          <LetterOverlay
            onClose={() => setShowLetter(false)}
            title={gardenConfig.letterTitle}
            bodyText={gardenConfig.letterText}
            signature={gardenConfig.letterSignature}
            recipientName={gardenConfig.recipientName}
            reducedMotion={reducedMotion}
          />
        )}
      </AnimatePresence>

      {import.meta.env.DEV && <DevDatePanel previewDate={previewDate} onSetPreview={setPreviewDate} />}
    </div>
  );
}
