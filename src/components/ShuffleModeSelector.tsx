import { KeyboardEvent } from "react";

import { SHUFFLE_MODE_LABELS, ShuffleMode } from "../shuffle";

const MODES = Object.keys(SHUFFLE_MODE_LABELS) as ShuffleMode[];

export function ShuffleModeSelector({
  value,
  onChange,
  disabled = false,
}: {
  value: ShuffleMode;
  onChange: (mode: ShuffleMode) => void;
  disabled?: boolean;
}) {
  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (disabled) {
      return;
    }

    const currentIndex = MODES.indexOf(value);
    const nextIndex =
      event.key === "ArrowRight"
        ? (currentIndex + 1) % MODES.length
        : event.key === "ArrowLeft"
          ? (currentIndex - 1 + MODES.length) % MODES.length
          : -1;

    if (nextIndex >= 0) {
      event.preventDefault();
      onChange(MODES[nextIndex] as ShuffleMode);
    }
  }

  return (
    <div
      aria-label="Shuffle mode"
      className="grid gap-2 rounded-3xl bg-slate-900/80 p-2 shadow-inner shadow-black/30 sm:grid-cols-3"
      onKeyDown={onKeyDown}
      role="radiogroup"
      tabIndex={disabled ? -1 : 0}
    >
      {MODES.map((mode) => {
        const selected = mode === value;

        return (
          <button
            aria-checked={selected}
            className={`min-h-11 rounded-2xl px-4 py-3 text-sm font-semibold transition ${
              selected
                ? "bg-emerald-400 text-slate-950"
                : "text-slate-300 hover:bg-slate-800 hover:text-white"
            }`}
            disabled={disabled}
            key={mode}
            onClick={() => onChange(mode)}
            role="radio"
            type="button"
          >
            {SHUFFLE_MODE_LABELS[mode]}
          </button>
        );
      })}
    </div>
  );
}
