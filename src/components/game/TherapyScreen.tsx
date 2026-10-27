"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { PINS, THERAPY_INTRO } from "@/data/gameData";
import { richToPlain } from "@/lib/gameLogic";

interface TherapyScreenProps {
  /** The doctor's name (shown as text). */
  name: string;
  /** Closes the pop-up: the doctor then chooses a ball on the lane. */
  onStart: () => void;
}

export function TherapyScreen({ name, onStart }: TherapyScreenProps) {
  const reduce = useReducedMotion();

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8"
      initial={reduce ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: reduce ? 0 : 0.2 }}
    >
      <div className="absolute inset-0 bg-ink/70 backdrop-blur-[2px]" aria-hidden />
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby="therapy-greeting"
        className="game-panel max-h-[calc(100dvh-3rem)] w-full max-w-3xl overflow-y-auto text-left kiosk:max-w-[56rem]"
        initial={reduce ? false : { scale: 0.6, opacity: 0, y: 40 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 300, damping: 18 }}
      >
        <div className="px-6 py-7 sm:px-12 sm:py-10 short:py-4 kiosk:px-[3.5rem] kiosk:py-[clamp(1.25rem,3.2vh,2.5rem)]">
        <h2 id="therapy-greeting" className="game-title text-4xl normal-case [--title-fill:white] sm:text-5xl kiosk:text-[3.2rem]">
          Hi Dr. {name},
        </h2>
        <div className="mt-4 space-y-3 text-lg leading-snug text-white/80 sm:text-xl kiosk:mt-[1.25rem] kiosk:text-[1.4rem]">
          <p>{THERAPY_INTRO[0]}</p>
          <p className="font-semibold text-brand-gold">{THERAPY_INTRO[1]}</p>
        </div>

        <div className="game-sheet mt-5 px-4 pb-4 pt-4 kiosk:px-[1.25rem] kiosk:mt-[clamp(1rem,2.4vh,1.5rem)] kiosk:pt-[clamp(0.8rem,2vh,1.25rem)]">
          <h3 className="eyebrow font-body kiosk:text-base">The barriers (pins)</h3>
          <ol className="mt-2 grid gap-1.5 sm:grid-cols-2 sm:gap-x-3 kiosk:mt-[0.7rem] kiosk:gap-y-[0.45rem]">
            {PINS.map((p) => (
              <li
                key={p.number}
                className="flex items-center gap-2.5 rounded-xl bg-surface-sunken px-3 py-1.5 leading-snug kiosk:px-[0.9rem] kiosk:py-[clamp(0.3rem,0.8vh,0.55rem)]"
              >
                <span className="pin-chip-num shrink-0 kiosk:h-[1.7rem] kiosk:min-w-[1.7rem] kiosk:text-[0.9rem]" aria-hidden>
                  {p.number}
                </span>
                <span className="text-sm font-medium text-ink sm:text-[0.95rem] kiosk:text-[1.05rem]">{richToPlain(p.name)}</span>
              </li>
            ))}
          </ol>
        </div>


        {/* Stays in view when a small screen makes the pop-up scroll. */}
        <div className="mt-7 flex justify-center pb-2 pt-2 kiosk:mt-[clamp(1rem,2.6vh,1.75rem)]">
          <button
            type="button"
            onClick={onStart}
            className="btn-primary px-10 py-3.5 text-xl tracking-[0.06em] sm:text-2xl kiosk:px-[3rem] kiosk:py-[1.1rem] kiosk:text-[1.7rem]"
          >
            Choose your therapy <ArrowRight className="h-7 w-7" strokeWidth={3} aria-hidden />
          </button>
        </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
