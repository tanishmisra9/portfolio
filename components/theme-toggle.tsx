"use client";

import { useTheme } from "next-themes";
import { motion } from "framer-motion";
import { Moon, Sun } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Tooltip } from "@/components/ui/tooltip";

const DIP_IN_MS = 120;
const DIP_OUT_MS = 220;

/**
 * Theme switch as a "dip": a full-screen cover in the OLD background colour fades in, the theme swaps underneath
 * it, then the cover fades out to reveal the new theme. Fading every element's colour instead (the old
 * `theme-fade` approach) made text and background cross through the same grey mid-way, and WebKit repainted the
 * huge hero letters ~160ms after everything else, so they vanished and then darkened late. Under the cover no
 * element is ever mid-transition. Only opacity animates, on a constant background colour.
 */
function dipTo(next: string, setTheme: (t: string) => void, done: () => void) {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    setTheme(next);
    done();
    return;
  }
  const cover = document.createElement("div");
  cover.setAttribute("aria-hidden", "true");
  cover.style.cssText = `position:fixed;inset:0;z-index:10010;pointer-events:none;opacity:0;background:${getComputedStyle(document.body).backgroundColor};transition:opacity ${DIP_IN_MS}ms ease-out`;
  document.body.appendChild(cover);
  const frame = (fn: () => void) => requestAnimationFrame(() => requestAnimationFrame(fn));
  frame(() => {
    cover.style.opacity = "1";
  });
  window.setTimeout(() => {
    setTheme(next);
    // Two frames so the class swap is painted under the cover before it lifts.
    frame(() => {
      cover.style.transition = `opacity ${DIP_OUT_MS}ms ease-in`;
      cover.style.opacity = "0";
      window.setTimeout(() => {
        cover.remove();
        done();
      }, DIP_OUT_MS + 30);
    });
  }, DIP_IN_MS + 50);
}

/** Icon swap without overlap: the outgoing icon fades out first, then the incoming one fades in. A plain
 *  crossfade shows sun and moon superimposed at 50% midway, which reads as a glitch. */
const swap = (incoming: boolean) => ({
  duration: 0.1,
  ease: "easeOut" as const,
  delay: incoming ? 0.1 : 0,
});

export function ThemeToggle({ className = "" }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const dippingRef = useRef(false);
  useEffect(() => setMounted(true), []);

  const isDark = mounted ? resolvedTheme === "dark" : true;
  const label = isDark ? "Switch to light mode" : "Switch to dark mode";
  const toggle = () => {
    if (dippingRef.current) return;
    dippingRef.current = true;
    dipTo(isDark ? "light" : "dark", setTheme, () => {
      dippingRef.current = false;
    });
  };

  return (
    <Tooltip label={isDark ? "Light mode" : "Dark mode"} align="end" className={className}>
      <button
        type="button"
        className="flex shrink-0 items-center justify-center rounded-md p-2 text-muted transition-colors hover:bg-surface hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fg/70"
        aria-label={label}
        onClick={toggle}
      >
        <span className="relative grid h-6 w-6 shrink-0 -translate-y-px place-items-center">
          {/* Icon shows the action a click performs, not the current theme: moon (go dark) while light, sun (go light) while dark. */}
          <motion.span
            aria-hidden
            style={{ gridArea: "1 / 1" }}
            className="flex items-center justify-center"
            initial={false}
            animate={{ opacity: isDark ? 0 : 1 }}
            transition={swap(!isDark)}
          >
            <Moon className="h-5 w-5" />
          </motion.span>
          <motion.span
            aria-hidden
            style={{ gridArea: "1 / 1" }}
            className="flex items-center justify-center"
            initial={false}
            animate={{ opacity: isDark ? 1 : 0 }}
            transition={swap(isDark)}
          >
            <Sun className="h-5 w-5" />
          </motion.span>
        </span>
      </button>
    </Tooltip>
  );
}
