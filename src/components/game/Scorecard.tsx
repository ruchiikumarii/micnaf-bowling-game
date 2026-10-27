"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useEffect, useRef } from "react";
import { DRUGS, SCORE_OUT_OF, SCORECARD_COPY, WHY_MIQNAF } from "@/data/gameData";
import type { DrugId } from "@/types/game";
import { BrandLogo } from "./BrandLogo";

interface ScorecardProps {
  open: boolean;
  /** The doctor's name (shown as text). */
  name: string;
  /** The conventional combination thrown in Frame 1. */
  therapy: DrugId | null;
  /** Configured scores (never calculated here). */
  frame1Score: number | null;
  frame2Score: number;
  onContinue: () => void;
}

/** The final scorecard: Frame 1 (conventional) and Frame 2 (MIQNAF®), with their configured scores. */
export function Scorecard({ open, name, therapy, frame1Score, frame2Score, onContinue }: ScorecardProps) {
  const reduce = useReducedMotion();
  const button = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (open) button.current?.focus();
  }, [open]);

  const cell = "border-t border-line px-3 py-3 align-middle sm:px-5 kiosk:py-[clamp(0.7rem,1.8vh,1.1rem)]";
  const head = "px-3 pb-2 text-left text-xs font-bold uppercase tracking-[0.12em] text-ink-soft sm:px-5 sm:text-sm kiosk:text-base";
  const score = "font-display text-2xl font-black text-brand-navy sm:text-3xl kiosk:text-[clamp(1.7rem,3.2vh,2.4rem)]";

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduce ? 0 : 0.2 }}
        >
          <div className="absolute inset-0 bg-ink/70 backdrop-blur-[2px]" aria-hidden />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="scorecard-heading"
            className="game-panel max-h-[calc(100dvh-3rem)] w-full max-w-3xl overflow-y-auto text-center kiosk:max-w-[56rem]"
            initial={reduce ? false : { scale: 0.6, opacity: 0, y: 40 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 260, damping: 22 }}
          >
            <div className="flex flex-col items-center px-4 py-6 sm:px-10 sm:py-8 short:py-3 kiosk:px-[3rem] kiosk:py-[clamp(1.5rem,3.5vh,2.5rem)]">
              <span className="mb-4 rounded-xl bg-white px-3 py-1.5 shadow-[inset_0_-3px_0_rgb(0_0_0/0.12),0_3px_0_rgb(0_0_0/0.3)] short:mb-1.5 kiosk:mb-[clamp(0.8rem,2vh,1.25rem)]">
                <BrandLogo logo="productLogo" className="h-10 sm:h-12 short:h-7 kiosk:h-[clamp(2.8rem,5.4vh,3.8rem)]" />
              </span>
              <p className="eyebrow font-body text-brand-gold kiosk:text-base">Dr. {name}</p>
              <h2
                id="scorecard-heading"
                className="game-title mt-2 text-[2rem] [--title-fill:white] sm:text-5xl short:text-2xl kiosk:text-[clamp(2.4rem,5vh,3.4rem)]"
              >
                {SCORECARD_COPY.heading}
              </h2>

              <div className="game-sheet mt-5 w-full px-2 pb-1 pt-3 kiosk:mt-[clamp(1rem,2.4vh,1.75rem)]">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr>
                    <th className={head}>Therapy</th>
                    <th className={`${head} text-right`}>Score</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className={cell}>
                      <span className="block font-display text-lg font-bold text-brand-navy sm:text-xl kiosk:text-[1.4rem]">{SCORECARD_COPY.frame1Therapy}</span>
                      {therapy && <span className="block text-sm text-ink-muted kiosk:text-base">{DRUGS[therapy].name}</span>}
                    </td>
                    <td className={`${cell} text-right`}>
                      <span className={score}>{frame1Score === null ? "–" : `${frame1Score}/${SCORE_OUT_OF}`}</span>
                    </td>
                  </tr>
                  <tr>
                    <td className={cell}>
                      <span className="block font-display text-lg font-bold text-brand-navy sm:text-xl kiosk:text-[1.4rem]">{SCORECARD_COPY.frame2Therapy}</span>
                    </td>
                    <td className={`${cell} text-right`}>
                      <span className={score}>
                        {frame2Score}/{SCORE_OUT_OF}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
              </div>

              {/* Supplied content only; hidden if it is not configured. */}
              {WHY_MIQNAF && (
                <section aria-labelledby="why-miqnaf" className="mt-5 w-full short:mt-2 kiosk:mt-[clamp(1rem,2.4vh,1.6rem)]">
                  <h3 id="why-miqnaf" className="font-display text-lg font-black text-brand-gold sm:text-xl kiosk:text-[clamp(1.2rem,2.4vh,1.6rem)]">
                    {WHY_MIQNAF.heading}
                  </h3>
                  <ul className="mt-3 grid gap-3 sm:grid-cols-3 short:mt-1.5 short:gap-2 kiosk:mt-[clamp(0.7rem,1.6vh,1rem)] kiosk:gap-[1rem]">
                    {WHY_MIQNAF.points.map((p) => (
                      <li
                        key={p.title}
                        className="flex flex-col items-center justify-center rounded-2xl bg-[rgb(var(--stage-top-rgb))] px-4 py-4 text-white shadow-[inset_0_0_0_2px_rgb(var(--brand-gold-rgb)),0_4px_0_rgb(0_0_0/0.3)] short:py-2 kiosk:px-[1rem] kiosk:py-[clamp(0.8rem,2vh,1.25rem)]"
                      >
                        <span className="text-xs font-bold uppercase tracking-[0.16em] text-brand-gold kiosk:text-[0.95rem]">{p.title}</span>
                        {p.text.map((line) => (
                          <span key={line} className="mt-1 text-base font-semibold leading-snug kiosk:text-[clamp(1rem,1.9vh,1.2rem)]">
                            {line}
                          </span>
                        ))}
                      </li>
                    ))}
                  </ul>
                </section>
              )}


              <div className="mt-7 flex w-full justify-center pb-2 short:mt-2 kiosk:mt-[clamp(1rem,2.4vh,1.75rem)]">
                <button
                  ref={button}
                  type="button"
                  onClick={onContinue}
                  className="btn-primary btn-blink px-8 py-3.5 text-lg tracking-[0.06em] sm:px-10 sm:text-2xl short:py-2 short:text-lg kiosk:px-[3rem] kiosk:py-[clamp(0.9rem,2vh,1.3rem)] kiosk:text-[clamp(1.4rem,2.6vh,1.9rem)]"
                >
                  {SCORECARD_COPY.button} <ArrowRight className="h-7 w-7" strokeWidth={3} aria-hidden />
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
