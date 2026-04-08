"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

const NAV = [
  { href: "#experience", label: "EXPERIENCE" },
  { href: "#education", label: "EDUCATION" },
  { href: "#skills", label: "SKILLS" },
  { href: "#certifications", label: "CERTIFICATIONS" },
  { href: "#projects", label: "PROJECTS" },
  { href: "#about", label: "ABOUT" },
] as const;

const mobileSpring = {
  type: "spring" as const,
  stiffness: 250,
  damping: 25,
};

const mobileListVariants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.05, delayChildren: 0.05 },
  },
  exit: {},
};

const mobileItemVariants = {
  hidden: { opacity: 0, y: 100 },
  show: {
    opacity: 1,
    y: 0,
    transition: mobileSpring,
  },
  exit: {
    opacity: 0,
    y: 50,
    transition: mobileSpring,
  },
};

export function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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
    <>
      <header className="relative sticky top-0 z-50 border-b border-white/10 bg-black/40 backdrop-blur-md">
        <div className="mx-auto flex h-20 max-w-6xl items-center justify-between gap-4 px-6">
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
      </header>

      {mounted
        ? createPortal(
            <AnimatePresence>
              {menuOpen ? (
                <motion.div
                  key="mobile-nav-overlay"
                  id="mobile-nav-overlay"
                  role="dialog"
                  aria-modal="true"
                  aria-label="Navigation"
                  className="fixed inset-0 z-[9999] flex flex-col bg-black md:hidden"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.4 }}
                >
                  <div className="flex h-20 shrink-0 items-center justify-between border-b border-white/10 px-6">
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

                  <motion.ul
                    className="list-none grow flex flex-col items-center justify-center gap-8 px-6"
                    variants={mobileListVariants}
                    initial="hidden"
                    animate="show"
                    exit="hidden"
                    aria-label="Mobile sections"
                  >
                    {NAV.map((item) => (
                      <motion.li key={item.href} variants={mobileItemVariants}>
                        <Link
                          href={item.href}
                          className="block text-center text-4xl font-bold uppercase text-white"
                          onClick={closeMenu}
                        >
                          {item.label}
                        </Link>
                      </motion.li>
                    ))}
                  </motion.ul>
                </motion.div>
              ) : null}
            </AnimatePresence>,
            document.body,
          )
        : null}
    </>
  );
}
