"use client";

import { motion, useReducedMotion } from "framer-motion";
import { SCORE_OUT_OF } from "@/data/gameData";

interface ScoreRingProps {
  /** Configured score (never calculated here). */
  score: number;
  className?: string;
}

const R = 42;
const CIRCUMFERENCE = 2 * Math.PI * R;

/** The score as a gold gauge that fills to score / SCORE_OUT_OF, with the number in the middle. */
export function ScoreRing({ score, className = "" }: ScoreRingProps) {
  const reduce = useReducedMotion();
  const filled = Math.max(0, Math.min(1, score / SCORE_OUT_OF));
  return (
    <div className={`relative shrink-0 ${className}`} role="img" aria-label={`Score ${score} out of ${SCORE_OUT_OF}`}>
      <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90 drop-shadow-[0_4px_0_rgb(0_0_0/0.3)]" aria-hidden>
        <circle cx="50" cy="50" r={R + 6} fill="rgb(var(--stage-top-rgb))" />
        <circle cx="50" cy="50" r={R} fill="none" stroke="rgb(255 255 255 / 0.12)" strokeWidth="9" />
        <motion.circle
          cx="50"
          cy="50"
          r={R}
          fill="none"
          stroke="rgb(var(--brand-gold-rgb))"
          strokeWidth="9"
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          initial={{ strokeDashoffset: reduce ? CIRCUMFERENCE * (1 - filled) : CIRCUMFERENCE }}
          animate={{ strokeDashoffset: CIRCUMFERENCE * (1 - filled) }}
          transition={{ duration: reduce ? 0 : 1.1, ease: "easeOut", delay: reduce ? 0 : 0.35 }}
          style={{ filter: "drop-shadow(0 0 4px rgb(var(--brand-gold-rgb) / 0.8))" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center leading-none" aria-hidden>
        <span className="text-[0.6rem] font-bold uppercase tracking-[0.16em] text-brand-gold kiosk:text-[0.75rem]">Score</span>
        <span className="mt-1 font-display text-[1.6rem] font-black text-white kiosk:text-[clamp(1.6rem,3.2vh,2.2rem)]">
          {score}
          <span className="text-[0.55em] text-white/60">/{SCORE_OUT_OF}</span>
        </span>
      </div>
    </div>
  );
}
