"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronUp } from "lucide-react";
import { HOVER_FILL_LINK, HoverFill } from "@/components/ui/hover-fill";
import { Tooltip } from "@/components/ui/tooltip";
import type { SocialLink } from "@/types/content";

const SOCIAL_ORDER = ["LinkedIn", "GitHub", "Resume", "Email"];

const linkClass = `${HOVER_FILL_LINK} inline-block px-3 py-1.5`;

// Safari paints a focus ring on a mouse-clicked <a>/<button>; keep focus off on click (Tab still works).
const noMouseFocus = { onMouseDown: (e: React.MouseEvent) => e.preventDefault() };

function backToTop() {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  window.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" });
}

function CopyEmail({ email }: { email: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(email);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard blocked: the address is still plain, selectable text.
    }
  };
  return (
    <Tooltip label={copied ? "Copied" : "Copy email"}>
      <button type="button" onClick={copy} {...noMouseFocus} className={linkClass}>
        <HoverFill>{email}</HoverFill>
      </button>
    </Tooltip>
  );
}

function SocialItem({ link }: { link: SocialLink }) {
  if (link.href.startsWith("mailto:")) {
    return <CopyEmail email={link.display || link.href.slice(7)} />;
  }
  const resumeFilename =
    link.label === "Resume" ? link.href.split("?")[0].split("/").pop() : undefined;
  return (
    <a
      href={link.href}
      {...noMouseFocus}
      className={linkClass}
      {...(resumeFilename ? { download: resumeFilename } : {})}
      {...(link.href.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}
    >
      <HoverFill>{link.label}</HoverFill>
    </a>
  );
}

const rank = (l: SocialLink) => {
  const i = SOCIAL_ORDER.indexOf(l.label);
  return i === -1 ? SOCIAL_ORDER.length : i;
};

/** Public footer on every page except /admin (own chrome) and /f1 (full-screen intro). */
export function SiteFooter({ social }: { social: SocialLink[] }) {
  const pathname = usePathname();
  if (pathname?.startsWith("/admin") || pathname === "/f1") return null;

  return (
    <footer className="px-6 pb-10 pt-20 md:pt-28">
      <div className="mx-auto max-w-6xl">
      <div className="grid gap-y-10 md:grid-cols-[1fr_auto_1fr] md:items-start md:gap-x-8">
        <div>
          {social.length > 0 && (
            <>
          <p className="font-display text-2xl font-semibold text-fg md:text-3xl">Stay in touch</p>
          <ul className="-mx-3 mt-3 flex flex-wrap gap-x-1 gap-y-1 text-base text-muted md:text-lg">
            {[...social].sort((a, b) => rank(a) - rank(b)).map((link) => (
              <li key={link.id}>
                <SocialItem link={link} />
              </li>
            ))}
          </ul>
            </>
          )}
        </div>

        <div className="md:justify-self-center">
          <Tooltip label="Back to top">
            <button
              type="button"
              onClick={backToTop}
              {...noMouseFocus}
              aria-label="Back to top"
              className="-m-3 flex items-center justify-center p-3 text-muted transition-colors hover:bg-fg/10 hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fg/70 active:bg-fg/20"
            >
              <ChevronUp className="size-8" strokeWidth={2} aria-hidden />
            </button>
          </Tooltip>
        </div>

        <div className="md:text-right">
          <ul className="-mx-3 flex flex-wrap gap-x-1 gap-y-1 text-base text-muted md:mt-12 md:justify-end md:text-lg">
            <li>
              <Link href="/legal" {...noMouseFocus} className={linkClass}>
                <HoverFill>Legal Notice</HoverFill>
              </Link>
            </li>
            <li>
              <Link href="/privacy" {...noMouseFocus} className={linkClass}>
                <HoverFill>Privacy Policy</HoverFill>
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <p className="mt-12 text-sm text-dim">© {new Date().getFullYear()} Tanish Misra</p>
      </div>
    </footer>
  );
}
