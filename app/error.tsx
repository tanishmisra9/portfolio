"use client";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main id="main-content" tabIndex={-1} className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
      <h1 className="font-display text-7xl font-extrabold tracking-tighter text-fg md:text-9xl">
        500
      </h1>
      <p className="mt-4 text-lg text-muted">Something went wrong.</p>
      <button
        onClick={reset}
        className="mt-8 rounded-full border border-border-strong bg-fg/[0.06] px-6 py-3 text-xs uppercase tracking-[0.2em] text-fg backdrop-blur-xl transition-colors hover:border-fg/30 hover:bg-fg/[0.1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fg/70"
      >
        Try again
      </button>
    </main>
  );
}
