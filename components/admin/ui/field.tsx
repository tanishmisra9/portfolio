import type { ComponentProps, ReactNode } from "react";

/** The one admin field style: sharp, strong border, visible focus ring. */
export const fieldClass =
  "w-full rounded-none border border-border-strong bg-transparent px-3 py-2 text-base text-fg outline-none placeholder:text-dim focus-visible:ring-2 focus-visible:ring-fg/70 disabled:opacity-50";

export function Input({ className = "", ...rest }: ComponentProps<"input">) {
  return <input className={`${fieldClass} ${className}`} {...rest} />;
}
export function Textarea({ className = "", ...rest }: ComponentProps<"textarea">) {
  return <textarea className={`${fieldClass} ${className}`} {...rest} />;
}
export function Select({ className = "", ...rest }: ComponentProps<"select">) {
  return <select className={`${fieldClass} ${className}`} {...rest} />;
}

/** Label + control + optional hint and error, as one <label> so the control is named by it. */
export function Field({ label, hint, error, className = "", children }: { label: string; hint?: ReactNode; error?: string | null; className?: string; children: ReactNode }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1 block text-base text-dim">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-sm text-dim">{hint}</span>}
      {error && <span role="alert" className="mt-1 block text-sm text-danger">{error}</span>}
    </label>
  );
}
