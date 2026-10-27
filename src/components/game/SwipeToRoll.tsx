"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronUp } from "lucide-react";
import { useMemo, useRef, useState, type MutableRefObject, type PointerEvent } from "react";
import { BALL_RADIUS, BALL_START_Z } from "@/lib/laneLayout";
import { createProjector } from "@/lib/projection";
import type { GamePhase } from "@/types/game";

/** The card at the top of the lane before a roll. */
export interface LanePrompt {
  /** "Hello Dr. …," above the text, if any. */
  greeting?: string;
  eyebrow?: string;
  text: string;
  /** A button on the card that throws the ball (as well as the swipe). */
  action?: string;
}

interface SwipeToRollProps {
  phase: GamePhase;
  /** A ball has been picked. */
  hasBall: boolean;
  width: number;
  height: number;
  aimRef: MutableRefObject<number>;
  onAimingChange: (aiming: boolean) => void;
  /** `aim`: the swipe's direction, -1 (left) to 1 (right). */
  onRoll: (aim?: number) => void;
  prompt?: LanePrompt;
}

/** Fraction of the stage height a full swipe covers. */
const FULL_SWIPE = 0.32;
/** Minimum upward travel (fraction of stage height) to count as a roll. */
const MIN_SWIPE = 0.07;
/** A quick flick also counts, even if short (px per ms). */
const FLICK_SPEED = 0.55;
/** The swipe zone covers the lane below this fraction of the stage height. */
const ZONE_TOP = 0.42;

