"use client";

import { useMemo } from "react";
import { PINS } from "@/data/gameData";
import { PIN_HEIGHT, PIN_MAX_RADIUS, pinPosition, pinRow } from "@/lib/laneLayout";
import { createProjector } from "@/lib/projection";
import { useElementSize } from "@/hooks/useElementSize";
import type { GamePhase, LanePins, Pin, PinNumber } from "@/types/game";
import { PinLabel } from "./PinLabel";

interface PinLabelsOverlayProps {
  phase: GamePhase;
  lane: LanePins;
  interactive: boolean;
  /** Narrow lane: tags show the number only. */
  compact?: boolean;
  pinName: (pin: Pin) => string;
  onPinSelect: (pin: Pin) => void;
}

type Slot = "below" | "above" | "left" | "right";
interface Placed {
  slot: Slot;
  /** Anchor point, in px from the top-left of the lane. */
  x: number;
  y: number;
}

function rootFontPx(): number {
  if (typeof window === "undefined") return 16;
  return parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
}

/** Rough on-screen size of a pin tag in rem (number over bold 0.9rem text). */
function tagSizeRem(pin: Pin, compact: boolean): { w: number; h: number } {
  if (compact) {
    const small = typeof window !== "undefined" && window.innerWidth <= 420;
    return small ? { w: 1.4, h: 1.4 } : { w: 2.15, h: 2.15 };
  }
  return { w: Math.max(2.4, pin.label.length * 0.53 + 1.2), h: 2.85 };
}

/** Where each row prefers its tag. The two back corners go out to the side. */
function preferences(n: PinNumber, x: number): Slot[] {
  const outward: Slot = x < 0 ? "left" : "right";
  switch (pinRow(n)) {
    case 0:
      return ["below"];
    case 1:
      return ["below", "above", outward];
    case 2:
      return ["above", outward, "below"];
    default:
      // Back row: the corners go out to the side, the middle two above.
      return Math.abs(x) > 0.5 ? [outward, "above"] : ["above", outward];
  }
}

/**
 * Placement order: head pin, then the back row (so its tags take the free
 * space above the rack, beside their own pins), then the rows in between.
 */
const ORDER: PinNumber[] = [1, 7, 8, 9, 10, 4, 5, 6, 2, 3];

/**
 * Pin number/label chips positioned over the lane. The camera is fixed, so a
 * plain DOM overlay using the same projection as the scene stays aligned
 * with both the 3D and 2D renderers, and the chips are ordinary buttons.
 *
 * In the triangle rack the pins stand close together, so each tag takes the
 * first free spot around its own pin (below, above or to the side), never
 * overlapping another tag and never stacking up towards the question card.
 */
export function PinLabelsOverlay({ phase, lane, interactive, compact = false, pinName, onPinSelect }: PinLabelsOverlayProps) {
  const [ref, { width, height }] = useElementSize<HTMLDivElement>();

  const placed = useMemo(() => {
    if (!width || !height) return null;
    const project = createProjector(width, height);
    const rem = rootFontPx();
    const gap = (compact ? 0.12 : 0.3) * rem;
    const taken: { l: number; t: number; r: number; b: number }[] = [];
    const out = new Map<PinNumber, Placed>();

    for (const n of ORDER) {
      const pin = PINS.find((p) => p.number === n)!;
      const { x, z } = pinPosition(n);
      const size = tagSizeRem(pin, compact);
      const w = size.w * rem;
      const h = size.h * rem;
      const head = project(x, PIN_HEIGHT + 0.02, z);
      const base = project(x, 0, z + (pinRow(n) === 0 ? 0.12 : 0.05));
      const mid = project(x, PIN_HEIGHT * 0.55, z);
      const halfPin = Math.abs(project(x + PIN_MAX_RADIUS, PIN_HEIGHT * 0.55, z).x - mid.x);

      const rectFor = (slot: Slot): Placed & { l: number; t: number; r: number; b: number } => {
        switch (slot) {
          case "above":
            return { slot, x: head.x, y: head.y, l: head.x - w / 2, r: head.x + w / 2, t: head.y - h, b: head.y };
          case "below":
            return { slot, x: base.x, y: base.y, l: base.x - w / 2, r: base.x + w / 2, t: base.y, b: base.y + h };
          case "left": {
            const ax = mid.x - halfPin - gap;
            return { slot, x: ax, y: mid.y, l: ax - w, r: ax, t: mid.y - h / 2, b: mid.y + h / 2 };
          }
          case "right": {
            const ax = mid.x + halfPin + gap;
            return { slot, x: ax, y: mid.y, l: ax, r: ax + w, t: mid.y - h / 2, b: mid.y + h / 2 };
          }
        }
      };
      const clear = (c: { l: number; t: number; r: number; b: number }) =>
        c.l >= 0 && c.r <= width && taken.every((o) => c.r + gap <= o.l || o.r + gap <= c.l || c.b + gap <= o.t || o.b + gap <= c.t);

      // Preferred spots first, then any other side, before accepting an overlap.
      const prefs = preferences(n, x);
      const all = [...prefs, ...((["below", "above", "left", "right"] as Slot[]).filter((s) => !prefs.includes(s)))];
      const pick = all.map(rectFor).find(clear) ?? rectFor(prefs[0]!);
      taken.push(pick);
      out.set(n, { slot: pick.slot, x: pick.x, y: pick.y });
    }
    return out;
  }, [width, height, compact]);

  const ANCHOR: Record<Slot, string> = {
    above: "-translate-x-1/2 -translate-y-full",
    below: "-translate-x-1/2",
    left: "-translate-x-full -translate-y-1/2",
    right: "-translate-y-1/2",
  };

  return (
    <div ref={ref} className="pointer-events-none absolute inset-0 z-10">
      {placed &&
        PINS.map((pin) => {
          const at = placed.get(pin.number)!;
          const falls = lane[pin.number] === "down";
          // No tag for a pin that has gone over or that an earlier throw cleared,
          // and none while the rack is being reset.
          const fallen = phase === "transition" || lane[pin.number] === "gone" || ((phase === "result" || phase === "scorecard" || phase === "closing") && falls);
          // While the ball rolls the camera follows it, so the tags (aligned to the
          // bowler's-end view) step aside until the pins have settled.
          const fading = phase === "rolling";
          if (fallen) return null;
          return (
            <div
              key={pin.number}
              className={`absolute transition-opacity duration-300 ${ANCHOR[at.slot]} ${
                fading ? "pointer-events-none opacity-0" : "pointer-events-auto"
              }`}
              style={{ left: at.x, top: at.y, transitionDelay: "0s" }}
            >
              <PinLabel pin={pin} interactive={interactive} accessibleName={pinName(pin)} onSelect={onPinSelect} />
            </div>
          );
        })}
    </div>
  );
}
