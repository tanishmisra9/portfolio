"use client";

import { useTheme } from "next-themes";
import { motion } from "framer-motion";
import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const isDark = mounted ? resolvedTheme === "dark" : true;

  return (
    <button
      type="button"
      className="flex shrink-0 items-center justify-center rounded-md p-2 text-muted transition-colors hover:bg-surface hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fg/70"
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      onClick={() => setTheme(isDark ? "light" : "dark")}
    >
      <span className="relative grid h-6 w-6 shrink-0 place-items-center">
        <motion.span
          aria-hidden
          style={{ gridArea: "1 / 1" }}
          className="flex items-center justify-center"
          initial={false}
          animate={{ opacity: isDark ? 1 : 0 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
        >
          <Moon className="h-6 w-6" />
        </motion.span>
        <motion.span
          aria-hidden
          style={{ gridArea: "1 / 1" }}
          className="flex items-center justify-center"
          initial={false}
          animate={{ opacity: isDark ? 0 : 1 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
        >
          <Sun className="h-6 w-6" />
        </motion.span>
      </span>
    </button>
  );
}
