"use client";

import { AnimatePresence } from "framer-motion";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  DRUGS,
  FIRST_THROW_COPY,
  FIRST_THROW_SCORE,
  THERAPY_HEADING,
  FRAME_1_SCORE,
  FRAME_2_SCORE,
  GAME_TITLE,
  NOVEL_COPY,
  STRIKE_COPY,
  TRANSITION_COPY,
} from "@/data/gameData";
import { useGameState } from "@/hooks/useGameState";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { joinPinNumbers, laneBefore, rollLane, richToPlain, secondThrowLane } from "@/lib/gameLogic";
import { sessionStage } from "@/lib/gameReducer";
import { validateOutcomeMatrix } from "@/lib/outcomeValidation";
import type { LanePin, LanePins, Pin, SessionStage } from "@/types/game";
import { Dialog } from "@/components/ui/Dialog";
import { AccessiblePinList } from "./AccessiblePinList";
import { BallRack } from "./BallRack";
import { ClosingScreen } from "./ClosingScreen";
import { GameFooter } from "./GameFooter";
import { GameHeader } from "./GameHeader";
import { GameStage } from "./GameStage";
import { IntroScreen } from "./IntroScreen";
import { NameEntryScreen } from "./NameEntryScreen";
import { PathogenInfoDialog } from "./PathogenInfoDialog";
import { PinKey } from "./PinKey";
import { Scorecard } from "./Scorecard";
import type { LanePrompt } from "./SwipeToRoll";
import { TherapyScreen } from "./TherapyScreen";
import { ThrowResultPopup } from "./ThrowResultPopup";
import { TransitionCard } from "./TransitionCard";

if (process.env.NODE_ENV !== "production") {
  const errors = validateOutcomeMatrix();
  if (errors.length) console.error("Outcome matrix validation failed:", errors);
}

interface GameShellProps {
  /** Force the 2D lane (tests / manual fallback). */
  force2D?: boolean;
}

const TITLES: Record<SessionStage, string> = {
  WELCOME: "",
  NAME_ENTRY: GAME_TITLE,
  THERAPY_SELECTION: GAME_TITLE,
  FRAME_1_READY: "Conventional Therapy",
  FRAME_1_ROLLING: "Rolling",
  FRAME_1_RESULT: FIRST_THROW_COPY.heading,
  SECOND_ATTEMPT: "Second Throw",
  TRANSITION: TRANSITION_COPY.heading,
  FRAME_2_READY: NOVEL_COPY.heading,
  FRAME_2_ROLLING: "Rolling",
  FRAME_2_RESULT: STRIKE_COPY.heading,
  SCORECARD: "Results",
  CLOSING_SCREEN: GAME_TITLE,
};

/** Stages shown off the lane (full screens of their own). The therapy choice is a pop-up over the lane. */
const OFF_LANE: readonly SessionStage[] = ["NAME_ENTRY"];

