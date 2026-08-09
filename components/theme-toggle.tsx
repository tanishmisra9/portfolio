"use client";

import { useTheme } from "next-themes";
import { motion } from "framer-motion";
import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { Tooltip } from "@/components/ui/tooltip";

export function ThemeToggle({ className = "" }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const isDark = mounted ? resolvedTheme === "dark" : true;
  const label = isDark ? "Switch to light mode" : "Switch to dark mode";

  return (
    <Tooltip label={label} align="end" className={className}>
      <button
        type="button"
        className="flex shrink-0 items-center justify-center rounded-full p-2 text-white transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
        aria-label={label}
        onClick={() => setTheme(isDark ? "light" : "dark")}
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
