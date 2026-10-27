"use client";

import { Volume2, VolumeX } from "lucide-react";

interface SoundToggleProps {
  on: boolean;
  onChange: (on: boolean) => void;
}

/** Single switch for roll and pin sounds, as a round HUD button. Off by default. */
export function SoundToggle({ on, onChange }: SoundToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label="Sound"
      onClick={() => onChange(!on)}
      className={`hud-btn ${on ? "" : "!bg-white/85 !text-ink-soft"}`}
    >
      {on ? (
        <Volume2 className="h-5 w-5 kiosk:h-[1.5rem] kiosk:w-[1.5rem]" strokeWidth={3} aria-hidden />
      ) : (
        <VolumeX className="h-5 w-5 kiosk:h-[1.5rem] kiosk:w-[1.5rem]" strokeWidth={3} aria-hidden />
      )}
    </button>
  );
}
