"use client";

import { cloneElement, type ComponentProps, type ReactElement } from "react";
import Link from "next/link";
import { HOVER_FILL_LINK, HoverFill } from "@/components/ui/hover-fill";
import { Tooltip } from "@/components/ui/tooltip";

type Common = {
  /** A rendered icon element, e.g. `<ArrowLeft />` (an element, not the component: server components can't pass functions to client ones). */
  icon: ReactElement<{ "aria-hidden"?: boolean }>;
  /** Both the accessible name and the tooltip text. */
  label: string;
  /** Outside spacing, e.g. `mb-10 md:mb-12`; applied to the tooltip wrapper. */
  className?: string;
};
type AsLink = Common & { href: string } & Omit<ComponentProps<"a">, "href" | "className" | "children">;
type AsButton = Common & { href?: undefined } & Omit<ComponentProps<"button">, "className" | "children">;

// The site's one bordered icon-only control: square, fill-up hover (HOVER_FILL_LINK + HoverFill), tooltip, 22px icon.
const CLASSES = `${HOVER_FILL_LINK} inline-flex items-center justify-center border border-border p-[0.6875rem] text-muted transition-colors [&_svg]:size-[1.375rem] [&_svg]:[stroke-width:1.75]`;

// Safari paints a focus ring on a mouse-clicked link/button; keep focus off on click (Tab still works).
const noMouseFocus = (e: React.MouseEvent) => e.preventDefault();

export function IconButton(props: AsLink | AsButton) {
  const { icon, label, className = "", ...rest } = props;
  const content = <HoverFill>{cloneElement(icon, { "aria-hidden": true })}</HoverFill>;
  // !flex w-fit: block-level (no line-box gap under it) but only as wide as the button, so the tooltip centres on it.
  const wrapper = `!flex w-fit ${className}`;

  if ("href" in rest && rest.href !== undefined) {
    const { href, ...anchor } = rest as Omit<AsLink, keyof Common>;
    const external = /^https?:/.test(href);
    return (
      <Tooltip label={label} className={wrapper}>
        {external ? (
          <a href={href} target="_blank" rel="noopener noreferrer" aria-label={label} onMouseDown={noMouseFocus} className={CLASSES} {...anchor}>
            {content}
          </a>
        ) : (
          <Link href={href} aria-label={label} onMouseDown={noMouseFocus} className={CLASSES} {...(anchor as object)}>
            {content}
          </Link>
        )}
      </Tooltip>
    );
  }

  const button = rest as Omit<AsButton, keyof Common>;
  return (
    <Tooltip label={label} className={wrapper}>
      <button type="button" aria-label={label} onMouseDown={noMouseFocus} className={CLASSES} {...button}>
        {content}
      </button>
    </Tooltip>
  );
}
