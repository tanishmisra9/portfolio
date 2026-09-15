import Link from "next/link";
import type { Components } from "react-markdown";

const highlightLinkClassName =
  "font-bold text-fg/80 transition-colors duration-300 ease-out hover:text-fg focus-visible:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fg/70";

/**
 * Shared between the public bio (about-contact-section.tsx) and the admin bio editor's
 * live preview, so what the owner sees while editing is exactly what publishes. Only
 * inline formatting (bold, links) is expected — `p` collapses to a fragment so the
 * caller's own styled <p> stays the one paragraph wrapper.
 */
export const bioMarkdownComponents: Components = {
  p: ({ children }) => <>{children}</>,
  strong: ({ children }) => <strong className="font-bold text-fg">{children}</strong>,
  a: ({ href, children }) => {
    if (!href) return <>{children}</>;
    if (href.startsWith("/")) {
      return (
        <Link href={href} className={highlightLinkClassName}>
          {children}
        </Link>
      );
    }
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={highlightLinkClassName}>
        {children}
      </a>
    );
  },
};
