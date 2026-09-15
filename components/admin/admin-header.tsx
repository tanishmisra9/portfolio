"use client";

import { useState, useTransition } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { logout } from "@/lib/auth/actions";
import { publishAll } from "@/lib/admin/actions";

export function AdminHeader() {
  const pathname = usePathname();
  const isDashboard = pathname === "/admin";
  const [pending, startTransition] = useTransition();
  const [justPublished, setJustPublished] = useState(false);

  return (
    <div className="flex flex-wrap items-center gap-4 border-b border-border px-6 py-3">
      {!isDashboard && (
        <Link href="/admin" className="text-sm text-muted transition-colors hover:text-fg">
          ← Dashboard
        </Link>
      )}
      <span className="text-sm text-dim">
        Edits save as drafts. Nothing goes live until you publish.
      </span>
      <div className="ml-auto flex items-center gap-3">
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              await publishAll();
              setJustPublished(true);
              setTimeout(() => setJustPublished(false), 3000);
            })
          }
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
