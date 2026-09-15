"use client";

import { useState, useTransition } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { logout } from "@/lib/auth/actions";
import { publishAll } from "@/lib/admin/actions";
import { useAdminDirty } from "@/components/admin/dirty-context";

export function AdminHeader() {
  const pathname = usePathname();
  const isDashboard = pathname === "/admin";
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
    <div className="sticky top-0 z-50 flex flex-wrap items-center gap-4 border-b border-border bg-surface px-6 py-3 backdrop-blur-md">
      {!isDashboard && (
        <Link href="/admin" aria-label="Back to dashboard" className="text-muted transition-colors hover:text-fg">
          <ArrowLeft className="h-5 w-5" aria-hidden />
        </Link>
      )}
      <span className="text-sm text-dim">
        Edits save as drafts. Nothing goes live until you publish.
      </span>
      <div className="relative ml-auto flex items-center gap-3">
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
          disabled={pending}
          onClick={handlePublish}
          className="rounded bg-fg px-4 py-1.5 text-base text-bg disabled:opacity-50"
        >
          {pending ? "Publishing..." : justPublished ? "Published ✓" : "Publish"}
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
