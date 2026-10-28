"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useEffect, useId, useRef, type CSSProperties } from "react";
import { DRUGS, PINS } from "@/data/gameData";
import { BALL_COLORS } from "@/lib/drugVisuals";
import { richToPlain } from "@/lib/gameLogic";
import type { PinNumber, RollResult } from "@/types/game";
import { BrandLogo } from "./BrandLogo";
import { Confetti } from "./Confetti";
import { RackDiagram } from "./RackDiagram";
import { ScoreRing } from "./ScoreRing";

export interface ThrowResultCopy {
  heading: string;
  /** Lines under the heading. */
  lines: readonly string[];
  /** The question to the doctor, set apart as the focus of the pop-up. */
  highlight?: string;
  button: string;
}

interface ThrowResultPopupProps {
  /** The throw to show; null hides the pop-up. */
  result: RollResult | null;
  /** Configured score for this throw (never calculated here). */
  score: number | null;
  copy: ThrowResultCopy;
  /** "strike": all pins down, heading in navy; "attempt": pins left, heading in red. */
  tone: "attempt" | "strike";
  onAction: () => void;
}

export function ThrowResultPopup({ result, score, copy, tone, onAction }: ThrowResultPopupProps) {
  const reduce = useReducedMotion();
  const button = useRef<HTMLButtonElement>(null);
  const headingId = useId();

  useEffect(() => {
    if (result) button.current?.focus();
  }, [result]);

  const strike = tone === "strike";
  // Shaking pins stayed up, so they are listed with the rest.
  const standing = result ? PINS.filter((p) => ["up", "wobble"].includes(result.lane[p.number as PinNumber])) : [];

  return (
    <AnimatePresence>
      {result && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduce ? 0 : 0.2 }}
        >
          <div className="absolute inset-0 bg-ink/70 backdrop-blur-[2px]" aria-hidden />
          {/* A strike: light rays and confetti behind the pop-up (no motion with reduced motion). */}
          {strike && <div className="menu-rays pointer-events-none absolute inset-0 overflow-hidden !bg-none opacity-80" aria-hidden />}
          {strike && <Confetti />}
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby={headingId}
            className="game-panel relative mt-8 max-h-[calc(100dvh-4rem)] w-full max-w-2xl overflow-y-auto text-center kiosk:max-w-[52rem]"
            initial={reduce ? false : { scale: 0.6, opacity: 0, y: 40 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 300, damping: 18 }}
          >
            <div className="flex flex-col items-center px-6 py-7 sm:px-12 sm:py-9 short:py-3 kiosk:px-[3.25rem] kiosk:py-[clamp(1.5rem,3.4vh,2.5rem)]">
              <span className="mb-3 rounded-xl bg-white px-3 py-1.5 shadow-[inset_0_-3px_0_rgb(0_0_0/0.12),0_3px_0_rgb(0_0_0/0.3)] short:mb-1.5">
                <BrandLogo logo="productLogo" className="h-7 short:h-5 sm:h-8 kiosk:h-[clamp(1.9rem,3.6vh,2.5rem)]" />
              </span>
              {strike && (
                <div className="mb-1 flex items-end gap-2 short:hidden" aria-hidden>
                  {[0, 1, 2].map((i) => (
                    <motion.svg
                      key={i}
                      viewBox="0 0 24 24"
                      className={i === 1 ? "h-16 w-16 kiosk:h-[clamp(4rem,8vh,5.5rem)] kiosk:w-[clamp(4rem,8vh,5.5rem)]" : "h-11 w-11 kiosk:h-[clamp(2.8rem,5.6vh,3.8rem)] kiosk:w-[clamp(2.8rem,5.6vh,3.8rem)]"}
                      initial={reduce ? false : { scale: 0, rotate: -90 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 420, damping: 12, delay: 0.25 + i * 0.15 }}
                    >
                      <path
                        d="M12 1.8l3.1 6.6 7.1.8-5.3 4.9 1.5 7.1L12 17.6l-6.4 3.6 1.5-7.1-5.3-4.9 7.1-.8z"
                        fill="rgb(var(--brand-gold-rgb))"
                        stroke="rgb(var(--stage-top-rgb))"
                        strokeWidth="1.6"
                        strokeLinejoin="round"
                      />
                    </motion.svg>
                  ))}
                </div>
              )}
              {/* 1. The result */}
              <motion.h2
                id={headingId}
                className={`game-title short:text-[1.8rem] ${
                  strike
                    ? "text-[3.2rem] sm:text-7xl kiosk:text-[clamp(3.6rem,9vh,6rem)]"
                    : "text-[2.3rem] [--title-fill:white] [--title-stroke:rgb(var(--brand-red-rgb))] sm:text-5xl kiosk:text-[clamp(2.6rem,6vh,4rem)]"
                }`}
                initial={reduce ? false : { scale: 2.2, opacity: 0, rotate: -6 }}
                animate={{ scale: 1, opacity: 1, rotate: strike ? -3 : 0 }}
                transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 380, damping: 14, delay: 0.1 }}
              >
                {copy.heading}
              </motion.h2>
              {/* The ball that was thrown, then the rack it left and the score. */}
              <p className="mt-3 inline-flex items-center gap-2 rounded-full bg-[rgb(var(--stage-top-rgb)/0.7)] py-1 pl-1 pr-4 ring-1 ring-white/15 short:mt-1.5">
                <span className="ball-swatch h-6 w-6 kiosk:h-[1.8rem] kiosk:w-[1.8rem]" style={{ "--ball": BALL_COLORS[result.drug] } as CSSProperties} aria-hidden />
                <span className="text-sm font-bold uppercase tracking-[0.12em] text-white/85 kiosk:text-base">{DRUGS[result.drug].name}</span>
              </p>
              <div className="mt-4 flex items-center justify-center gap-5 short:mt-1.5 short:gap-3 sm:gap-8 kiosk:mt-[clamp(0.8rem,2vh,1.25rem)] kiosk:gap-[2.5rem]">
                {!strike && (
                  <div className="flex flex-col items-center gap-1.5">
                    <RackDiagram lane={result.lane} className="h-24 w-28 short:h-16 short:w-[4.5rem] sm:h-28 sm:w-32 kiosk:h-[clamp(6.5rem,14vh,9rem)] kiosk:w-[clamp(7.2rem,15.5vh,10rem)]" />
                    <span className="text-[0.7rem] font-bold uppercase tracking-[0.16em] text-white/60 kiosk:text-sm" aria-hidden>
                      Pins left · {standing.length}
                    </span>
                  </div>
                )}
                {score !== null && <ScoreRing score={score} className="h-28 w-28 short:h-20 short:w-20 kiosk:h-[clamp(7rem,15vh,9.5rem)] kiosk:w-[clamp(7rem,15vh,9.5rem)]" />}
              </div>
              {strike &&
                copy.lines.map((line) => (
                  <p key={line} className="mt-2 text-lg font-bold text-white sm:text-xl kiosk:text-[clamp(1.2rem,2.4vh,1.6rem)]">
                    {line}
                  </p>
                ))}

              {/* 2. The pins */}
              {!strike && standing.length > 0 && (
                <div className="game-sheet mt-5 w-full px-4 py-4 short:mt-2 short:py-2 kiosk:mt-[clamp(1rem,2.4vh,1.5rem)] kiosk:px-[1.4rem] kiosk:py-[clamp(0.9rem,2vh,1.25rem)]">
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-ink-soft kiosk:text-sm">
                    Still standing · {standing.length} of {result.totalPins}
                  </p>
                  <ul aria-label="Still standing" className="mt-3 flex flex-wrap justify-center gap-2 short:mt-1.5 kiosk:mt-[0.8rem] kiosk:gap-[0.55rem]">
                    {standing.map((p, i) => (
                      <motion.li
                        key={p.number}
                        initial={reduce ? false : { scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 500, damping: 20, delay: 0.35 + i * 0.06 }}
                        className="inline-flex items-center gap-2 rounded-full bg-surface-sunken py-1 pl-1 pr-3 text-sm font-semibold text-brand-navy shadow-[inset_0_-2px_0_rgb(0_0_0/0.08)] kiosk:text-[1rem]"
                      >
                        <span className="pin-chip-num shrink-0">{p.number}</span>
                        {richToPlain(p.name)}
                      </motion.li>
                    ))}
                  </ul>
                </div>
              )}

              {/* 3. The message and the question */}
              {!strike && (
                <div className="mt-5 short:mt-2 kiosk:mt-[clamp(1rem,2.4vh,1.5rem)]">
                  {copy.lines.map((line) => (
                    <p key={line} className="text-base text-white/80 sm:text-lg kiosk:text-[clamp(1.05rem,2vh,1.25rem)]">
                      {line}
                    </p>
                  ))}
                  {copy.highlight && (
                    <p className="mt-2 font-display text-2xl font-black text-brand-gold sm:text-3xl short:text-xl kiosk:text-[clamp(1.6rem,3.4vh,2.3rem)]">
                      {copy.highlight}
                    </p>
                  )}
                </div>
              )}

              {/* 4. The actions */}
              <div className="mt-7 flex w-full flex-wrap items-center justify-center gap-x-6 gap-y-3 pb-2 short:mt-3 kiosk:mt-[clamp(1.25rem,3vh,2rem)]">
                <button
                  ref={button}
                  type="button"
                  onClick={onAction}
                  className="btn-primary btn-blink px-8 py-3.5 text-lg tracking-[0.06em] sm:px-10 sm:text-2xl short:py-2 short:text-lg kiosk:px-[3rem] kiosk:py-[clamp(0.9rem,2vh,1.2rem)] kiosk:text-[clamp(1.3rem,2.5vh,1.8rem)]"
                >
                  {copy.button} <ArrowRight className="h-7 w-7" strokeWidth={3} aria-hidden />
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
