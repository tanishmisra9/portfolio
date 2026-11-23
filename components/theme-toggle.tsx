"use client";

import { useTheme } from "next-themes";
import { motion } from "framer-motion";
import { Moon, Sun } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Tooltip } from "@/components/ui/tooltip";

/** Must outlast the 300ms `html.theme-fade` transition in globals.css. */
const THEME_FADE_MS = 350;

export function ThemeToggle({ className = "" }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const fadeTimerRef = useRef<number | undefined>(undefined);
  const prevThemeRef = useRef(resolvedTheme);
  useEffect(() => setMounted(true), []);

  // The theme swap fades via a short-lived `theme-fade` class on <html>
  // (globals.css), so hover transitions are untouched the rest of the time;
  // under reduced motion the same class turns every transition off instead.
  // Keyed off resolvedTheme (not the click) so a change synced from another
  // tab is covered too. This child effect runs before ThemeProvider's effect
  // swaps the theme class, so the class is in place for the colour change.
  // Known tradeoff: text and bg both pass through mid-grey at the midpoint.
  // Not a View Transition: it snapshots the header and Safari drops its
  // backdrop-filter for the duration.
  useEffect(() => {
    const prev = prevThemeRef.current;
    prevThemeRef.current = resolvedTheme;
    if (!prev || prev === resolvedTheme) return;
    const root = document.documentElement;
    root.classList.add("theme-fade");
    // Restart, so a quick double toggle can't strip the class mid-fade.
    window.clearTimeout(fadeTimerRef.current);
    fadeTimerRef.current = window.setTimeout(
      () => root.classList.remove("theme-fade"),
      THEME_FADE_MS,
    );
  }, [resolvedTheme]);
  // Unmounting mid-fade must not leave the class stuck (it overrides every transition).
  useEffect(
    () => () => {
      window.clearTimeout(fadeTimerRef.current);
      document.documentElement.classList.remove("theme-fade");
    },
    [],
  );

  const isDark = mounted ? resolvedTheme === "dark" : true;
  const label = isDark ? "Switch to light mode" : "Switch to dark mode";
  const toggle = () => setTheme(isDark ? "light" : "dark");

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
