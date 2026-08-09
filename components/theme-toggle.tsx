"use client";

import { useTheme } from "next-themes";
import { motion } from "framer-motion";
import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { flushSync } from "react-dom";
import { Tooltip } from "@/components/ui/tooltip";

export function ThemeToggle({ className = "" }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const isDark = mounted ? resolvedTheme === "dark" : true;
  const label = isDark ? "Switch to light mode" : "Switch to dark mode";

  const toggleTheme = (e: React.MouseEvent<HTMLButtonElement>) => {
    const next = isDark ? "light" : "dark";
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (reducedMotion || !document.startViewTransition) {
      setTheme(next);
      return;
    }

    // Circular reveal instead of a cross-fade: a cross-fade between inverted
    // light/dark palettes always passes through a mid-grey where every bit of
    // text hits ~zero contrast — the longer the transition, the more visible
    // that washout reads as a flicker. A boundary where every pixel is always
    // fully one theme or the other means the washout can't happen. A feathered
    // mask (vs. a hard clip-path) softens that boundary into a gradient band.
    const { clientX: x, clientY: y } = e;
    const radius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y),
    );
    const feather = 120;
    const durationMs =
      parseFloat(
        getComputedStyle(document.documentElement).getPropertyValue(
          "--theme-transition-duration",
        ),
      ) || 650;

    const mask = (r: number) =>
      `radial-gradient(circle at ${x}px ${y}px, black ${Math.max(r - feather, 0)}px, transparent ${r}px)`;

    document
      .startViewTransition(() => flushSync(() => setTheme(next)))
      .ready.then(() => {
        document.documentElement.animate(
          {
            maskImage: [mask(0), mask(radius)],
            WebkitMaskImage: [mask(0), mask(radius)],
          },
          {
            duration: durationMs,
            easing: "cubic-bezier(0.22, 1, 0.36, 1)",
            pseudoElement: "::view-transition-new(root)",
          },
        );
      });
  };

  return (
    <Tooltip label={label} align="end" className={className}>
      <button
        type="button"
        className="flex shrink-0 items-center justify-center rounded-md p-2 text-muted transition-colors hover:bg-surface hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fg/70"
        aria-label={label}
        onClick={toggleTheme}
      >
        <span className="relative grid h-6 w-6 shrink-0 -translate-y-px place-items-center">
          {/* Icon shows the action a click performs, not the current theme: moon (go dark) while light, sun (go light) while dark. */}
          <motion.span
            aria-hidden
            style={{ gridArea: "1 / 1" }}
            className="flex items-center justify-center"
            initial={false}
            animate={{ opacity: isDark ? 0 : 1 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            <Moon className="h-5 w-5" />
          </motion.span>
          <motion.span
            aria-hidden
            style={{ gridArea: "1 / 1" }}
            className="flex items-center justify-center"
            initial={false}
            animate={{ opacity: isDark ? 1 : 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            <Sun className="h-5 w-5" />
          </motion.span>
        </span>
      </button>
    </Tooltip>
  );
}
