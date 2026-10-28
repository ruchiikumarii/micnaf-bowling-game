"use client";

import { getPin } from "@/lib/gameLogic";
import type { PinNumber } from "@/types/game";
import { Dialog } from "@/components/ui/Dialog";
import { RichText } from "@/components/ui/RichText";

interface PathogenInfoDialogProps {
  pinNumber: PinNumber | null;
  onClose: () => void;
}

/** Pin card: the pin's number and full wording. Closes with the ✕, a tap outside it, or Escape. */
export function PathogenInfoDialog({ pinNumber, onClose }: PathogenInfoDialogProps) {
  const pin = pinNumber ? getPin(pinNumber) : null;

  return (
    <Dialog
      open={pin !== null}
      onClose={onClose}
      title={
        pin ? (
          <span className="flex items-center gap-4">
            <span
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand-gold font-display text-xl font-black text-brand-navy shadow-[inset_0_2px_0_rgb(255_255_255/0.5),inset_0_-4px_0_rgb(0_0_0/0.2),0_0_0_3px_rgb(var(--stage-top-rgb)),0_0_18px_rgb(var(--brand-gold-rgb)/0.5)] sm:h-14 sm:w-14 sm:text-2xl"
              aria-label={`Pin ${pin.number}`}
            >
              {pin.number}
            </span>
            <span className="min-w-0">
              <RichText value={pin.name} />
            </span>
          </span>
        ) : (
          ""
        )
      }
    />
  );
}
