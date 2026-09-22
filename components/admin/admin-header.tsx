"use client";

import { useState, useTransition } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { logout } from "@/lib/auth/actions";
import { publishAll } from "@/lib/admin/actions";
import { useAdminDirty } from "@/components/admin/dirty-context";

const SECTION_NAMES: Record<string, string> = {
  portfolio: "Portfolio",
  photos: "Photos",
  quotes: "Quotes",
  blog: "Blog",
  radio: "Radio",
};

/** One level up: /admin/photos/3 -> /admin/photos, /admin/photos -> /admin. */
function parentOf(pathname: string): { href: string; label: string } {
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length > 2) {
    return { href: "/" + segments.slice(0, 2).join("/"), label: SECTION_NAMES[segments[1]] ?? "previous page" };
  }
  return { href: "/admin", label: "Dashboard" };
}

export function AdminHeader({ hasChanges }: { hasChanges: boolean }) {
  const pathname = usePathname();
  const isDashboard = pathname === "/admin";
  const parent = parentOf(pathname ?? "/admin");
  const [pending, startTransition] = useTransition();
  const [justPublished, setJustPublished] = useState(false);
  const [showChanges, setShowChanges] = useState(false);
  const { dirty, changes } = useAdminDirty();

  function handlePublish() {
    if (
      dirty &&
      !confirm(
        "This page has unsaved changes that won't be included in the publish. Save your edits first, or continue to publish without them?",
      )
    ) {
      return;
    }
    startTransition(async () => {
      await publishAll();
      setJustPublished(true);
      setTimeout(() => setJustPublished(false), 3000);
    });
  }

  return (
    <div className="sticky top-0 z-50 flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-border bg-surface px-6 py-3 backdrop-blur-md lg:grid lg:grid-cols-[1fr_auto_1fr]">
      <div className="flex items-center lg:justify-self-start">
        {!isDashboard && (
          <Link
            href={parent.href}
            aria-label={`Back to ${parent.label}`}
            onMouseDown={(e) => e.preventDefault()}
            className="-my-2 ml-2 flex h-11 w-11 items-center justify-center rounded text-muted transition-colors hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fg/70"
          >
            <ArrowLeft className="h-5 w-5" aria-hidden />
          </Link>
        )}
      </div>
      <span className="order-last w-full text-center text-sm text-dim lg:order-none lg:w-auto">
        Edits save as drafts. Nothing goes live until you publish.
      </span>
      <div className="relative ml-auto flex items-center gap-3 lg:justify-self-end">
        {dirty && (
          <button
            type="button"
            onClick={() => setShowChanges((v) => !v)}
            className="text-sm text-red-500 underline decoration-red-500/40 underline-offset-2"
          >
            This page has unsaved changes
          </button>
        )}
        {showChanges && changes.length > 0 && (
          <div className="absolute right-0 top-full mt-2 w-56 rounded-md border border-border bg-surface p-2 shadow-lg backdrop-blur-md">
            <p className="mb-1 px-2 text-sm text-dim">Changed:</p>
            {changes.map((c) => (
              <a
                key={c.key}
                href={`#section-${c.key}`}
                onClick={() => setShowChanges(false)}
                className="block rounded px-2 py-1 text-sm text-fg hover:bg-fg/5"
              >
                {c.label}
              </a>
            ))}
          </div>
        )}
        <button
          type="button"
          disabled={pending || !hasChanges}
          onClick={handlePublish}
          className="rounded bg-fg px-4 py-1.5 text-base text-bg disabled:opacity-50"
        >
          {pending ? "Publishing..." : justPublished ? "Published ✓" : hasChanges ? "Publish" : "Up to date"}
        </button>
        <ThemeToggle />
        <form action={logout}>
          <button type="submit" className="text-sm text-dim transition-colors hover:text-fg">
            Log out
          </button>
        </form>
      </div>
    </div>
  );
}
