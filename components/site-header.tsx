"use client";

import Link from "next/link";
import { ThemeToggle } from "./theme-toggle";

const NAV = [
  { href: "#experience", label: "Experience" },
  { href: "#education", label: "Education" },
  { href: "#skills", label: "Skills" },
  { href: "#certifications", label: "Certifications" },
  { href: "#projects", label: "Projects" },
  { href: "#about", label: "About" },
] as const;

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-black/40 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-6">
        <Link
          href="#top"
          className="font-display text-xl font-extrabold tracking-tight text-white transition-colors hover:text-neutral-300"
        >
          TM
        </Link>
        <nav className="flex min-w-0 flex-1 items-center justify-end gap-1 overflow-x-auto py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:overflow-visible">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="shrink-0 rounded-md px-2.5 py-1.5 text-[0.72rem] font-medium uppercase tracking-wide text-neutral-300 transition-colors hover:bg-white/10 hover:text-white sm:px-3"
            >
              {item.label}
            </Link>
          ))}
          <div className="ml-1 shrink-0 pl-1 sm:ml-2">
            <ThemeToggle />
          </div>
        </nav>
      </div>
    </header>
  );
}