export function GameShell({ force2D = false }: GameShellProps) {
  const reducedMotion = useReducedMotion();
  const game = useGameState(reducedMotion);
  const { state } = game;
  const [confirmReset, setConfirmReset] = useState(false);

  // Touch kiosk: a long press should not open the browser's context menu.
  useEffect(() => {
    if (!window.matchMedia?.("(pointer: coarse)").matches) return;
    const block = (e: Event) => e.preventDefault();
    window.addEventListener("contextmenu", block);
    return () => window.removeEventListener("contextmenu", block);
  }, []);

  const stage = sessionStage(state);

  // Every pin's state on the lane right now, all from the configured outcomes:
  // a full rack before a throw; during and after it, which fall, shake or stay
  // up; on the second throw, what the first left (its fallen pins gone).
  const lane: LanePins = useMemo(() => {
    if (state.phase === "rolling" && state.selectedDrug) {
      return state.frame === 1 && state.attempts === 2 && state.firstThrow ? secondThrowLane(state.firstThrow.lane) : rollLane(state.selectedDrug);
    }
    if (state.phase === "result" && state.result) return state.result.lane;
    // Ready for the second throw: the rack as the first throw left it (fallen pins lying where they fell).
    if (state.phase === "ready" && state.frame === 1 && state.attempts === 1 && state.firstThrow) {
      return Object.fromEntries(
        Object.entries(state.firstThrow.lane).map(([n, s]) => [n, s === "down" || s === "gone" ? "gone" : "up"]),
      ) as LanePins;
    }
    // The transition starts from what the last throw left (the second, or the first if it was declined).
    if (state.phase === "transition" && (state.secondThrow ?? state.firstThrow)) return (state.secondThrow ?? state.firstThrow)!.lane;
    if ((state.phase === "scorecard" || state.phase === "closing") && state.novelThrow) return state.novelThrow.lane;
    return laneBefore();
  }, [state.phase, state.frame, state.attempts, state.selectedDrug, state.result, state.firstThrow, state.secondThrow, state.novelThrow]);

  // Pin labels' accessible names; include the outcome once it is known.
  const showStatus = state.phase === "result" || state.phase === "transition" || state.phase === "scorecard";
  const pinName = useCallback(
    (pin: Pin) => {
      const said: Record<LanePin, string> = { up: "Standing", down: "Down", wobble: "Shaking, still standing", gone: "Down" };
      const status = showStatus ? ` ${said[lane[pin.number]]}.` : "";
      return `Pin ${pin.number}, ${pin.label}: ${richToPlain(pin.name)}.${status} Open pin card.`;
    },
    [showStatus, lane],
  );
  const onPinSelect = useCallback((pin: Pin) => game.openPin(pin.number), [game]);

  const therapy = state.therapy;
  const frame1Score = therapy ? FRAME_1_SCORE[therapy] : null;

  const announcement = useMemo(() => {
    if (stage === "NAME_ENTRY") return "Enter your name to begin.";
    if (stage === "THERAPY_SELECTION") return "Choose your therapy.";
    if (stage === "TRANSITION") return `${TRANSITION_COPY.heading} ${TRANSITION_COPY.rack}`;
    if (stage === "FRAME_2_READY") return `${NOVEL_COPY.heading}: ${NOVEL_COPY.ball}.`;
    if (state.phase === "rolling" && state.selectedDrug) {
      return `Frame ${state.frame}${stage === "SECOND_ATTEMPT" ? ", second throw" : ""}: rolling ${DRUGS[state.selectedDrug].name}.`;
    }
    if (state.phase === "result" && state.result) {
      const r = state.result;
      const standing = r.standing.length ? `Pins ${joinPinNumbers(r.standing)} are still standing.` : "No pins are standing.";
      return `Frame ${r.frame}, ${DRUGS[r.drug].name}: ${r.pinsDown} of ${r.totalPins} pins down. ${standing}`;
    }
    return "";
  }, [stage, state.phase, state.frame, state.selectedDrug, state.result]);

  // HUD pills: the frame, and which throw of it, while bowling.
  const bowling = state.phase === "ready" || state.phase === "rolling" || state.phase === "result";
  const frameBadge = bowling || state.phase === "transition" ? state.frame : null;
  const throwOf = bowling
    ? { n: Math.max(1, state.phase === "ready" ? state.attempts + 1 : state.attempts), of: state.frame === 1 ? 2 : 1 }
    : null;

  // Sounds: the soft "wah" after the first throw, the chime for the strike.
  const { playEnding } = game;
  const firstResult = stage === "FRAME_1_RESULT";
  const strike = stage === "FRAME_2_RESULT";
  useEffect(() => {
    if (firstResult) playEnding("lost");
  }, [firstResult, playEnding]);
  useEffect(() => {
    if (strike && state.novelThrow?.standing.length === 0) playEnding("won");
  }, [strike, state.novelThrow, playEnding]);

  // The card at the top of the lane before each frame's throw, with a throw button.
  const prompt: LanePrompt | undefined =
    stage === "THERAPY_SELECTION"
      ? { greeting: `Hi Dr. ${state.playerName},`, eyebrow: THERAPY_HEADING, text: "Tap a ball to choose your conventional therapy" }
      : stage === "FRAME_1_READY" && therapy
      ? { text: DRUGS[therapy].name }
      : stage === "FRAME_2_READY"
        ? { eyebrow: NOVEL_COPY.heading, text: NOVEL_COPY.ball }
        : undefined;

  const onLane = !(stage === "WELCOME" || OFF_LANE.includes(stage));

  // The greeting pop-up shows once per doctor.
  const [introSeen, setIntroSeen] = useState(false);
  useEffect(() => {
    if (state.phase === "intro") setIntroSeen(false);
  }, [state.phase]);
  const chooseTherapy = useCallback(
    (drug: Parameters<typeof game.selectTherapy>[0]) => {
      game.selectTherapy(drug);
      game.startBowling();
    },
    [game],
  );

  return (
    <div className="flex min-h-[100dvh] flex-col bg-gradient-to-b from-brand-navy to-[rgb(var(--stage-top-rgb))] kiosk:h-[100dvh] kiosk:overflow-hidden">
      {state.phase === "intro" ? (
        <IntroScreen onStart={game.start} pinName={pinName} />
      ) : (
        <>
          <GameHeader
            title={stage === "FRAME_1_READY" && state.attempts === 1 ? TITLES.SECOND_ATTEMPT : TITLES[stage]}
            frame={frameBadge}
            throwOf={throwOf}
            soundOn={state.soundOn}
            onSoundChange={game.setSound}
            onNewSession={() => setConfirmReset(true)}
          />
          <main className="mx-auto flex w-full flex-1 flex-col px-4 py-5 sm:px-8 lg:px-12 lg:py-7 kiosk:min-h-0 kiosk:px-[2.5rem] kiosk:py-[1.5rem]">
            <AnimatePresence mode="wait">
              {stage === "NAME_ENTRY" && <NameEntryScreen key="name" onSubmit={game.submitName} />}
            </AnimatePresence>
            {onLane && (
              // Full-width lane. On the kiosk the ball rack floats over its left
              // edge and the pin key over its right edge; on smaller screens they
              // sit above and below it.
              <div className="relative flex flex-col gap-5 kiosk:min-h-0 kiosk:flex-1">
                <GameStage
                  phase={state.phase}
                  selectedDrug={state.selectedDrug}
                  result={state.result}
                  rollStartedAt={state.rollStartedAt}
                  lineSeed={state.lineSeed}
                  lineAim={state.lineAim}
                  lineDrug={state.frame === 2 ? state.selectedDrug : therapy}
                  rackResetAt={state.rackResetAt}
                  prompt={prompt}
                  interactive={state.phase !== "rolling"}
                  pinName={pinName}
                  onPinSelect={onPinSelect}
                  lane={lane}
                  onRoll={game.roll}
                  force2D={force2D}
                  className="aspect-[4/3] w-full sm:aspect-[16/9] kiosk:aspect-auto kiosk:min-h-0 kiosk:flex-1"
                  wrapperClassName="kiosk:min-h-0 kiosk:flex-1"
                />
                <AccessiblePinList lane={lane} showOutcome={showStatus} />
                {/* Off the kiosk the lane is too small for the prompt card: it sits above it, with its button. */}
                {prompt && (
                  <section
                    aria-label={prompt.eyebrow ?? prompt.text}
                    className="game-panel order-first px-5 py-3.5 text-center kiosk:hidden"
                  >
                    {prompt.eyebrow && <p className="eyebrow text-brand-gold">{prompt.eyebrow}</p>}
                    <p className="mt-1 text-base font-bold leading-snug sm:text-lg">{prompt.text}</p>
                    {prompt.action && (
                      <button type="button" onClick={() => game.roll()} className="btn-primary mt-3 px-6 py-2.5 text-base tracking-[0.06em]">
                        {prompt.action}
                      </button>
                    )}
                  </section>
                )}
                {stage === "TRANSITION" && (
                  // Low on the lane, between the side panels, so the rack reset stays in view above it.
                  <div className="order-first kiosk:absolute kiosk:bottom-[1.5rem] kiosk:left-1/2 kiosk:z-20 kiosk:w-[min(52rem,calc(100%-2*(min(24rem,25%)+2.75rem)))] kiosk:-translate-x-1/2">
                    <TransitionCard score={frame1Score} onContinue={game.startFrame2} />
                  </div>
                )}
                <BallRack
                  phase={state.phase}
                  frame={state.frame}
                  selectedDrug={state.selectedDrug}
                  onSelect={chooseTherapy}
                  className="game-panel order-first p-4 kiosk:absolute kiosk:!bg-none kiosk:!shadow-none kiosk:left-[1.5rem] kiosk:top-[1.5rem] kiosk:z-20 kiosk:w-[min(22rem,24%)] kiosk:bg-transparent kiosk:p-0"
                />
                <PinKey
                  onOpenPin={game.openPin}
                  disabled={state.phase === "rolling"}
                  className="kiosk:absolute kiosk:right-[1.5rem] kiosk:top-[1.5rem] kiosk:z-20 kiosk:w-[min(24rem,25%)]"
                />
              </div>
            )}
          </main>
        </>
      )}

      <GameFooter />

      <p className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {announcement}
      </p>

      {/* After the first throw: the configured score, and one more throw with the same ball. */}
      <ThrowResultPopup
        result={firstResult ? state.firstThrow : null}
        score={therapy ? FIRST_THROW_SCORE[therapy] : null}
        copy={{ heading: FIRST_THROW_COPY.heading, lines: [FIRST_THROW_COPY.body], highlight: FIRST_THROW_COPY.ask, button: FIRST_THROW_COPY.button }}
        tone="attempt"
        onAction={game.takeSecondChance}
      />

      {/* Frame 2: the strike. */}
      <ThrowResultPopup
        result={strike ? state.novelThrow : null}
        score={FRAME_2_SCORE}
        copy={{ heading: STRIKE_COPY.heading, lines: [STRIKE_COPY.body], button: STRIKE_COPY.button }}
        tone="strike"
        onAction={game.showScorecard}
      />

      {/* The greeting and the pins first; then the doctor picks a ball on the lane. */}
      {stage === "THERAPY_SELECTION" && !introSeen && <TherapyScreen name={state.playerName} onStart={() => setIntroSeen(true)} />}

      <Scorecard
        open={stage === "SCORECARD"}
        name={state.playerName}
        therapy={therapy}
        frame1Score={frame1Score}
        frame2Score={FRAME_2_SCORE}
        onContinue={game.showClosing}
      />

      {stage === "CLOSING_SCREEN" && <ClosingScreen name={state.playerName} onContinue={game.newSession} />}

      <PathogenInfoDialog pinNumber={state.openPin} onClose={game.closePin} />

      <Dialog
        open={confirmReset}
        onClose={() => setConfirmReset(false)}
        title="Start a new game?"
        footer={
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button type="button" className="btn-outline justify-center px-6 py-3" onClick={() => setConfirmReset(false)}>
              Keep playing
            </button>
            <button
              type="button"
              className="btn-primary px-6 py-3 text-lg normal-case tracking-normal"
              onClick={() => {
                setConfirmReset(false);
                game.newSession();
              }}
            >
              Start new game
            </button>
          </div>
        }
      >
        <p className="text-lg text-ink-muted">
          This clears the name and both frames, and returns to the start screen for the next doctor.
        </p>
      </Dialog>
    </div>
  );
}
