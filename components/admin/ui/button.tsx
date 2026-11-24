"use client";

import Link from "next/link";
import type { ComponentProps } from "react";
import { HOVER_FILL_LINK, HoverFill } from "@/components/ui/hover-fill";

// Admin buttons follow the public v2 rules: sharp, bordered, outline + fill hover. Primary is solid and inverts on hover
// (the HoverFill rectangle is fg-coloured, so it would be invisible on a solid fg button).
type Variant = "primary" | "secondary" | "danger";
type Size = "sm" | "md";

const BASE = "inline-flex items-center justify-center gap-2 rounded-none border text-base transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fg/70 disabled:pointer-events-none disabled:opacity-50";
const SIZE: Record<Size, string> = { sm: "px-3 py-1 text-sm", md: "px-4 py-2" };
const VARIANT: Record<Variant, string> = {
  primary: "border-fg bg-fg text-bg hover:bg-bg hover:text-fg",
  secondary: `${HOVER_FILL_LINK} border-border-strong text-fg`,
  danger: "border-danger text-danger hover:bg-danger hover:text-bg",
};

export function buttonClass(variant: Variant = "secondary", size: Size = "md", extra = "") {
  return `${BASE} ${SIZE[size]} ${VARIANT[variant]} ${extra}`.trim();
}

type Common = { variant?: Variant; size?: Size; pending?: boolean };

/** Safari paints a focus ring on a mouse-clicked button; keep focus off on click (Tab still works). */
const noMouseFocus = (e: React.MouseEvent) => e.preventDefault();

export function Button({ variant = "secondary", size = "md", pending, className = "", children, disabled, ...rest }: Common & ComponentProps<"button">) {
  return (
    <button
      type="button"
      onMouseDown={noMouseFocus}
      disabled={disabled || pending}
      aria-busy={pending || undefined}
      className={buttonClass(variant, size, className)}
      {...rest}
    >
      {variant === "secondary" ? <HoverFill>{children}</HoverFill> : children}
    </button>
  );
}

export function ButtonLink({ variant = "secondary", size = "md", className = "", children, href, ...rest }: Common & Omit<ComponentProps<typeof Link>, "href"> & { href: string }) {
  return (
    <Link href={href} onMouseDown={noMouseFocus} className={buttonClass(variant, size, className)} {...rest}>
      {variant === "secondary" ? <HoverFill>{children}</HoverFill> : children}
    </Link>
  );
}
