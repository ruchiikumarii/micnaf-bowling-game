"use client";

import { motion, useReducedMotion } from "framer-motion";
import { PINS } from "@/data/gameData";
import { pinPosition, pinRow, PIN_SPACING } from "@/lib/laneLayout";
import type { LanePins } from "@/types/game";

interface RackDiagramProps {
  /** Every pin's state after the throw. */
  lane: LanePins;
  className?: string;
}

const ROW_STEP = 1.75;

/**
 * The rack seen from above, back row at the top: standing pins lit gold with
 * their number, fallen ones dim. A picture only; the pins are listed in words beside it.
 */
export function RackDiagram({ lane, className = "" }: RackDiagramProps) {
  const reduce = useReducedMotion();
  const step = PIN_SPACING / 2;
  return (
    <svg viewBox="-3.95 -0.95 7.9 7.15" className={className} aria-hidden>
      {PINS.map((pin, i) => {
        const { x } = pinPosition(pin.number);
        const cx = x / step;
        // Rows 1.75 apart and columns 1 apart: neighbouring pins sit exactly 2 apart, clear of each other.
        const cy = (3 - pinRow(pin.number)) * ROW_STEP;
        const standing = lane[pin.number] === "up" || lane[pin.number] === "wobble";
        return (
          <motion.g
            key={pin.number}
            initial={reduce ? false : { scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 500, damping: 18, delay: 0.3 + i * 0.04 }}
            style={{ transformOrigin: `${cx}px ${cy}px`, transformBox: "view-box" }}
          >
            <circle
              cx={cx}
              cy={cy}
              r={0.78}
              fill={standing ? "rgb(var(--brand-gold-rgb))" : "rgb(255 255 255 / 0.08)"}
              stroke={standing ? "rgb(255 255 255 / 0.9)" : "rgb(255 255 255 / 0.25)"}
              strokeWidth={0.08}
              strokeDasharray={standing ? undefined : "0.25 0.18"}
              style={standing ? { filter: "drop-shadow(0 0 0.25px rgb(var(--brand-gold-rgb)))" } : undefined}
            />
            <text
              x={cx}
              y={cy + 0.3}
              textAnchor="middle"
              fontSize="0.82"
              fontWeight="900"
              fill={standing ? "rgb(var(--stage-top-rgb))" : "rgb(255 255 255 / 0.35)"}
            >
              {pin.number}
            </text>
          </motion.g>
        );
      })}
    </svg>
  );
}
