import { useState } from "react";
import { calendarDateStringToEpochDay, epochDayToNoonUtcDate } from "../lib/date";
import { gardenConfig } from "../config";

interface DevDatePanelProps {
  previewDate: Date | null;
  onSetPreview: (date: Date | null) => void;
}

interface Preset {
  label: string;
  getDate: () => Date;
}

function daysFromStart(fraction: number): Date {
  const startDay = calendarDateStringToEpochDay(gardenConfig.startDate);
  const bloomDay = calendarDateStringToEpochDay(gardenConfig.bloomDate);
  const span = bloomDay - startDay;
  return epochDayToNoonUtcDate(startDay + Math.round(span * fraction));
}

function daysFromBloom(offset: number): Date {
  const bloomDay = calendarDateStringToEpochDay(gardenConfig.bloomDate);
  return epochDayToNoonUtcDate(bloomDay + offset);
}

const PRESETS: Preset[] = [
  { label: "Before start", getDate: () => daysFromBloomBeforeStart() },
  { label: "Sprout (~5%)", getDate: () => daysFromStart(0.05) },
  { label: "Stem (~30%)", getDate: () => daysFromStart(0.3) },
  { label: "Mature (~60%)", getDate: () => daysFromStart(0.6) },
  { label: "Bud (~90%)", getDate: () => daysFromStart(0.9) },
  { label: "Day before bloom", getDate: () => daysFromBloom(-1) },
  { label: "Bloom day", getDate: () => daysFromBloom(0) },
  { label: "Post-bloom (+30d)", getDate: () => daysFromBloom(30) },
];

function daysFromBloomBeforeStart(): Date {
  const startDay = calendarDateStringToEpochDay(gardenConfig.startDate);
  return epochDayToNoonUtcDate(startDay - 10);
}

export function DevDatePanel({ previewDate, onSetPreview }: DevDatePanelProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="dev-panel" data-open={isOpen}>
      <button
        type="button"
        className="dev-panel-toggle"
        onClick={() => setIsOpen((prev) => !prev)}
      >
        {isOpen ? "Close dev panel" : "Dev: date preview"}
      </button>

      {isOpen && (
        <div className="dev-panel-body">
          <p className="dev-panel-note">
            Preview only — does not change saved watering data.
          </p>
          <div className="dev-panel-grid">
            {PRESETS.map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => onSetPreview(preset.getDate())}
              >
                {preset.label}
              </button>
            ))}
          </div>
          <button
            type="button"
            className="dev-panel-live"
            disabled={previewDate === null}
            onClick={() => onSetPreview(null)}
          >
            Back to live date
          </button>
          {previewDate && (
            <p className="dev-panel-current">
              Previewing: {previewDate.toISOString().slice(0, 10)} (UTC noon)
            </p>
          )}
        </div>
      )}
    </div>
  );
}
