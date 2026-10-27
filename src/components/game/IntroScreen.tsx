"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { GAME_SUBTITLE, GAME_TAGLINE } from "@/data/gameData";
import { laneBefore } from "@/lib/gameLogic";
import type { Pin } from "@/types/game";
import { GameStage } from "./GameStage";
import { BrandLogo } from "./BrandLogo";

interface IntroScreenProps {
  onStart: () => void;
  pinName: (pin: Pin) => string;
}

const noop = () => {};

/** All ten pins up on the preview lane. */
const INTRO_LANE = laneBefore();


export function IntroScreen({ onStart, pinName }: IntroScreenProps) {
  const reduce = useReducedMotion();
  const rise = (delay: number) =>
    reduce
      ? {}
      : { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.4, delay } };

  return (
    <main className="menu-rays relative isolate flex flex-1 flex-col overflow-hidden">
      <div className="tricolour-rule relative z-10 h-1.5 shrink-0" aria-hidden />
      <div className="relative z-10 flex flex-1 flex-col kiosk:min-h-0 kiosk:flex-row">
        {/* Left: brand, title, call to action */}
        <section className="relative flex flex-col items-center gap-8 px-6 py-8 text-center sm:px-10 kiosk:w-[44%] kiosk:shrink-0 kiosk:justify-center kiosk:gap-[min(3.25rem,4.4vh)] kiosk:px-[4.5rem] kiosk:py-[min(4rem,5vh)]">
          <motion.div {...rise(0)} className="self-start kiosk:absolute kiosk:left-[4.5rem] kiosk:top-[min(3rem,4vh)]">
            <span className="inline-block rounded-2xl bg-white px-4 py-2.5 shadow-[inset_0_-4px_0_rgb(0_0_0/0.12),0_5px_0_rgb(0_0_0/0.3)]">
              <BrandLogo priority className="h-12 sm:h-14 kiosk:h-[4.2rem]" />
            </span>
          </motion.div>

          <div className="flex flex-col items-center">
            <motion.h1
              className="game-title text-[3.4rem] sm:text-7xl kiosk:text-[6.4rem]"
              {...(reduce
                ? {}
                : {
                    initial: { opacity: 0, scale: 0.4, rotate: -6 },
                    animate: { opacity: 1, scale: 1, rotate: -3 },
                    transition: { type: "spring", stiffness: 260, damping: 13, delay: 0.1 },
                  })}
            >
              <span className="block [--title-fill:white]">CABP</span>
              <span className="block">Challenge</span>
            </motion.h1>

            <motion.p
              {...rise(0.25)}
              className="mt-8 space-y-1 text-xl font-medium leading-snug text-white/80 sm:text-2xl kiosk:mt-[min(2.5rem,3.2vh)] kiosk:text-[1.8rem]"
            >
              <span className="inline-block rounded-full bg-brand-red px-5 py-1.5 font-display font-black uppercase tracking-wide text-white shadow-[inset_0_-3px_0_rgb(0_0_0/0.25),0_4px_0_rgb(0_0_0/0.3)]">
                {GAME_SUBTITLE}
              </span>
              <span className="mt-4 block italic">&ldquo;{GAME_TAGLINE}&rdquo;</span>
            </motion.p>

            <motion.div
              className="mt-10 kiosk:mt-[3rem]"
              {...(reduce
                ? {}
                : {
                    initial: { opacity: 0, y: 30 },
                    animate: { opacity: 1, y: [0, -8, 0] },
                    transition: { opacity: { delay: 0.4 }, y: { duration: 1.6, repeat: Infinity, ease: "easeInOut", delay: 0.4 } },
                  })}
            >
              <button
                type="button"
                onClick={onStart}
                className="btn-primary w-full px-12 py-7 text-3xl tracking-[0.06em] sm:w-auto sm:text-4xl kiosk:px-[4.75rem] kiosk:py-[2.1rem] kiosk:text-[3rem]"
              >
                Start game <ArrowRight className="h-10 w-10 kiosk:h-[3rem] kiosk:w-[3rem]" strokeWidth={3} aria-hidden />
              </button>
            </motion.div>
          </div>
        </section>

        {/* Right: the lane, edge to edge, with the two named balls lined up at the start.
            On the kiosk the empty sky above the lane is cropped off the top. */}
        <motion.div
          {...(reduce ? {} : { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { duration: 0.5, delay: 0.1 } })}
          className="relative aspect-[4/3] w-full overflow-hidden sm:aspect-[16/10] kiosk:my-[2rem] kiosk:mr-[2rem] kiosk:aspect-auto kiosk:min-h-0 kiosk:flex-1 kiosk:neon-frame kiosk:rounded-[2rem]"
        >
          <GameStage
            phase="intro"
            lane={INTRO_LANE}
            selectedDrug={null}
            result={null}
            rollStartedAt={null}
            interactive={false}
            showLabels={false}
            variant="bleed"
            pinName={pinName}
            onPinSelect={noop}
            wrapperClassName="absolute inset-x-0 bottom-0 top-0 kiosk:top-[-22%]"
            className="h-full w-full"
          />

          <p className="sr-only">Preview of the bowling lane with ten pins.</p>
        </motion.div>
      </div>
    </main>
  );
}
