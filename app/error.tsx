"use client";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
      <h1 className="font-display text-7xl font-extrabold tracking-tighter text-white md:text-9xl">
        500
      </h1>
      <p className="mt-4 text-lg text-neutral-400">Something went wrong.</p>
      <button
        onClick={reset}
        className="mt-8 rounded-full border border-white/15 bg-white/[0.06] px-6 py-3 text-xs uppercase tracking-[0.2em] text-neutral-200 backdrop-blur-xl transition-colors hover:border-white/30 hover:bg-white/[0.1]"
      >
        Try again
      </button>
    </main>
  );
}
