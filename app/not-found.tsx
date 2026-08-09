import Link from "next/link";

export default function NotFound() {
  return (
    <main id="main-content" tabIndex={-1} className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
      <h1 className="font-display text-7xl font-extrabold tracking-tighter text-fg md:text-9xl">
        404
      </h1>
      <p className="mt-4 text-lg text-muted">
        This page doesn&apos;t exist.
      </p>
      <Link
        href="/"
        className="mt-8 rounded-full border border-border-strong bg-fg/[0.06] px-6 py-3 text-xs uppercase tracking-[0.2em] text-fg backdrop-blur-xl transition-colors hover:border-fg/30 hover:bg-fg/[0.1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fg/70"
      >
        Back home
      </Link>
    </main>
  );
}
