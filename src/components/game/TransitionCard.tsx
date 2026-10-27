"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, RotateCcw } from "lucide-react";
import { useEffect, useRef } from "react";
import { NOVEL_COPY, SCORE_OUT_OF, TRANSITION_COPY } from "@/data/gameData";

interface TransitionCardProps {
  /** The configured Frame 1 score for the chosen therapy. */
  score: number | null;
  onContinue: () => void;
  className?: string;
}

export function TransitionCard({ score, onContinue, className = "" }: TransitionCardProps) {
  const reduce = useReducedMotion();
  const button = useRef<HTMLButtonElement>(null);

  useEffect(() => button.current?.focus(), []);

  return (
    <motion.section
      aria-labelledby="transition-heading"
      className={`game-panel ${className}`}
      initial={reduce ? false : { opacity: 0, y: 60, scale: 0.8 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 260, damping: 18 }}
    >
      <div className="px-6 py-5 kiosk:px-[2.25rem] kiosk:py-[clamp(1rem,2.4vh,1.5rem)]">
        {/* Heading and message beside the score. */}
        <div className="flex items-center gap-5 kiosk:gap-[1.75rem]">
          {score !== null && (
            <div
              className="flex h-24 w-24 shrink-0 flex-col items-center justify-center rounded-full bg-[rgb(var(--stage-top-rgb))] shadow-[inset_0_-4px_0_rgb(0_0_0/0.3)] ring-4 ring-brand-gold kiosk:h-[clamp(6rem,11vh,7.5rem)] kiosk:w-[clamp(6rem,11vh,7.5rem)]"
              aria-label={`Score ${score} out of ${SCORE_OUT_OF}`}
            >
              <span className="text-[0.65rem] font-bold uppercase tracking-[0.16em] text-brand-gold kiosk:text-[0.8rem]" aria-hidden>
                Score
              </span>
              <span className="font-display text-2xl font-black leading-none kiosk:text-[clamp(1.6rem,3vh,2.1rem)]" aria-hidden>
                {score}
                <span className="text-base text-white/60 kiosk:text-[1.1rem]">/{SCORE_OUT_OF}</span>
              </span>
            </div>
          )}
          <div className="min-w-0 text-left">
            <h2
              id="transition-heading"
              className="game-title text-3xl sm:text-4xl kiosk:text-[clamp(2.2rem,4.6vh,3.2rem)]"
            >
              {TRANSITION_COPY.heading}
            </h2>
            <p className="mt-2 text-base font-semibold leading-snug sm:text-lg kiosk:text-[clamp(1.1rem,2.1vh,1.35rem)]">{TRANSITION_COPY.body}</p>
          </div>
        </div>

        {/* What happens next: a fresh rack and the novel therapy. */}
        <div className="mt-4 flex items-center justify-center gap-3 border-t border-white/15 pt-4 kiosk:mt-[clamp(0.9rem,2vh,1.25rem)] kiosk:pt-[clamp(0.9rem,2vh,1.25rem)]">
          <RotateCcw className="h-5 w-5 shrink-0 text-brand-gold kiosk:h-[1.4rem] kiosk:w-[1.4rem]" strokeWidth={2.5} aria-hidden />
          <p className="text-sm leading-snug text-white/80 sm:text-base kiosk:text-[clamp(1rem,1.9vh,1.2rem)]">
            {TRANSITION_COPY.rack} <span className="font-semibold text-white">{TRANSITION_COPY.next}</span>
          </p>
        </div>

        {/* The one action, at the bottom. */}
        <div className="mt-4 flex justify-center kiosk:mt-[clamp(0.9rem,2vh,1.25rem)]">
          <button
            ref={button}
            type="button"
            onClick={onContinue}
            className="btn-primary btn-blink mb-2 w-full justify-center whitespace-nowrap px-8 py-3.5 text-lg tracking-[0.06em] sm:w-auto sm:text-xl kiosk:px-[2.5rem] kiosk:py-[clamp(0.85rem,1.9vh,1.15rem)] kiosk:text-[clamp(1.2rem,2.3vh,1.55rem)]"
          >
            {NOVEL_COPY.heading} <ArrowRight className="h-6 w-6" strokeWidth={3} aria-hidden />
          </button>
        </div>
      </div>
    </motion.section>
  );
}
