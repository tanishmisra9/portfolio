import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
      <h1 className="font-display text-7xl font-extrabold tracking-tighter text-white md:text-9xl">
        404
      </h1>
      <p className="mt-4 text-lg text-neutral-400">
        This page doesn&apos;t exist.
      </p>
      <Link
        href="/"
        className="mt-8 rounded-full border border-white/15 bg-white/[0.06] px-6 py-3 text-xs uppercase tracking-[0.2em] text-neutral-200 backdrop-blur-xl transition-colors hover:border-white/30 hover:bg-white/[0.1]"
      >
        Back home
      </Link>
    </main>
  );
}
