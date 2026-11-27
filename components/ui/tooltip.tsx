"use client";

import {
  cloneElement,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ReactElement,
} from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, m as motion, useReducedMotion } from "framer-motion";

// ponytail: magic numbers kept local, not worth a shared constants file for a few numbers used once
const SHOW_DELAY_MS = 500;
/** After a visible tooltip hides, a hover within this window shows the next one at once (moving along the nav). */
const SKIP_DELAY_MS = 400;
const TAP_AUTO_HIDE_MS = 1500;

// Shared by every Tooltip: when the last visible one hid. Infinity-ago until one has shown.
let lastHiddenAt = -Infinity;
const GAP = 8;
const MARGIN = 8;

type Align = "start" | "center" | "end";

/**
 * Where the bubble goes, in document coordinates: below the trigger, flipped above when there's no room
 * below, clamped MARGIN px inside the viewport horizontally. Ported from Telogify's placeBubble.
 */
function place(
  a: DOMRect,
  b: DOMRect,
  align: Align,
): { left: number; top: number } {
  const sx = window.scrollX;
  const sy = window.scrollY;
  const vw = document.documentElement.clientWidth;
  const pref =
    align === "start" ? a.left : align === "end" ? a.right - b.width : (a.left + a.right) / 2 - b.width / 2;
  const min = MARGIN;
  const max = vw - MARGIN - b.width;
  const left = sx + (max < min ? min : Math.min(Math.max(pref, min), max));
  const fitsBelow = a.bottom + GAP + b.height <= window.innerHeight - MARGIN;
  const fitsAbove = a.top - GAP - b.height >= MARGIN;
  const above = !fitsBelow && fitsAbove;
  return { left, top: sy + (above ? a.top - GAP - b.height : a.bottom + GAP) };
}

export function Tooltip({
  label,
  children,
  align = "center",
  className,
}: {
  label: string;
  children: ReactElement;
  /** Preferred horizontal anchor (before the viewport clamp). */
  align?: Align;
  /** Extra classes appended to the wrapper (always `relative inline-flex`). To position the wrapper itself absolutely, use `!absolute` (Tailwind's important-prefix) so it reliably overrides the default `relative`. */
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null);
  const id = useId();
  const reducedMotion = useReducedMotion();
  const showTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const autoHideTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const wrapperRef = useRef<HTMLSpanElement>(null);
  const bubbleRef = useRef<HTMLSpanElement>(null);
  const openRef = useRef(false);
  openRef.current = open;

  // The bubble lives in a portal on <body>, so it needs the document: render it only after mount.
  useEffect(() => setMounted(true), []);

  useEffect(
    () => () => {
      clearTimeout(showTimer.current);
      clearTimeout(autoHideTimer.current);
    },
    [],
  );

  const show = (delay: number) => {
    clearTimeout(showTimer.current);
    showTimer.current = setTimeout(() => setOpen(true), delay);
  };
  const hide = () => {
    clearTimeout(showTimer.current);
    clearTimeout(autoHideTimer.current);
    if (openRef.current) lastHiddenAt = performance.now();
    setOpen(false);
  };
  // Warm: a tooltip just hid (or is still up), so the next hover skips the delay.
  const hoverDelay = () => (performance.now() - lastHiddenAt < SKIP_DELAY_MS ? 0 : SHOW_DELAY_MS);
  const tap = () => {
    clearTimeout(showTimer.current);
    setOpen(true);
    clearTimeout(autoHideTimer.current);
    autoHideTimer.current = setTimeout(() => setOpen(false), TAP_AUTO_HIDE_MS);
  };

  // Measure trigger + bubble before paint so it never flashes in the wrong spot. On close the last
  // position is kept so the exit fade plays where the bubble was.
  useLayoutEffect(() => {
    if (!open) return;
    const wrapper = wrapperRef.current;
    const bubble = bubbleRef.current;
    if (!wrapper || !bubble) return;
    setPos(place(wrapper.getBoundingClientRect(), bubble.getBoundingClientRect(), align));
  }, [open, label, align]);

  // The portal is anchored to document coordinates, so a trigger in a sticky element (the header)
  // would leave it behind on scroll: close instead.
  useEffect(() => {
    if (!open) return;
    const sx = window.scrollX;
    const sy = window.scrollY;
    const w0 = window.innerWidth;
    // Mobile URL-bar collapse and the on-screen keyboard fire resize without changing the width: ignore those.
    const onResize = () => {
      if (window.innerWidth !== w0) hide();
    };
    const onScroll = () => {
      if (Math.abs(window.scrollX - sx) <= 2 && Math.abs(window.scrollY - sy) <= 2) return;
      hide();
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
    };
  }, [open]);

  const trigger = open
    ? cloneElement(children as ReactElement<{ "aria-describedby"?: string }>, {
        "aria-describedby": id,
      })
    : children;

  return (
    <span
      ref={wrapperRef}
      className={`relative inline-flex${className ? ` ${className}` : ""}`}
      onMouseEnter={() => show(hoverDelay())}
      onMouseLeave={hide}
      onFocusCapture={() => show(0)}
      onBlurCapture={hide}
      onClick={tap}
    >
      {trigger}
      {mounted &&
        createPortal(
          <AnimatePresence>
            {open && (
              <motion.span
                ref={bubbleRef}
                role="tooltip"
                id={id}
                initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.14 }}
                style={{
                  left: pos?.left ?? 0,
                  top: pos?.top ?? 0,
                  visibility: pos ? "visible" : "hidden",
                }}
                className="pointer-events-none absolute z-[10003] w-max max-w-[calc(100vw-1rem)] border-[1.5px] border-fg bg-bg px-2.5 py-1.5 [font-family:system-ui,-apple-system,sans-serif] text-xs font-normal text-fg shadow-[3px_3px_0_rgb(var(--fg-rgb)/0.25)]"
              >
                {label}
              </motion.span>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </span>
  );
}
