import { DISCLAIMER } from "@/data/gameData";

export function GameFooter() {
  return (
    <footer className="border-t border-line bg-surface px-4 py-3 sm:px-8 lg:px-12 kiosk:py-[min(0.75rem,1.2vh)]" data-testid="disclaimer">
      <p className="text-sm leading-snug text-ink-muted sm:text-[0.95rem]">{DISCLAIMER}</p>
    </footer>
  );
}
