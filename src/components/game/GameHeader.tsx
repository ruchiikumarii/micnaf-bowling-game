"use client";

import { motion, useReducedMotion } from "framer-motion";
import { RotateCcw } from "lucide-react";
import { BrandLogo } from "./BrandLogo";
import { SoundToggle } from "./SoundToggle";

interface GameHeaderProps {
  title: string;
  /** Which frame: shown as a HUD pill. */
  frame: 1 | 2 | null;
  /** Which throw of the frame, and how many it has. */
  throwOf?: { n: number; of: number } | null;
  soundOn: boolean;
  onSoundChange: (on: boolean) => void;
  onNewSession: () => void;
}

/** The game bar (HUD): logo, frame and throw pills, the stage title, sound and new game. */
export function GameHeader({ title, frame, throwOf = null, soundOn, onSoundChange, onNewSession }: GameHeaderProps) {
  const reduce = useReducedMotion();
  return (
    <header className="relative z-30 bg-gradient-to-b from-brand-navy to-[rgb(var(--stage-top-rgb))] text-white shadow-[0_6px_0_rgb(0_0_0/0.25)]">
      <div className="grid grid-cols-[auto_1fr_auto] items-center gap-x-3 gap-y-2 px-3 py-2 sm:px-6 lg:px-10 kiosk:px-[2.5rem] kiosk:py-[0.7rem]">
        <div className="flex items-center gap-2 sm:gap-3">
          <span className="rounded-xl bg-white px-2.5 py-1.5 shadow-[inset_0_-3px_0_rgb(0_0_0/0.12),0_3px_0_rgb(0_0_0/0.3)]">
            <BrandLogo priority className="h-7 sm:h-9 kiosk:h-[2.8rem]" />
          </span>
          {frame && (
            <span className="hud-pill hidden text-sm sm:inline-flex kiosk:text-[1.15rem]">
              <span className="text-brand-gold">Frame</span> {frame}/2
            </span>
          )}
          {throwOf && (
            <span className="hud-pill hidden text-sm md:inline-flex kiosk:text-[1.15rem]">
              <span className="text-brand-gold">Throw</span> {throwOf.n}/{throwOf.of}
            </span>
          )}
        </div>
        <div className="min-w-0 text-center">
          {/* A new title pops in (the old one goes at once, so it is never stale). */}
          <motion.h1
            key={title}
            className="game-title truncate px-2 text-xl [--title-fill:white] sm:text-2xl lg:text-3xl kiosk:text-[2.3rem]"
            aria-live="polite"
            initial={reduce ? false : { y: -14, opacity: 0, scale: 0.9 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 420, damping: 26 }}
          >
            {title}
          </motion.h1>
        </div>
        <div className="flex items-center justify-end gap-2 sm:gap-3">
          <SoundToggle on={soundOn} onChange={onSoundChange} />
          <button type="button" onClick={onNewSession} className="hud-btn" aria-label="New game">
            <RotateCcw className="h-5 w-5 kiosk:h-[1.5rem] kiosk:w-[1.5rem]" strokeWidth={3} aria-hidden />
          </button>
        </div>
      </div>
      <div className="tricolour-rule h-1" aria-hidden />
    </header>
  );
}
