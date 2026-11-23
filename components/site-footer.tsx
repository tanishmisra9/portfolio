"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const linkClass =
  "rounded-sm transition-colors hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fg/70";

/** Public footer on every page except /admin (own chrome) and /f1 (full-screen intro). */
export function SiteFooter() {
  const pathname = usePathname();
  if (pathname?.startsWith("/admin") || pathname === "/f1") return null;

  return (
    <footer className="px-6 pb-12 pt-6 text-center text-[0.805rem] text-muted">
      © {new Date().getFullYear()} Tanish Misra
      <span aria-hidden="true"> · </span>
      <Link href="/privacy" onMouseDown={(e) => e.preventDefault()} className={linkClass}>
        Privacy Policy
      </Link>
      <span aria-hidden="true"> · </span>
      <Link href="/legal" onMouseDown={(e) => e.preventDefault()} className={linkClass}>
        Legal Notice
      </Link>
    </footer>
  );
}
