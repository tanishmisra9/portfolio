"use client";

import { useState, useTransition } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { logout } from "@/lib/auth/actions";
import { publishAll } from "@/lib/admin/actions";
import { useAdminDirty } from "@/components/admin/dirty-context";

export function AdminHeader() {
  const pathname = usePathname();
  const isDashboard = pathname === "/admin";
  const [pending, startTransition] = useTransition();
  const [justPublished, setJustPublished] = useState(false);
  const dirty = useAdminDirty();

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
        <Link href="/admin" className="text-sm text-muted transition-colors hover:text-fg">
          ← Dashboard
        </Link>
      )}
      <span className="text-sm text-dim">
        Edits save as drafts. Nothing goes live until you publish.
      </span>
      <div className="ml-auto flex items-center gap-3">
        {dirty && <span className="text-xs text-red-500">This page has unsaved changes</span>}
        <button
          type="button"
          disabled={pending}
          onClick={handlePublish}
          className="rounded bg-fg px-4 py-1.5 text-sm text-bg disabled:opacity-50"
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
