"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { ThemeToggle } from "./theme-toggle";

const NAV = [
  { href: "#experience", label: "EXPERIENCE" },
  { href: "#education", label: "EDUCATION" },
  { href: "#skills", label: "SKILLS" },
  { href: "#certifications", label: "CERTIFICATIONS" },
  { href: "#projects", label: "PROJECTS" },
  { href: "#about", label: "ABOUT" },
] as const;

const listVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.07, delayChildren: 0.08 },
  },
  exit: { opacity: 0, transition: { duration: 0.2 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 28 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.38, ease: [0.22, 1, 0.36, 1] as const },
  },
  exit: { opacity: 0, y: 16, transition: { duration: 0.2 } },
};

export function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!menuOpen) return;
    const prev = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = prev;
    };
  }, [menuOpen]);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  const closeMenu = () => setMenuOpen(false);

  const logoClassName =
    "font-display text-xl font-extrabold tracking-tight text-white transition-colors hover:text-neutral-300";

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-black/40 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-6">
        <Link href="#top" className={`shrink-0 ${logoClassName}`}>
          TM
        </Link>

        <div className="flex min-w-0 flex-1 items-center justify-end gap-x-8">
          <nav
            className="hidden items-center gap-x-8 md:flex"
            aria-label="Primary"
          >
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm font-medium uppercase tracking-wide text-neutral-400 transition-colors hover:text-white"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <ThemeToggle />

          <button
            type="button"
            className="flex shrink-0 items-center justify-center rounded-md p-2 text-neutral-400 transition-colors hover:bg-white/10 hover:text-white md:hidden"
            aria-expanded={menuOpen}
            aria-controls="mobile-nav-overlay"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            onClick={() => setMenuOpen((o) => !o)}
          >
            {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {menuOpen ? (
          <motion.div
            key="mobile-nav-overlay"
            id="mobile-nav-overlay"
            role="dialog"
            aria-modal="true"
            aria-label="Navigation"
            className="fixed inset-0 z-[100] flex flex-col bg-black/95 backdrop-blur-md md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
          >
            <div className="flex h-16 shrink-0 items-center justify-between border-b border-white/10 px-6">
              <Link
                href="#top"
                className={logoClassName}
                onClick={closeMenu}
              >
                TM
              </Link>
              <button
                type="button"
                className="flex items-center justify-center rounded-md p-2 text-neutral-400 transition-colors hover:bg-white/10 hover:text-white"
                aria-label="Close menu"
                onClick={closeMenu}
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <motion.nav
              className="flex flex-1 flex-col items-center justify-center gap-6 px-6 pb-24"
              variants={listVariants}
              initial="hidden"
              animate="show"
              exit="hidden"
              aria-label="Mobile sections"
            >
              {NAV.map((item) => (
                <motion.div key={item.href} variants={itemVariants}>
                  <Link
                    href={item.href}
                    className="block text-center text-4xl font-bold text-white"
                    onClick={closeMenu}
                  >
                    {item.label}
                  </Link>
                </motion.div>
              ))}
            </motion.nav>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </header>
  );
}
