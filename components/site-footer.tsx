"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronUp } from "lucide-react";
import { HOVER_FILL_LINK, HoverFill } from "@/components/ui/hover-fill";
import { Tooltip } from "@/components/ui/tooltip";
import { copyText } from "@/lib/copy-text";
import type { SocialLink } from "@/types/content";

const SOCIAL_ORDER = ["LinkedIn", "GitHub", "Instagram", "Resume", "Email"];
const SOCIAL_TIPS: Record<string, string> = {
  LinkedIn: "Connect on LinkedIn",
  GitHub: "My projects on GitHub",
  Instagram: "Photos on Instagram",
  Resume: "Download PDF",
};

const linkClass = `${HOVER_FILL_LINK} inline-block px-3 py-1.5`;

// Safari paints a focus ring on a mouse-clicked <a>/<button>; keep focus off on click (Tab still works).
const noMouseFocus = { onMouseDown: (e: React.MouseEvent) => e.preventDefault() };

function backToTop() {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  window.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" });
}

function safeDecode(s: string) {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
}

function CopyEmail({ email, label, href }: { email: string; label: string; href: string }) {
  const [copied, setCopied] = useState(false);
  // One timer: a second click restarts the 1.5s window instead of stacking timers, and unmounting clears it.
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  const copy = async () => {
    if (await copyText(email)) {
      setCopied(true);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 1500);
    } else {
      // Both the clipboard API and the legacy copy failed: fall back to opening the mail client.
      window.location.href = href;
    }
  };
  return (
    <Tooltip label={copied ? "Copied!" : "Copy email"}>
      <button type="button" onClick={copy} {...noMouseFocus} className={linkClass}>
        <HoverFill>{label}</HoverFill>
      </button>
    </Tooltip>
  );
}

function SocialItem({ link }: { link: SocialLink }) {
  if (/^mailto:/i.test(link.href)) {
    // Always copy the real address from the mailto: href; `display` is free text (e.g. "Email me") and only the label.
    const email = safeDecode(link.href.slice("mailto:".length).split("?")[0]);
    return <CopyEmail email={email} label={link.display || email} href={link.href} />;
  }
  const resumeFilename =
    link.label === "Resume" ? link.href.split("?")[0].split("/").pop() : undefined;
  const anchor = (
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
  const tip = link.tooltip || SOCIAL_TIPS[link.label];
  return tip ? <Tooltip label={tip}>{anchor}</Tooltip> : anchor;
}

/** Always in the footer, so it needs no admin entry; a link labelled "Instagram" added in /admin/portfolio/social replaces it. */
const INSTAGRAM: SocialLink = { id: "social-instagram", label: "Instagram", href: "https://www.instagram.com/tanishtakespics/", display: "Instagram" };

const rank = (l: SocialLink) => {
  const i = SOCIAL_ORDER.indexOf(l.label);
  return i === -1 ? SOCIAL_ORDER.length : i;
};

/** Public footer on every page except /admin (own chrome) and /f1 (full-screen intro). */
export function SiteFooter({ social }: { social: SocialLink[] }) {
  const pathname = usePathname();
  if (pathname?.startsWith("/admin") || pathname === "/f1") return null;
  const links = social.some((l) => l.label === "Instagram") ? social : [...social, INSTAGRAM];

  return (
    <footer className="px-6 pb-10 pt-20 md:pt-28">
      <div className="mx-auto max-w-6xl">
      <div className="grid gap-y-10 md:grid-cols-[1fr_auto_1fr] md:items-start md:gap-x-8">
        {/* min-w-0 + xl:flex-nowrap: at xl+ the whole row (incl. the email) stays on one line and may run under the back-to-top chevron, which sits 75px above it. */}
        <div className="min-w-0">
          {links.length > 0 && (
            <>
          <p className="font-display text-3xl font-extrabold tracking-tight text-fg md:text-4xl">Stay in touch</p>
          <ul className="-mx-3 mt-3 flex flex-wrap gap-x-1 gap-y-1 text-base text-muted md:text-lg xl:w-max xl:flex-nowrap">
            {[...links].sort((a, b) => rank(a) - rank(b)).map((link) => (
              <li key={link.id}>
                <SocialItem link={link} />
              </li>
            ))}
          </ul>
            </>
          )}
        </div>

        <div className="md:relative md:-top-[75px] md:justify-self-center">
          <Tooltip label="Back to top">
            <button
              type="button"
              onClick={backToTop}
              {...noMouseFocus}
              aria-label="Back to top"
              className={`${HOVER_FILL_LINK} -m-3 flex items-center justify-center p-3 text-muted transition-colors`}
            >
              <HoverFill>
                <ChevronUp className="size-8" strokeWidth={1.25} aria-hidden />
              </HoverFill>
            </button>
          </Tooltip>
        </div>

        <div className="md:text-right">
          {/* Invisible twin of the "Stay in touch" heading so both link rows share one baseline at any heading size. */}
          <p aria-hidden className="invisible hidden font-display text-3xl font-extrabold tracking-tight md:block md:text-4xl">&nbsp;</p>
          <ul className="-mx-3 flex flex-wrap gap-x-1 gap-y-1 text-base text-muted md:mt-3 md:justify-end md:text-lg">
            <li>
              <Tooltip label="Site owner and copyright">
                <Link href="/legal" {...noMouseFocus} className={linkClass}>
                  <HoverFill>Legal Notice</HoverFill>
                </Link>
              </Tooltip>
            </li>
            <li>
              <Tooltip label="How this site handles data">
                <Link href="/privacy" {...noMouseFocus} className={linkClass}>
                  <HoverFill>Privacy Policy</HoverFill>
                </Link>
              </Tooltip>
            </li>
          </ul>
        </div>
      </div>
      <p className="mt-12 text-sm text-dim">© {new Date().getFullYear()} Tanish Misra</p>
      </div>
    </footer>
  );
}
