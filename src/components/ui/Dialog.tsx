"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { X } from "lucide-react";
import { useEffect, useId, useRef, type ReactNode } from "react";

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  eyebrow?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  size?: "md" | "lg";
}

export function Dialog({ open, onClose, title, eyebrow, children, footer, size = "md" }: DialogProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const restoreRef = useRef<HTMLElement | null>(null);
  const titleId = useId();
  const reduce = useReducedMotion();
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return;
    restoreRef.current = document.activeElement as HTMLElement | null;
    const panel = panelRef.current;
    const first = panel?.querySelector<HTMLElement>(FOCUSABLE);
    (first ?? panel)?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onCloseRef.current();
        return;
      }
      if (e.key !== "Tab" || !panel) return;
      const items = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (items.length === 0) return;
      const firstItem = items[0]!;
      const lastItem = items[items.length - 1]!;
      if (e.shiftKey && document.activeElement === firstItem) {
        e.preventDefault();
        lastItem.focus();
      } else if (!e.shiftKey && document.activeElement === lastItem) {
        e.preventDefault();
        firstItem.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      const target = restoreRef.current;
      if (target && document.contains(target)) target.focus();
    };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduce ? 0 : 0.18 }}
        >
          <div className="absolute inset-0 bg-ink/70 backdrop-blur-[2px]" onClick={onClose} aria-hidden />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            tabIndex={-1}
            className={`game-panel m-3 flex max-h-[92vh] w-full flex-col overflow-hidden sm:m-0 ${
              size === "lg" ? "sm:max-w-3xl" : "sm:max-w-xl"
            }`}
            initial={reduce ? false : { scale: 0.7, y: 30, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={reduce ? { opacity: 0 } : { scale: 0.9, y: 16, opacity: 0 }}
            transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 340, damping: 22 }}
          >
            <div
              className={`flex justify-between gap-4 px-6 sm:px-8 ${
                children || footer ? "items-start border-b border-white/15 pb-4 pt-6" : "items-center py-7"
              }`}
            >
              <div className="min-w-0">
                {eyebrow && <div className="eyebrow mb-1 text-brand-gold">{eyebrow}</div>}
                <h2 id={titleId} className="font-display text-2xl font-black leading-tight text-white [text-shadow:0_3px_0_rgb(0_0_0/0.3)] sm:text-3xl">
                  {title}
                </h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="hud-btn -mr-1 shrink-0"
                aria-label="Close"
              >
                <X className="h-6 w-6" strokeWidth={3} aria-hidden />
              </button>
            </div>
            {children && <div className="overflow-y-auto px-6 py-5 sm:px-8">{children}</div>}
            {footer && <div className={`px-6 pb-6 pt-4 sm:px-8 ${children ? "border-t border-white/15" : ""}`}>{footer}</div>}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
