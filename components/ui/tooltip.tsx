"use client";

import { cloneElement, useId, useRef, useState, type ReactElement } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

// ponytail: magic numbers kept local, not worth a shared constants file for 3 numbers used once
const SHOW_DELAY_MS = 200;
const TAP_AUTO_HIDE_MS = 1500;

type Align = "start" | "center" | "end";
type Side = "bottom" | "left";

const ALIGN_CLASSES: Record<Align, string> = {
  start: "left-0",
  center: "left-1/2 -translate-x-1/2",
  end: "right-0",
};

export function Tooltip({
  label,
  children,
  align = "center",
  side = "bottom",
  className,
}: {
  label: string;
  children: ReactElement;
  align?: Align;
  /** "left" opens the bubble beside the trigger instead of below it — needed in tightly-packed lists where a below-anchored bubble would overlap the next row. */
  side?: Side;
  /** Extra classes appended to the wrapper (always `relative inline-flex`). To position the wrapper itself absolutely, use `!absolute` (Tailwind's important-prefix) so it reliably overrides the default `relative`. */
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const reducedMotion = useReducedMotion();
  const showTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const autoHideTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const show = (delay: number) => {
    clearTimeout(showTimer.current);
    showTimer.current = setTimeout(() => setOpen(true), delay);
  };
  const hide = () => {
    clearTimeout(showTimer.current);
    clearTimeout(autoHideTimer.current);
    setOpen(false);
  };
  const tap = () => {
    clearTimeout(showTimer.current);
    setOpen(true);
    clearTimeout(autoHideTimer.current);
    autoHideTimer.current = setTimeout(() => setOpen(false), TAP_AUTO_HIDE_MS);
  };

  const trigger = open
    ? cloneElement(children as ReactElement<{ "aria-describedby"?: string }>, {
        "aria-describedby": id,
      })
    : children;

  return (
    <span
      className={`relative inline-flex${className ? ` ${className}` : ""}`}
      onMouseEnter={() => show(SHOW_DELAY_MS)}
      onMouseLeave={hide}
      onFocusCapture={() => show(0)}
      onBlurCapture={hide}
      onClick={tap}
    >
      {trigger}
      <AnimatePresence>
        {open && (
          <motion.span
            role="tooltip"
            id={id}
            initial={
              reducedMotion
                ? { opacity: 0 }
                : side === "left"
                  ? { opacity: 0, x: 4 }
                  : { opacity: 0, y: -4 }
            }
            animate={{ opacity: 1, x: 0, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className={`pointer-events-none absolute z-[60] whitespace-nowrap rounded-full border border-border-strong bg-fg/[0.08] px-3.5 py-1.5 font-sans text-[0.6rem] uppercase tracking-[0.18em] text-fg shadow-[inset_0_1px_0_0_rgba(255,255,255,0.18),0_10px_30px_-12px_rgba(0,0,0,0.6)] backdrop-blur-xl ${
              side === "left"
                ? "right-full top-1/2 mr-2 -translate-y-1/2"
                : `top-full mt-2 ${ALIGN_CLASSES[align]}`
            }`}
          >
            {label}
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  );
}