export function SwipeToRoll({ phase, hasBall, width, height, aimRef, onAimingChange, onRoll, prompt }: SwipeToRollProps) {
  const reduce = useReducedMotion();
  // Once the frame's ball is presented on the lane.
  const enabled = phase === "ready" && hasBall;
  const gesture = useRef<{ id: number; x: number; y: number; samples: { y: number; t: number }[] } | null>(null);
  const [dragging, setDragging] = useState(false);
  const [armed, setArmed] = useState(false);
  // Live drag, for the power meter and the aim arrow (look only: never changes the outcome).
  const [drag, setDrag] = useState({ power: 0, angle: 0 });
  const snapBack = useRef(0);

  const ball = useMemo(() => {
    if (!width || !height) return null;
    const project = createProjector(width, height);
    const c = project(0, BALL_RADIUS, BALL_START_Z);
    const top = project(0, BALL_RADIUS * 2, BALL_START_Z);
    // y is relative to the swipe zone, which starts at ZONE_TOP.
    return { x: c.x, y: c.y - height * ZONE_TOP, r: Math.max(24, Math.abs(c.y - top.y)) };
  }, [width, height]);

  const progressFor = (clientY: number) => {
    const g = gesture.current;
    if (!g || !height) return 0;
    return Math.min(1, Math.max(0, (g.y - clientY) / (height * FULL_SWIPE)));
  };

  const end = (rolled: boolean) => {
    gesture.current = null;
    setDragging(false);
    setArmed(false);
    setDrag({ power: 0, angle: 0 });
    if (rolled) {
      onAimingChange(false);
      return;
    }
    // Ease the ball back to the foul line.
    cancelAnimationFrame(snapBack.current);
    const from = aimRef.current;
    const t0 = performance.now();
    const step = () => {
      const k = Math.min(1, (performance.now() - t0) / 200);
      aimRef.current = from * (1 - k) * (1 - k);
      if (k < 1) snapBack.current = requestAnimationFrame(step);
      else onAimingChange(false);
    };
    snapBack.current = requestAnimationFrame(step);
  };

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (!enabled || gesture.current) return;
    cancelAnimationFrame(snapBack.current);
    try {
      e.currentTarget.setPointerCapture(e.pointerId); // keep tracking if the finger leaves the lane
    } catch {
      /* not supported */
    }
    gesture.current = { id: e.pointerId, x: e.clientX, y: e.clientY, samples: [{ y: e.clientY, t: e.timeStamp }] };
    aimRef.current = 0;
    setDragging(true);
    onAimingChange(true);
  };

  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    const g = gesture.current;
    if (!g || e.pointerId !== g.id) return;
    g.samples.push({ y: e.clientY, t: e.timeStamp });
    if (g.samples.length > 8) g.samples.shift();
    const p = progressFor(e.clientY);
    aimRef.current = p;
    setDrag({ power: p, angle: Math.max(-0.5, Math.min(0.5, Math.atan2(e.clientX - g.x, Math.max(1, g.y - e.clientY)))) });
    const nowArmed = g.y - e.clientY >= height * MIN_SWIPE;
    if (nowArmed !== armed) setArmed(nowArmed);
  };

  const onPointerUp = (e: PointerEvent<HTMLDivElement>) => {
    const g = gesture.current;
    if (!g || e.pointerId !== g.id) return;
    const dy = g.y - e.clientY; // upward is positive
    const sideways = e.clientX - g.x;
    const dx = Math.abs(sideways);
    const first = g.samples[0]!;
    const speed = (first.y - e.clientY) / Math.max(1, e.timeStamp - first.t);
    const upward = dy > dx * 0.6;
    const rolled = enabled && upward && (dy >= height * MIN_SWIPE || (speed >= FLICK_SPEED && dy >= 20));
    if (rolled) {
      aimRef.current = Math.max(aimRef.current, 0.15);
      // Straight up is 0; about 30° to either side is full left (-1) or right (1).
      onRoll(Math.max(-1, Math.min(1, Math.atan2(sideways, Math.max(1, dy)) / 0.5)));
    }
    end(rolled);
  };

  const onPointerCancel = (e: PointerEvent<HTMLDivElement>) => {
    if (gesture.current?.id === e.pointerId) end(false);
  };

  const showHint = enabled && !dragging;
  // Choosing the therapy: only the prompt card (no swipe yet).
  const showPick = phase === "therapy";

  return (
    <div
      className="absolute inset-x-0 bottom-0 z-[5] select-none"
      style={{ top: `${ZONE_TOP * 100}%`, touchAction: enabled ? "none" : "auto", cursor: enabled ? (dragging ? "grabbing" : "grab") : "default" }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
      data-testid="swipe-zone"
    >
      {/* Keyboard / screen reader control sitting on the ball. Pointer clicks
          (detail > 0) are ignored so a tap never rolls; only a swipe does. */}
      {ball && (
        <button
          type="button"
          disabled={!enabled}
          onClick={(e) => {
            if (e.detail === 0 && enabled) onRoll();
          }}
          aria-label="Roll the ball. On the touch screen, swipe the ball up the lane."
          className="absolute rounded-full outline-offset-4 focus-visible:outline focus-visible:outline-4 focus-visible:outline-brand-gold"
          style={{
            left: ball.x - ball.r * 1.15,
            top: ball.y - ball.r * 1.15,
            width: ball.r * 2.3,
            height: ball.r * 2.3,
          }}
        />
      )}

      {/* Ready: a pulsing ring on the ball. */}
      {showHint && ball && !reduce && (
        <motion.span
          className="pointer-events-none absolute rounded-full border-4 border-brand-gold"
          style={{ left: ball.x - ball.r * 1.3, top: ball.y - ball.r * 1.3, width: ball.r * 2.6, height: ball.r * 2.6 }}
          animate={{ scale: [0.85, 1.25], opacity: [0.9, 0] }}
          transition={{ duration: 1.1, repeat: Infinity, ease: "easeOut" }}
          aria-hidden
        />
      )}

      {/* Dragging: the aim arrow from the ball, and the power meter beside it. */}
      {dragging && ball && (
        <>
          <div
            className="pointer-events-none absolute origin-bottom"
            style={{
              left: ball.x - ball.r * 0.45,
              top: ball.y - ball.r * (1.2 + 4 * drag.power) - ball.r,
              width: ball.r * 0.9,
              height: ball.r * (1.2 + 4 * drag.power),
              transform: `rotate(${drag.angle}rad)`,
              transformOrigin: `50% calc(100% + ${ball.r}px)`,
            }}
            aria-hidden
          >
            <svg viewBox="0 0 20 100" preserveAspectRatio="none" className="h-full w-full drop-shadow-[0_3px_0_rgb(0_0_0/0.35)]">
              <path d="M10 0 L20 22 L13 22 L13 100 L7 100 L7 22 L0 22 Z" fill="rgb(var(--brand-gold-rgb))" stroke="rgb(var(--stage-top-rgb))" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
            </svg>
          </div>
          <div
            className="pointer-events-none absolute flex flex-col items-center gap-1"
            style={{ left: ball.x + ball.r * 2.2, top: ball.y - ball.r * 4.2, height: ball.r * 5 }}
            aria-hidden
          >
            <span className="font-display text-xs font-black uppercase tracking-wider text-white drop-shadow">Power</span>
            <div className="relative w-4 flex-1 overflow-hidden rounded-full bg-[rgb(var(--stage-top-rgb)/0.85)] ring-2 ring-white/70 kiosk:w-[1.3rem]">
              <div
                className="absolute inset-x-0 bottom-0 rounded-full bg-gradient-to-t from-brand-red via-brand-gold to-white transition-[height] duration-75"
                style={{ height: `${Math.round(drag.power * 100)}%` }}
              />
            </div>
          </div>
        </>
      )}

      <AnimatePresence>
        {showHint && ball && (
          <motion.div
            key="hint"
            className="pointer-events-none absolute flex flex-col items-center"
            style={{ left: ball.x, top: ball.y - ball.r * 1.4, translateX: "-50%", translateY: "-100%" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            aria-hidden
          >
            {[0, 1, 2].map((i) => (
              <motion.span
                key={i}
                className="-my-2 block text-white drop-shadow"
                animate={reduce ? undefined : { y: [6, -6], opacity: [0.2, 1, 0.2] }}
                transition={reduce ? undefined : { duration: 1.2, repeat: Infinity, delay: (2 - i) * 0.18 }}
              >
                <ChevronUp className="h-9 w-9" strokeWidth={3} />
              </motion.span>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {(showHint || showPick || dragging) && (
        <div
          className={`pointer-events-none absolute left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-[rgb(var(--stage-top-rgb)/0.88)] px-5 py-2 text-center shadow-[0_0_0_3px_rgb(var(--brand-gold-rgb)),0_8px_0_rgb(0_0_0/0.3)] backdrop-blur-sm kiosk:w-auto kiosk:max-w-[min(60rem,calc(100%-2*(min(24rem,25%)+2.75rem)))] kiosk:rounded-2xl kiosk:px-8 kiosk:py-4 ${
            // Before a ball is picked there is no instruction, so off the kiosk
            // (where the card holds only the instruction) there is nothing to show.
            showPick ? "hidden kiosk:block" : ""
          }`}
          style={{ top: -height * ZONE_TOP + 16 }}
        >
          {prompt && (
            <>
              {prompt.greeting && (
                <p className="mb-1 hidden text-lg font-semibold text-white kiosk:block kiosk:text-[min(1.2rem,1.1vw)]">{prompt.greeting}</p>
              )}
              {/* One compact row on the kiosk (text beside the throw button), so the
                  card stays clear of the back row of pins on shorter screens. */}
              <div className={prompt.action && enabled ? "hidden items-center gap-[1.25rem] text-left kiosk:flex" : "contents"}>
                <div className="min-w-0">
                  {prompt.eyebrow && <p className="eyebrow hidden text-brand-gold kiosk:block kiosk:text-[min(0.875rem,0.85vw)]">{prompt.eyebrow}</p>}
                  <p className="mt-1 hidden text-balance text-xl font-bold leading-snug text-white kiosk:block kiosk:text-[min(1.3rem,1.2vw)]">{prompt.text}</p>
                </div>
                {prompt.action && enabled && (
                  <button
                    type="button"
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={() => onRoll()}
                    className="btn-primary pointer-events-auto shrink-0 whitespace-nowrap px-[1.5rem] py-[0.6rem] text-lg tracking-[0.06em] kiosk:text-[min(1.2rem,1.15vw)]"
                  >
                    {prompt.action}
                  </button>
                )}
              </div>
            </>
          )}
          {!showPick && (
            <p className={`text-sm font-bold text-white sm:text-base kiosk:mt-2 kiosk:text-lg kiosk:font-semibold kiosk:text-white/75 ${prompt?.action && !dragging ? "kiosk:hidden" : ""}`} aria-hidden>
              {dragging ? (armed ? "Let go to roll" : "Keep swiping up") : "Swipe the ball up to roll"}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
