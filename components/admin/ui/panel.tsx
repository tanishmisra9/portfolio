import type { ReactNode } from "react";

/** The admin card: sharp, hairline border, glass surface. `inset` is the quieter nested variant. */
export function Panel({ inset, className = "", children }: { inset?: boolean; className?: string; children: ReactNode }) {
  return (
    <div className={`border border-border ${inset ? "p-3" : "bg-surface p-4 backdrop-blur-md md:p-6"} ${className}`}>
      {children}
    </div>
  );
}

/** Sharp label tag: Draft, Hidden, Changed, New. Never a pill. */
export function Tag({ children, strong }: { children: ReactNode; strong?: boolean }) {
  return (
    <span className={`inline-block border px-2 py-0.5 text-xs ${strong ? "border-fg text-fg" : "border-border-strong text-muted"}`}>
      {children}
    </span>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return <p className="border border-dashed border-border-strong p-8 text-center text-dim">{children}</p>;
}

/** Page title for admin pages: solid, Title case, one scale. */
export function AdminHeading({ title, subtitle, actions }: { title: string; subtitle?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
      <div className="min-w-0">
        <h1 className="font-display text-3xl/[1.4] font-extrabold tracking-tight text-fg md:text-4xl/[1.4]">{title}</h1>
        {subtitle && <p className="max-w-2xl text-base text-muted">{subtitle}</p>}
      </div>
      {actions}
    </div>
  );
}
