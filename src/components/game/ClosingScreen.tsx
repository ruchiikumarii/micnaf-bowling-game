"use client";

import { motion, useReducedMotion } from "framer-motion";
import { RotateCcw } from "lucide-react";
import { useEffect, useRef } from "react";
import { CLOSING_COPY } from "@/data/gameData";
import { BrandLogo } from "./BrandLogo";

interface ClosingScreenProps {
  /** The doctor's name (shown as text). */
  name: string;
  /** Back to the welcome screen for the next doctor. */
  onContinue: () => void;
}

/** The last screen: a personal thank-you in a pop-up over the lane (supplied copy, draft pending approval). */
export function ClosingScreen({ name, onContinue }: ClosingScreenProps) {
  const reduce = useReducedMotion();
  const button = useRef<HTMLButtonElement>(null);

  useEffect(() => button.current?.focus(), []);

  const [thanks, ...message] = CLOSING_COPY.lines;

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8"
      initial={reduce ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: reduce ? 0 : 0.25 }}
    >
      <div className="absolute inset-0 bg-ink/70 backdrop-blur-[2px]" aria-hidden />
      <div className="menu-rays pointer-events-none absolute inset-0 overflow-hidden !bg-none opacity-70" aria-hidden />
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby="closing-heading"
        className="game-panel max-h-[calc(100dvh-3rem)] w-full max-w-2xl overflow-y-auto text-center kiosk:max-w-[52rem]"
        initial={reduce ? false : { scale: 0.6, opacity: 0, y: 40 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 260, damping: 22 }}
      >
        <div className="flex flex-col items-center px-6 py-8 sm:px-12 sm:py-10 kiosk:px-[3.5rem] kiosk:py-[clamp(1.75rem,4.4vh,3rem)]">
          <span className="mb-5 rounded-xl bg-white px-3 py-1.5 shadow-[inset_0_-3px_0_rgb(0_0_0/0.12),0_3px_0_rgb(0_0_0/0.3)] kiosk:mb-[clamp(1rem,2.4vh,1.5rem)]">
            <BrandLogo logo="productLogo" className="h-10 sm:h-12 kiosk:h-[clamp(2.8rem,5.4vh,3.8rem)]" />
          </span>
          <h2
            id="closing-heading"
            className="game-title text-4xl normal-case [--title-fill:white] sm:text-5xl kiosk:text-[clamp(2.6rem,5.4vh,3.6rem)]"
          >
            {CLOSING_COPY.salutation} Dr. {name},
          </h2>

          <p className="mt-5 text-xl font-bold text-brand-gold sm:text-2xl kiosk:mt-[clamp(1.1rem,2.6vh,1.6rem)] kiosk:text-[clamp(1.35rem,2.6vh,1.75rem)]">
            {thanks}
          </p>
          <div className="mt-3 max-w-xl space-y-2 text-base leading-relaxed text-white/80 sm:text-lg kiosk:max-w-[42rem] kiosk:text-[clamp(1.1rem,2.1vh,1.35rem)]">
            {message.map((line) => (
              <p key={line}>{line}</p>
            ))}
          </div>


          <button
            ref={button}
            type="button"
            onClick={onContinue}
            className="btn-primary btn-blink mb-2 mt-7 px-10 py-3.5 text-xl tracking-[0.06em] sm:text-2xl kiosk:mt-[clamp(1.25rem,3vh,2rem)] kiosk:px-[3rem] kiosk:py-[clamp(0.9rem,2vh,1.2rem)] kiosk:text-[clamp(1.35rem,2.6vh,1.75rem)]"
          >
            <RotateCcw className="h-7 w-7" strokeWidth={3} aria-hidden /> {CLOSING_COPY.button}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
